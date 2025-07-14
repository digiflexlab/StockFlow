
-- Renforcer les contraintes de validation sur les tables existantes

-- 1. Améliorer la table products avec des contraintes strictes
ALTER TABLE public.products 
DROP COLUMN IF EXISTS images CASCADE;

ALTER TABLE public.products 
ADD CONSTRAINT products_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT products_sku_not_empty CHECK (length(trim(sku)) > 0),
ADD CONSTRAINT products_sku_format CHECK (sku ~ '^[A-Za-z0-9_-]+$'),
ADD CONSTRAINT products_prices_positive CHECK (
  purchase_price > 0 AND 
  min_sale_price > 0 AND 
  current_price > 0
),
ADD CONSTRAINT products_price_logic CHECK (
  min_sale_price >= purchase_price AND 
  current_price >= min_sale_price
);

-- 2. Améliorer la table suppliers avec des contraintes
ALTER TABLE public.suppliers
ADD CONSTRAINT suppliers_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT suppliers_email_format CHECK (
  email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
),
ADD CONSTRAINT suppliers_phone_format CHECK (
  phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$'
);

-- 3. Améliorer la table stores avec des contraintes
ALTER TABLE public.stores
ADD CONSTRAINT stores_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT stores_email_format CHECK (
  email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
),
ADD CONSTRAINT stores_phone_format CHECK (
  phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$'
);

-- 4. Améliorer la table categories avec des contraintes
ALTER TABLE public.categories
ADD CONSTRAINT categories_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT categories_name_length CHECK (length(name) <= 100);

-- 5. Améliorer la table stock avec des contraintes strictes
ALTER TABLE public.stock
ADD CONSTRAINT stock_quantity_non_negative CHECK (quantity >= 0),
ADD CONSTRAINT stock_reserved_non_negative CHECK (reserved_quantity >= 0),
ADD CONSTRAINT stock_reserved_not_exceed_quantity CHECK (reserved_quantity <= quantity),
ADD CONSTRAINT stock_min_threshold_positive CHECK (min_threshold >= 0);

-- 6. Améliorer la table profiles avec des contraintes
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT profiles_email_format CHECK (
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- 7. Créer des fonctions de sécurité pour éviter la récursion RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_stores()
RETURNS INTEGER[] AS $$
  SELECT COALESCE(store_ids, '{}') FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- 8. Mettre à jour les politiques RLS pour utiliser les fonctions de sécurité

-- Supprimer les anciennes politiques qui pourraient causer des récursions
DROP POLICY IF EXISTS "Users can view accessible stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Admins and managers can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins and managers can update products" ON public.products;
DROP POLICY IF EXISTS "Users can view stock for accessible stores" ON public.stock;
DROP POLICY IF EXISTS "Users can view sales for accessible stores" ON public.sales;
DROP POLICY IF EXISTS "Users can insert sales for accessible stores" ON public.sales;

-- Nouvelles politiques RLS sécurisées

-- Politiques pour stores
CREATE POLICY "Users can view accessible stores" ON public.stores
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'manager') OR 
  id = ANY(public.get_current_user_stores())
);

CREATE POLICY "Only admins can manage stores" ON public.stores
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Politiques pour products
CREATE POLICY "Authenticated users can view active products" ON public.products
FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admins and managers can manage products" ON public.products
FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'manager'));

-- Politiques pour stock
CREATE POLICY "Users can view stock for accessible stores" ON public.stock
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'manager') OR 
  store_id = ANY(public.get_current_user_stores())
);

CREATE POLICY "Admins and managers can manage stock" ON public.stock
FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'manager'));

-- Politiques pour sales
CREATE POLICY "Users can view sales for accessible stores" ON public.sales
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'manager') OR 
  store_id = ANY(public.get_current_user_stores())
);

CREATE POLICY "Users can create sales for accessible stores" ON public.sales
FOR INSERT TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'manager') OR 
  store_id = ANY(public.get_current_user_stores())
);

CREATE POLICY "Admins and managers can update sales" ON public.sales
FOR UPDATE TO authenticated
USING (public.get_current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'manager'));

-- Politiques pour sale_items
CREATE POLICY "Users can view sale items through sales access" ON public.sale_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.id = sale_items.sale_id AND (
      public.get_current_user_role() IN ('admin', 'manager') OR 
      s.store_id = ANY(public.get_current_user_stores())
    )
  )
);

CREATE POLICY "Users can insert sale items for accessible sales" ON public.sale_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.id = sale_items.sale_id AND (
      public.get_current_user_role() IN ('admin', 'manager') OR 
      s.store_id = ANY(public.get_current_user_stores())
    )
  )
);

-- Politiques pour categories (lecture pour tous, gestion admin/manager)
CREATE POLICY "Authenticated users can view categories" ON public.categories
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and managers can manage categories" ON public.categories
FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'manager'));

-- Politiques pour suppliers
CREATE POLICY "Authenticated users can view active suppliers" ON public.suppliers
FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admins and managers can manage suppliers" ON public.suppliers
FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'manager'));

-- 9. Créer une table pour les logs d'audit
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_admin());

-- 10. Fonction pour créer des logs d'audit
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
