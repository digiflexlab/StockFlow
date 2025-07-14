
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'seller');
CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
CREATE TYPE return_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE inventory_status AS ENUM ('active', 'completed', 'cancelled');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'seller',
  store_ids INTEGER[] DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stores table
CREATE TABLE public.stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id INTEGER REFERENCES public.categories(id),
  supplier_id INTEGER REFERENCES public.suppliers(id),
  purchase_price DECIMAL(10,2) NOT NULL,
  min_sale_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  description TEXT,
  expiration_date DATE,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock table
CREATE TABLE public.stock (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES public.stores(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- Create sales table
CREATE TABLE public.sales (
  id SERIAL PRIMARY KEY,
  sale_number TEXT UNIQUE NOT NULL,
  store_id INTEGER REFERENCES public.stores(id) NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status sale_status DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create returns table
CREATE TABLE public.returns (
  id SERIAL PRIMARY KEY,
  return_number TEXT UNIQUE NOT NULL,
  sale_id INTEGER REFERENCES public.sales(id),
  store_id INTEGER REFERENCES public.stores(id) NOT NULL,
  processed_by UUID REFERENCES public.profiles(id) NOT NULL,
  customer_name TEXT,
  reason TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status return_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create return_items table
CREATE TABLE public.return_items (
  id SERIAL PRIMARY KEY,
  return_id INTEGER REFERENCES public.returns(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_sessions table
CREATE TABLE public.inventory_sessions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  store_id INTEGER REFERENCES public.stores(id) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  status inventory_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES public.inventory_sessions(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id),
  expected_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  difference INTEGER DEFAULT 0,
  is_adjusted BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_movements table for tracking all stock changes
CREATE TABLE public.stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  store_id INTEGER REFERENCES public.stores(id) NOT NULL,
  movement_type TEXT NOT NULL, -- 'sale', 'return', 'adjustment', 'transfer', 'initial'
  quantity_change INTEGER NOT NULL,
  reference_id INTEGER, -- Can reference sales.id, returns.id, etc.
  reference_type TEXT, -- 'sale', 'return', 'adjustment', 'transfer'
  user_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default data
INSERT INTO public.categories (name, description) VALUES
  ('Smartphones', 'Téléphones intelligents'),
  ('Ordinateurs', 'Ordinateurs portables et de bureau'),
  ('Accessoires', 'Accessoires électroniques'),
  ('Tablettes', 'Tablettes tactiles'),
  ('Alimentaire', 'Produits alimentaires');

INSERT INTO public.stores (name, address, phone, email) VALUES
  ('Magasin Central', '123 Rue Principale, Dakar', '+221 77 123 4567', 'central@stockflow.com'),
  ('Magasin Annexe', '456 Avenue Liberté, Dakar', '+221 77 234 5678', 'annexe@stockflow.com');

INSERT INTO public.suppliers (name, contact_person, email, phone, address) VALUES
  ('Apple Inc', 'John Doe', 'contact@apple.com', '+1 555 123 4567', 'Cupertino, CA'),
  ('Samsung Electronics', 'Jane Smith', 'contact@samsung.com', '+1 555 234 5678', 'Seoul, South Korea'),
  ('Fournisseur Local', 'Mamadou Diallo', 'contact@local.sn', '+221 77 345 6789', 'Dakar, Sénégal');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for stores (admins and managers can see all, sellers see their assigned stores)
CREATE POLICY "Users can view accessible stores" ON public.stores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'manager') OR stores.id = ANY(store_ids))
  )
);

-- Create RLS policies for products (all authenticated users can view)
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Admins and managers can update products" ON public.products FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for stock
CREATE POLICY "Users can view stock for accessible stores" ON public.stock FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'manager') OR store_id = ANY(store_ids))
  )
);

-- Create RLS policies for sales
CREATE POLICY "Users can view sales for accessible stores" ON public.sales FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'manager') OR store_id = ANY(store_ids))
  )
);
CREATE POLICY "Users can insert sales for accessible stores" ON public.sales FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'manager') OR store_id = ANY(store_ids))
  )
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'seller'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update stock after sale
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease stock quantity
    UPDATE public.stock 
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE product_id = NEW.product_id;
    
    -- Record stock movement
    INSERT INTO public.stock_movements (product_id, store_id, movement_type, quantity_change, reference_id, reference_type, user_id)
    SELECT NEW.product_id, s.store_id, 'sale', -NEW.quantity, NEW.sale_id, 'sale', s.seller_id
    FROM public.sales s WHERE s.id = NEW.sale_id;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for stock updates
CREATE TRIGGER on_sale_item_created
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_sale();

-- Create function to generate sale numbers
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sale_number = 'VTE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('sale_number_seq'::regclass)::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for sale numbers
CREATE SEQUENCE IF NOT EXISTS sale_number_seq START 1;

-- Create trigger for sale number generation
CREATE TRIGGER generate_sale_number_trigger
  BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.generate_sale_number();
