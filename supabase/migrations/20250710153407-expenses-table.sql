-- Migration pour créer la table expenses
-- Date: 2025-07-10

-- Créer la table expenses
CREATE TABLE public.expenses (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES public.stores(id) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour optimiser les performances
CREATE INDEX idx_expenses_store_id ON public.expenses(store_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- Activer RLS sur la table expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir les dépenses des magasins auxquels ils ont accès
CREATE POLICY "Users can view expenses for accessible stores" ON public.expenses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'manager') OR store_id = ANY(store_ids))
  )
);

-- Politique pour permettre aux admin et managers d'insérer des dépenses
CREATE POLICY "Admin and managers can insert expenses" ON public.expenses FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Politique pour permettre aux admin et managers de modifier les dépenses
CREATE POLICY "Admin and managers can update expenses" ON public.expenses FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Politique pour permettre aux admin de supprimer les dépenses
CREATE POLICY "Admin can delete expenses" ON public.expenses FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_expenses_updated_at_trigger
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expenses_updated_at();

-- Fonction pour créer un audit log lors de l'ajout d'une dépense
CREATE OR REPLACE FUNCTION public.handle_expense_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      new_values
    ) VALUES (
      NEW.user_id,
      'INSERT',
      'expenses',
      NEW.id::text,
      jsonb_build_object(
        'category', NEW.category,
        'amount', NEW.amount,
        'description', NEW.description,
        'date', NEW.date,
        'store_id', NEW.store_id
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      NEW.user_id,
      'UPDATE',
      'expenses',
      NEW.id::text,
      jsonb_build_object(
        'category', OLD.category,
        'amount', OLD.amount,
        'description', OLD.description,
        'date', OLD.date,
        'store_id', OLD.store_id
      ),
      jsonb_build_object(
        'category', NEW.category,
        'amount', NEW.amount,
        'description', NEW.description,
        'date', NEW.date,
        'store_id', NEW.store_id
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values
    ) VALUES (
      OLD.user_id,
      'DELETE',
      'expenses',
      OLD.id::text,
      jsonb_build_object(
        'category', OLD.category,
        'amount', OLD.amount,
        'description', OLD.description,
        'date', OLD.date,
        'store_id', OLD.store_id
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour l'audit des dépenses
CREATE TRIGGER expenses_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_expense_audit();

-- Insérer quelques données de test (optionnel)
INSERT INTO public.expenses (store_id, user_id, category, amount, description, date) VALUES
  (1, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 'loyer', 150000, 'Loyer du magasin central', CURRENT_DATE - INTERVAL '30 days'),
  (1, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 'electricite', 25000, 'Facture électricité', CURRENT_DATE - INTERVAL '15 days'),
  (2, (SELECT id FROM public.profiles WHERE role = 'manager' LIMIT 1), 'marketing', 50000, 'Campagne publicitaire', CURRENT_DATE - INTERVAL '7 days'),
  (2, (SELECT id FROM public.profiles WHERE role = 'manager' LIMIT 1), 'transport', 15000, 'Frais de transport', CURRENT_DATE - INTERVAL '3 days'); 