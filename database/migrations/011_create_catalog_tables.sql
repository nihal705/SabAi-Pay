-- 011_create_catalog_tables.sql
-- Run this in Supabase SQL Editor

-- 1. Global Merchants (Swiggy, Zomato, etc.)
CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Restaurants (Paradise, KFC, etc.)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rating DECIMAL(3,2),
    cuisine TEXT,
    delivery_time TEXT,
    price_for_two INT,
    location_city TEXT NOT NULL,
    location_area TEXT,
    image_url TEXT,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    description TEXT,
    image_url TEXT,
    is_veg BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,
    unit TEXT DEFAULT 'piece',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Recharge Plans (for mobile operators)
CREATE TABLE IF NOT EXISTS recharge_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    data_benefit TEXT,
    talktime TEXT,
    sms_benefit TEXT,
    validity TEXT,
    plan_type TEXT DEFAULT 'prepaid',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Billers (for utility bills)
CREATE TABLE IF NOT EXISTS billers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- electricity, water, gas, broadband, mobile, credit_card
    category_display TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_merchant ON restaurants(merchant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(location_city);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recharge_plans_operator ON recharge_plans(operator_id);



CREATE TABLE IF NOT EXISTS user_order_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_slot TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snacks'
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, meal_slot)
);


-- Create user_order_preferences table
CREATE TABLE IF NOT EXISTS user_order_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_slot TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, meal_slot)
);

-- Enable RLS
ALTER TABLE user_order_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own usual orders"
  ON user_order_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


  CREATE TABLE IF NOT EXISTS user_order_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_slot TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, meal_slot)
);