
import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useSales } from '@/hooks/useSales';
import { useAuth } from '@/hooks/useAuth';
import { LoadingButton } from '@/components/common/LoadingButton';
import { SaleItemsList } from './SaleItemsList';
import { SaleSummary } from './SaleSummary';

interface SaleFormProps {
  onSuccess: () => void;
  defaultStoreId?: number;
}

interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name?: string;
}

export const SaleForm = ({ onSuccess, defaultStoreId }: SaleFormProps) => {
  const { profile } = useAuth();
  const { products } = useProducts();
  const { stores } = useStores();
  const { createSale, isCreating } = useSales();

  const [selectedStore, setSelectedStore] = useState(defaultStoreId?.toString() || '');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const firstErrorRef = useRef<HTMLInputElement | null>(null);

  const availableStores = stores.filter(store => {
    if (profile?.role === 'admin') return true;
    return profile?.store_ids?.includes(store.id);
  });

  const addItem = () => {
    setItems([...items, {
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].unit_price = product.current_price;
        newItems[index].product_name = product.name;
      }
    }
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const taxAmount = subtotal * 0.20; // 20% TVA
  const total = subtotal + taxAmount - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    if (!selectedStore || items.length === 0) {
      setServerError('Veuillez sélectionner un magasin et ajouter au moins un article.');
      return;
    }

    const validItems = items.filter(item => item.product_id > 0 && item.quantity > 0);
    
    if (validItems.length === 0) {
      setServerError('Aucun article valide.');
      return;
    }

    try {
      await createSale({
        store_id: parseInt(selectedStore),
        items: validItems,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discount,
        total,
        payment_method: paymentMethod,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        notes,
      });
      onSuccess();
    } catch (error: any) {
      setServerError(error?.message || 'Erreur lors de la création de la vente.');
      // Optionnel : focus sur le premier champ en erreur
      if (firstErrorRef.current) {
        firstErrorRef.current.focus();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="mb-4 text-red-600" role="alert" aria-live="assertive">{serverError}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="store">Magasin *</Label>
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un magasin" />
            </SelectTrigger>
            <SelectContent>
              {availableStores.map(store => (
                <SelectItem key={store.id} value={store.id.toString()}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="payment">Méthode de paiement</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Espèces</SelectItem>
              <SelectItem value="card">Carte</SelectItem>
              <SelectItem value="check">Chèque</SelectItem>
              <SelectItem value="transfer">Virement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="customer-name">Nom du client</Label>
          <Input
            id="customer-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nom du client"
            ref={firstErrorRef}
          />
        </div>

        <div>
          <Label htmlFor="customer-email">Email du client</Label>
          <Input
            id="customer-email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="email@exemple.com"
          />
        </div>

        <div>
          <Label htmlFor="customer-phone">Téléphone du client</Label>
          <Input
            id="customer-phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="01 23 45 67 89"
          />
        </div>
      </div>

      <SaleItemsList
        items={items}
        products={products}
        onAddItem={addItem}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes sur la vente..."
            rows={4}
          />
        </div>

        <SaleSummary
          subtotal={subtotal}
          taxAmount={taxAmount}
          discount={discount}
          total={total}
          onDiscountChange={setDiscount}
        />
      </div>

      <div className="flex justify-end gap-4">
        <LoadingButton
          type="submit"
          loading={isCreating}
          disabled={!selectedStore || items.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          Enregistrer la vente
        </LoadingButton>
      </div>
    </form>
  );
};
