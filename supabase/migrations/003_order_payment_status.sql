-- ============================================================================
-- Unique Restaurant — Order Payment Verification & Fulfillment Statuses
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (payment_status IN ('pending_payment', 'paid', 'refunded')),
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (
    status IN (
      'pending',
      'processing',
      'preparing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled'
    )
  );

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
