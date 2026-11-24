import 'dotenv/config';
import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { hashPassword, readDb, verifyPasswordHash, writeDb } from './server/store';
import type { OrderStatus, PaymentStatus } from './src/types';

const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.resolve(process.cwd(), 'server', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Session secret: use env var when provided, otherwise strong ephemeral random secret in memory
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 16
    ? process.env.ADMIN_SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

interface SessionPayload {
  id: string;
  email: string;
  role: 'admin';
  exp: number;
}

function signToken(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload;
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (payload.role !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  adminSession?: SessionPayload;
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = auth.slice(7).trim();
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired admin session' });
    return;
  }
  req.adminSession = session;
  next();
}

const createOrderSchema = z
  .object({
    customer_name: z.string().trim().min(2, 'Full name is required').max(120),
    customer_phone: z.string().trim().min(7, 'Valid WhatsApp phone number is required').max(30),
    delivery_type: z.enum(['delivery', 'pickup']),
    delivery_address: z.string().trim().max(300).optional().nullable(),
    preferred_delivery_time: z.string().trim().max(100).optional().nullable(),
    additional_instructions: z.string().trim().max(500).optional().nullable(),
    items: z
      .array(
        z.object({
          food_id: z.string().min(1),
          quantity: z.number().int().min(1).max(50),
        })
      )
      .min(1),
  })
  .refine(
    (data) =>
      data.delivery_type === 'pickup' ||
      (typeof data.delivery_address === 'string' && data.delivery_address.trim().length >= 4),
    {
      message: 'Delivery address is required for delivery orders',
      path: ['delivery_address'],
    }
  );

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Full name is required').max(120),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().min(7, 'Phone number is required').max(30),
  subject: z.string().trim().min(2, 'Subject is required').max(150),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(2000),
});

const foodSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(''),
  price: z.number().min(0).max(10_000_000),
  category_id: z.string().nullable(),
  image_url: z.string().trim().max(500).default(''),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  sort_order: z.number().int().min(0).max(1000).default(0),
});

