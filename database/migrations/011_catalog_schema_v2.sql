-- 011_catalog_schema_v2.sql
-- Run this in Supabase SQL Editor – it drops and recreates all catalog tables

-- Drop existing tables (cascade to remove dependencies)
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.recharge_plans CASCADE;
DROP TABLE IF EXISTS public.billers CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;

-- 1. Merchants
CREATE TABLE public.merchants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Restaurants
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id TEXT NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
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
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
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

-- 4. Recharge Plans
CREATE TABLE public.recharge_plans (
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

-- 5. Billers
CREATE TABLE public.billers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_display TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_restaurants_merchant ON public.restaurants(merchant_id);
CREATE INDEX idx_restaurants_city ON public.restaurants(location_city);
CREATE INDEX idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX idx_recharge_plans_operator ON public.recharge_plans(operator_id);

-- Grant permissions (important for service_role)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;