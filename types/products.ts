
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_id: number | null;
  supplier_id: number | null;
  unit_id?: number;
  purchase_price: number;
  min_sale_price: number;
  current_price: number;
  tax_rate?: number;
  min_stock_threshold?: number;
  store_ids?: number[];
  description: string | null;
  expiration_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string };
  suppliers?: { name: string };
  units?: { name: string; symbol: string };
}

export interface ProductFormData {
  name: string;
  sku: string;
  barcode?: string;
  category_id: number;
  supplier_id: number;
  unit_id?: number;
  purchase_price: number;
  min_sale_price: number;
  current_price: number;
  tax_rate?: number;
  min_stock_threshold?: number;
  store_ids?: number[];
  description: string;
  expiration_date: string;
}
