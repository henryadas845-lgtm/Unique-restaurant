-- ============================================================================
-- Unique Restaurant — Starter Seed Data (Editable via Admin Dashboard)
-- ============================================================================

INSERT INTO public.food_categories (name, slug, sort_order)
VALUES
  ('Rice Dishes', 'rice-dishes', 1),
  ('Beans and Local Delicacies', 'beans-and-local-delicacies', 2),
  ('Soups and Swallows', 'soups-and-swallows', 3),
  ('Special Meals', 'special-meals', 4),
  ('Drinks', 'drinks', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.restaurant_settings (
  restaurant_name,
  description,
  whatsapp_number,
  phone_number,
  location,
  opening_hours,
  delivery_fee,
  currency_symbol,
  hero_heading,
  hero_subtext,
  about_story,
  mission_statement,
  vision_statement
)
SELECT
  'Unique Restaurant',
  'Unique Restaurant specializes in preparing and serving delicious, freshly prepared Nigerian meals in Owo Ede, Osogbo, Osun State.',
  '2349067566746',
  '+234 906 756 6746',
  'Owo Ede, Osogbo, Osun State, Nigeria',
  'Monday – Saturday: Configurable in Admin Dashboard',
  500,
  '₦',
  'Delicious Nigerian Meals, Made With Love.',
  'Experience the rich taste of authentic Nigerian cuisine. From delicious rice dishes to traditional local delicacies, there''s always something special waiting for you at Unique Restaurant.',
  'At Unique Restaurant, we believe that good food brings people together. Our passion is serving delicious Nigerian meals prepared with care, quality ingredients, and a commitment to satisfying every customer. From popular rice dishes to traditional Nigerian delicacies, we aim to give every customer a memorable food experience. Located in Owo Ede, Osogbo, Unique Restaurant is dedicated to making delicious Nigerian food accessible to everyone.',
  'To serve delicious, affordable, and satisfying Nigerian meals while creating a welcoming experience for every customer.',
  'To become a trusted and recognized food destination known for quality, great taste, and excellent customer satisfaction.'
WHERE NOT EXISTS (SELECT 1 FROM public.restaurant_settings);

-- Seed starter menu items mapped to their categories
WITH cats AS (
  SELECT id, slug FROM public.food_categories
)
INSERT INTO public.foods (name, description, price, category_id, image_url, is_available, is_featured)
SELECT v.name, v.description, v.price, c.id, v.image_url, TRUE, v.is_featured
FROM (
  VALUES
    -- Rice Dishes
    ('Nigerian Jollof Rice', 'Deliciously prepared Nigerian party-style jollof rice, rich in flavour and served fresh.', 2500, 'rice-dishes', '/src/assets/images/dish_jollof_rice_1795437995663.jpg', TRUE),
    ('Fried Rice', 'Tasty Nigerian fried rice prepared with fresh vegetables and carefully selected ingredients.', 3000, 'rice-dishes', '/src/assets/images/dish_fried_rice_1795437995125.jpg', TRUE),
    ('White Rice and Stew', 'Freshly cooked white rice served with rich, homemade Nigerian tomato stew.', 2500, 'rice-dishes', '/src/assets/images/dish_white_rice_stew_1795437994701.jpg', TRUE),
    ('Ofada Rice and Sauce', 'Local Nigerian rice served with delicious, spicy ayamase-style sauce.', 3500, 'rice-dishes', '/src/assets/images/dish_ofada_rice_1795437997200.jpg', TRUE),
    ('Coconut Rice', 'Fragrant rice gently simmered in rich coconut milk and Nigerian spices.', 3000, 'rice-dishes', '/src/assets/images/dish_fried_rice_1795437995125.jpg', FALSE),
    ('Native Rice', 'Traditional Nigerian palm-oil rice prepared with locust beans, dried fish, and native herbs.', 3500, 'rice-dishes', '/src/assets/images/dish_ofada_rice_1795437997200.jpg', FALSE),

    -- Beans and Local Delicacies
    ('Ewa Agoyin', 'Soft, well-cooked beans served with delicious traditional agoyin pepper sauce.', 2000, 'beans-and-local-delicacies', '/src/assets/images/dish_ewa_agoyin_1795437995215.jpg', TRUE),
    ('Beans and Plantain', 'Deliciously cooked beans served with sweet fried ripe plantain.', 2500, 'beans-and-local-delicacies', '/src/assets/images/dish_beans_plantain_1795437995397.jpg', TRUE),
    ('Yam and Egg Sauce', 'Soft boiled white yam slices served with rich, savoury Nigerian tomato and egg sauce.', 2500, 'beans-and-local-delicacies', '/src/assets/images/dish_white_rice_stew_1795437994701.jpg', FALSE),
    ('Moi Moi', 'Freshly steamed Nigerian bean pudding seasoned with peppers, onions, and spices.', 1000, 'beans-and-local-delicacies', '/src/assets/images/dish_moi_moi_akara_1795437995258.jpg', FALSE),
    ('Akara', 'Crispy, golden-fried bean cakes made fresh from peeled honey beans.', 1000, 'beans-and-local-delicacies', '/src/assets/images/dish_moi_moi_akara_1795437995258.jpg', FALSE),

    -- Soups and Swallows
    ('Egusi Soup and Eba', 'Rich melon seed soup cooked with leafy greens and assorted meat, paired with smooth Eba.', 3500, 'soups-and-swallows', '/src/assets/images/dish_egusi_eba_1795437995930.jpg', FALSE),
    ('Efo Riro and Amala', 'Savory Yoruba-style spinach stew rich with locust beans and meat, served with hot Amala.', 3500, 'soups-and-swallows', '/src/assets/images/dish_efo_amala_1795437995289.jpg', FALSE),
    ('Ogbono Soup and Pounded Yam', 'Smooth traditional Ogbono draw soup served with freshly pounded yam swallow.', 4000, 'soups-and-swallows', '/src/assets/images/dish_egusi_eba_1795437995930.jpg', FALSE),
    ('Vegetable Soup and Eba', 'Freshly prepared Nigerian green vegetable soup served alongside warm yellow Eba.', 3500, 'soups-and-swallows', '/src/assets/images/dish_efo_amala_1795437995289.jpg', FALSE),

    -- Special Meals
    ('Jollof Rice with Chicken', 'Smoky party Jollof rice served with tender seasoned chicken and golden plantain.', 4000, 'special-meals', '/src/assets/images/hero_jollof_feast_1795437995489.jpg', FALSE),
    ('Fried Rice with Chicken', 'Flavourful Nigerian vegetable fried rice paired with spiced roasted chicken.', 4500, 'special-meals', '/src/assets/images/dish_fried_rice_1795437995125.jpg', FALSE),
    ('Rice with Beef and Plantain', 'Generous serving of rice paired with tender stewed beef and sweet fried plantain.', 4000, 'special-meals', '/src/assets/images/dish_white_rice_stew_1795437994701.jpg', FALSE),

    -- Drinks
    ('Bottled Water', 'Chilled pure spring bottled water.', 500, 'drinks', '/src/assets/images/dish_zobo_drink_1795437997143.jpg', FALSE),
    ('Soft Drinks', 'Assorted chilled carbonated soft drinks.', 700, 'drinks', '/src/assets/images/dish_zobo_drink_1795437997143.jpg', FALSE),
    ('Zobo', 'Freshly brewed chilled Nigerian hibiscus flower drink infused with pineapple and ginger.', 1000, 'drinks', '/src/assets/images/dish_zobo_drink_1795437997143.jpg', FALSE)
) AS v(name, description, price, category_slug, image_url, is_featured)
JOIN cats c ON c.slug = v.category_slug
WHERE NOT EXISTS (SELECT 1 FROM public.foods f WHERE f.name = v.name);