const settingsPatchSchema = z.object({
  restaurant_name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  whatsapp_number: z.string().trim().min(7).max(25).optional(),
  phone_number: z.string().trim().min(7).max(30).optional(),
  location: z.string().trim().min(3).max(250).optional(),
  opening_hours: z.string().trim().min(2).max(250).optional(),
  delivery_fee: z.number().min(0).max(1_000_000).optional(),
  currency_symbol: z.string().trim().min(1).max(5).optional(),
  logo_url: z.string().trim().max(500).nullable().optional(),
  hero_image_url: z.string().trim().max(500).nullable().optional(),
  hero_heading: z.string().trim().min(3).max(200).optional(),
  hero_subtext: z.string().trim().min(3).max(600).optional(),
  about_story: z.string().trim().max(4000).optional(),
  mission_statement: z.string().trim().max(1000).optional(),
  vision_statement: z.string().trim().max(1000).optional(),
  social_instagram: z.string().trim().max(300).optional(),
  social_facebook: z.string().trim().max(300).optional(),
  social_tiktok: z.string().trim().max(300).optional(),
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  // Serve uploaded restaurant assets safely
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Public bootstrap data
  app.get('/api/public/bootstrap', (_req, res) => {
    const db = readDb();
    const catMap = new Map(db.categories.map((c) => [c.id, c]));
    const foods = db.foods.map((f) => ({
      ...f,
      category: f.category_id ? catMap.get(f.category_id) || null : null,
    }));
    const categories = [...db.categories].sort((a, b) => a.sort_order - b.sort_order);
    res.json({
      settings: db.settings,
      categories,
      foods,
    });
  });

  // Public Order Request submission (authoritative server-side price & total calculation)
  app.post('/api/public/orders', (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid order details' });
      return;
    }

    const db = readDb();
    const foodMap = new Map(db.foods.map((f) => [f.id, f]));
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    let subtotal = 0;
    const newItems: typeof db.orderItems = [];

    for (const item of parsed.data.items) {
      const food = foodMap.get(item.food_id);
      if (!food) {
        res.status(400).json({ error: 'Selected meal was not found on the menu' });
        return;
      }
      if (!food.is_available) {
        res.status(400).json({ error: `${food.name} is currently unavailable` });
        return;
      }
      const lineTotal = Number(food.price) * item.quantity;
      subtotal += lineTotal;
      newItems.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        food_id: food.id,
        food_name: food.name,
        unit_price: Number(food.price),
        quantity: item.quantity,
        subtotal: lineTotal,
      });
    }

    const deliveryFee =
      parsed.data.delivery_type === 'delivery' ? Number(db.settings.delivery_fee || 0) : 0;
    const totalAmount = subtotal + deliveryFee;

    const newOrder = {
      id: orderId,
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone,
      delivery_type: parsed.data.delivery_type,
      delivery_address:
        parsed.data.delivery_type === 'delivery'
          ? parsed.data.delivery_address?.trim() || null
          : null,
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      preferred_delivery_time: parsed.data.preferred_delivery_time?.trim() || null,
      additional_instructions: parsed.data.additional_instructions?.trim() || null,
      status: 'pending' as OrderStatus,
      payment_status: 'pending_payment' as PaymentStatus,
      payment_verified_at: null,
      order_source: 'whatsapp_request',
      created_at: now,
      updated_at: now,
    };

    db.orders.unshift(newOrder);
    db.orderItems.push(...newItems);
    writeDb(db);

    res.status(201).json({
      order: { ...newOrder, order_items: newItems },
    });
  });

  // Public Contact Enquiry submission
  app.post('/api/public/enquiries', (req, res) => {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid enquiry form' });
      return;
    }
    const db = readDb();
    const enquiry = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      email: parsed.data.email?.trim() || null,
      phone: parsed.data.phone,
      subject: parsed.data.subject,
      message: parsed.data.message,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    db.enquiries.unshift(enquiry);
    writeDb(db);
    res.status(201).json({ enquiry });
  });

  function timingSafeEqualString(a: string, b: string): boolean {
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  }

  // Admin Auth Status (checks if first-run claim is needed)
  app.get('/api/admin/auth-status', (_req, res) => {
    const db = readDb();
    const envPasscode = (process.env.ADMIN_PASSCODE || process.env.ADMIN_INITIAL_PASSWORD || '').trim();
    const needsInitialSetup = !db.admin && !envPasscode;
    res.json({ needsInitialSetup });
  });

  // One-time atomic Admin Setup Claim (only when env passcode is unset and no admin exists)
  app.post('/api/admin/setup', (req, res) => {
    const db = readDb();
    const envPasscode = (process.env.ADMIN_PASSCODE || process.env.ADMIN_INITIAL_PASSWORD || '').trim();
    if (db.admin || envPasscode) {
      res.status(403).json({ error: 'Admin passcode is already configured' });
      return;
    }

    const setupSchema = z.object({
      password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    });

    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid setup input' });
      return;
    }

    const admin = {
      id: crypto.randomUUID(),
      email: 'admin@uniquerestaurant.ng',
      passwordHash: hashPassword(parsed.data.password),
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    };

    db.admin = admin;
    writeDb(db);

    const token = signToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
      exp: Date.now() + 12 * 60 * 60 * 1000,
    });

    res.status(201).json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: 'admin',
        mustChangePassword: false,
      },
    });
  });

  // Admin Login (password-only)
  app.post('/api/admin/login', (req, res) => {
    const loginSchema = z.object({
      password: z.string().min(1, 'Password is required').max(128),
    });
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Password is required' });
      return;
    }

    const db = readDb();
    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    const envInitialPassword = (process.env.ADMIN_INITIAL_PASSWORD || '').trim();

    // Configured process.env.ADMIN_PASSCODE always overrides any claimed fallback hash
    if (envPasscode) {
      if (!timingSafeEqualString(parsed.data.password, envPasscode)) {
        res.status(401).json({ error: 'Invalid admin password' });
        return;
      }
      const adminId = db.admin?.id || 'env-admin';
      const adminEmail = db.admin?.email || 'admin@uniquerestaurant.ng';
      const token = signToken({
        id: adminId,
        email: adminEmail,
        role: 'admin',
        exp: Date.now() + 12 * 60 * 60 * 1000,
      });
      res.json({
        token,
        user: {
          id: adminId,
          email: adminEmail,
          role: 'admin',
          mustChangePassword: false,
        },
      });
      return;
    }

    // If ADMIN_INITIAL_PASSWORD is provided in server env and no admin has updated it yet
    if (!db.admin && envInitialPassword) {
      if (!timingSafeEqualString(parsed.data.password, envInitialPassword)) {
        res.status(401).json({ error: 'Invalid admin password' });
        return;
      }
      db.admin = {
        id: crypto.randomUUID(),
        email: 'admin@uniquerestaurant.ng',
        passwordHash: hashPassword(envInitialPassword),
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };
      writeDb(db);
    }

    if (!db.admin) {
      res.status(401).json({ error: 'Admin passcode not yet initialized' });
      return;
    }

    if (!verifyPasswordHash(parsed.data.password, db.admin.passwordHash)) {
      res.status(401).json({ error: 'Invalid admin password' });
      return;
    }

    const token = signToken({
      id: db.admin.id,
      email: db.admin.email,
      role: 'admin',
      exp: Date.now() + 12 * 60 * 60 * 1000,
    });

    res.json({
      token,
      user: {
        id: db.admin.id,
        email: db.admin.email,
        role: 'admin',
        mustChangePassword: db.admin.mustChangePassword,
      },
    });
  });

  // Change Password (protected)
  app.post('/api/admin/change-password', requireAdmin, (req: AuthedRequest, res) => {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid password input' });
      return;
    }
    const db = readDb();
    if (!db.admin || !verifyPasswordHash(parsed.data.currentPassword, db.admin.passwordHash)) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    db.admin.passwordHash = hashPassword(parsed.data.newPassword);
    db.admin.mustChangePassword = false;
    writeDb(db);

    res.json({
      user: {
        id: db.admin.id,
        email: db.admin.email,
        role: 'admin',
        mustChangePassword: false,
      },
    });
  });

  // Admin Overview (real database counts & analytics records)
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const db = readDb();
    const catMap = new Map(db.categories.map((c) => [c.id, c]));
    const foods = db.foods.map((f) => ({
      ...f,
      category: f.category_id ? catMap.get(f.category_id) || null : null,
    }));
    const categories = [...db.categories].sort((a, b) => a.sort_order - b.sort_order);
    const orders = db.orders.map((o) => ({
      ...o,
      payment_status: o.payment_status || ('pending_payment' as PaymentStatus),
      order_items: db.orderItems.filter((item) => item.order_id === o.id),
    }));
    const verifiedRevenue = orders
      .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    res.json({
      totalFoods: foods.length,
      availableMeals: foods.filter((f) => f.is_available).length,
      unavailableMeals: foods.filter((f) => !f.is_available).length,
      totalOrders: orders.length,
      verifiedRevenue,
      unreadEnquiries: db.enquiries.filter((e) => !e.is_read).length,
      recentFoods: [...foods].slice(0, 6),
      recentEnquiries: [...db.enquiries].slice(0, 6),
      foods,
      categories,
      orders,
      enquiries: db.enquiries,
    });
  });

  // Admin Image Upload (base64 data URL with strict MIME & path confinement)
  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const schema = z.object({
      dataUrl: z.string().min(20).max(7_500_000),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid image payload' });
      return;
    }

    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
      parsed.data.dataUrl
    );
    if (!match) {
      res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are supported' });
      return;
    }

    const mime = match[1];
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size must be 5MB or less' });
      return;
    }

    const fileName = `${crypto.randomUUID()}.${ext}`;
    const resolvedPath = path.resolve(UPLOADS_DIR, fileName);
    if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({ error: 'Invalid upload path' });
      return;
    }

    fs.writeFileSync(resolvedPath, buffer);
    res.status(201).json({ url: `/uploads/${fileName}` });
  });

  // Admin Foods CRUD
  app.post('/api/admin/foods', requireAdmin, (req, res) => {
    const parsed = foodSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid food fields' });
      return;
    }
    const db = readDb();
    const now = new Date().toISOString();
    const newFood = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      category_id: parsed.data.category_id,
      image_url: parsed.data.image_url,
      is_available: parsed.data.is_available,
      is_featured: parsed.data.is_featured,
      created_at: now,
      updated_at: now,
    };
    db.foods.unshift(newFood);
    writeDb(db);
    res.status(201).json({ food: newFood });
  });

  app.patch('/api/admin/foods/:id', requireAdmin, (req, res) => {
    const parsed = foodSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid food update' });
      return;
    }
    const db = readDb();
    const idx = db.foods.findIndex((f) => f.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Food item not found' });
      return;
    }
    db.foods[idx] = {
      ...db.foods[idx],
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };
    writeDb(db);
    res.json({ food: db.foods[idx] });
  });

  app.delete('/api/admin/foods/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const exists = db.foods.some((f) => f.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: 'Food item not found' });
      return;
    }
    db.foods = db.foods.filter((f) => f.id !== req.params.id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Admin Categories CRUD
  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid category' });
      return;
    }
    const db = readDb();
    if (db.categories.some((c) => c.slug === parsed.data.slug)) {
      res.status(409).json({ error: 'A category with this slug already exists' });
      return;
    }
    const category = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      slug: parsed.data.slug,
      sort_order: parsed.data.sort_order,
      created_at: new Date().toISOString(),
    };
    db.categories.push(category);
    writeDb(db);
    res.status(201).json({ category });
  });

  app.patch('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid category update' });
      return;
    }
    const db = readDb();
    const idx = db.categories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    db.categories[idx] = { ...db.categories[idx], ...parsed.data };
    writeDb(db);
    res.json({ category: db.categories[idx] });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const exists = db.categories.some((c) => c.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
    db.foods = db.foods.map((f) =>
      f.category_id === req.params.id ? { ...f, category_id: null } : f
    );
    writeDb(db);
    res.json({ deleted: true });
  });

  // Admin Orders
  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    const db = readDb();
    const orders = db.orders.map((o) => ({
      ...o,
      order_items: db.orderItems.filter((item) => item.order_id === o.id),
    }));
    res.json({ orders });
  });

  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const schema = z
      .object({
        status: z
          .enum([
            'pending',
            'processing',
            'preparing',
            'ready_for_pickup',
            'out_for_delivery',
            'delivered',
            'completed',
            'cancelled',
          ])
          .optional(),
        payment_status: z.enum(['pending_payment', 'paid', 'refunded']).optional(),
      })
      .refine((data) => data.status !== undefined || data.payment_status !== undefined, {
        message: 'Provide order status or payment status to update',
      });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid order update' });
      return;
    }
    const db = readDb();
    const idx = db.orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const now = new Date().toISOString();
    const current = db.orders[idx];
    const nextPaymentStatus = parsed.data.payment_status ?? current.payment_status ?? 'pending_payment';
    let nextVerifiedAt = current.payment_verified_at ?? null;
    if (parsed.data.payment_status === 'paid' && current.payment_status !== 'paid') {
      nextVerifiedAt = now;
    } else if (parsed.data.payment_status && parsed.data.payment_status !== 'paid') {
      nextVerifiedAt = null;
    }

    db.orders[idx] = {
      ...current,
      status: parsed.data.status ?? current.status,
      payment_status: nextPaymentStatus,
      payment_verified_at: nextVerifiedAt,
      updated_at: now,
    };
    writeDb(db);
    const orderItems = db.orderItems.filter((item) => item.order_id === db.orders[idx].id);
    res.json({ order: { ...db.orders[idx], order_items: orderItems } });
  });

  // Admin Enquiries
  app.get('/api/admin/enquiries', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json({ enquiries: db.enquiries });
  });

  app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const schema = z.object({ is_read: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid enquiry update' });
      return;
    }
    const db = readDb();
    const idx = db.enquiries.findIndex((e) => e.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Enquiry not found' });
      return;
    }
    db.enquiries[idx].is_read = parsed.data.is_read;
    writeDb(db);
    res.json({ enquiry: db.enquiries[idx] });
  });

  app.delete('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.enquiries = db.enquiries.filter((e) => e.id !== req.params.id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Admin Restaurant Settings & Website Content
  app.patch('/api/admin/settings', requireAdmin, (req, res) => {
    const parsed = settingsPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid settings data' });
      return;
    }
    const db = readDb();
    db.settings = {
      ...db.settings,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };
    writeDb(db);
    res.json({ settings: db.settings });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unique Restaurant server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
