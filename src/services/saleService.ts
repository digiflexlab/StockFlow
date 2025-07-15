
import { supabase } from '@/integrations/supabase/client';
import type { CreateSaleData, SaleItem } from '@/types/sales';

export const createSaleWithItems = async (saleData: CreateSaleData, sellerId: string) => {
  // Générer le numéro de vente
  const saleNumber = `VTE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

  // Créer la vente
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      store_id: saleData.store_id,
      seller_id: sellerId,
      subtotal: saleData.subtotal,
      tax_amount: saleData.tax_amount || 0,
      discount_amount: saleData.discount_amount || 0,
      total: saleData.total,
      status: 'completed',
      payment_method: saleData.payment_method || 'cash',
      customer_name: saleData.customer_name,
      customer_email: saleData.customer_email,
      customer_phone: saleData.customer_phone,
      notes: saleData.notes,
      sale_number: saleNumber,
    })
    .select()
    .single();

  if (saleError) throw saleError;

  // Créer les articles de vente
  const saleItems = saleData.items.map(item => ({
    sale_id: sale.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);

  if (itemsError) throw itemsError;

  return sale;
};

export const updateStockAfterSale = async (items: CreateSaleData['items'], storeId: number) => {
  for (const item of items) {
    // D'abord récupérer la quantité actuelle
    const { data: currentStock, error: stockGetError } = await supabase
      .from('stock')
      .select('quantity')
      .eq('product_id', item.product_id)
      .eq('store_id', storeId)
      .single();

    if (stockGetError) {
      console.error('Erreur récupération stock:', stockGetError);
      continue;
    }

    // Ensuite mettre à jour avec la nouvelle quantité
    const newQuantity = Math.max(0, currentStock.quantity - item.quantity);
    
    const { error: stockUpdateError } = await supabase
      .from('stock')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('product_id', item.product_id)
      .eq('store_id', storeId);

    if (stockUpdateError) {
      console.error('Erreur mise à jour stock:', stockUpdateError);
    }
  }
};

export const getSaleItems = async (saleId: number): Promise<SaleItem[]> => {
  const { data, error } = await supabase
    .from('sale_items')
    .select(`
      *,
      products(name, sku)
    `)
    .eq('sale_id', saleId);

  if (error) throw error;
  return data as SaleItem[];
};
