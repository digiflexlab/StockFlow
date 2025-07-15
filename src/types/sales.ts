
export interface Sale {
  id: number;
  store_id: number;
  seller_id: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_method: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  sale_number: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  stores?: {
    name: string;
  };
  profiles?: {
    name: string;
  };
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: {
    name: string;
    sku: string;
  };
}

export interface CreateSaleData {
  store_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total: number;
  payment_method?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
}
