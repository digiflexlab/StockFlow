
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Package, 
  Edit,
  Loader2,
  Tag,
  Store,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ProductModalEnhanced } from '@/components/modals/ProductModalEnhanced';
import { CategoryModal } from '@/components/modals/CategoryModal';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { FilterSelect } from '@/components/common/FilterSelect';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useStock } from '@/hooks/useStock';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useStores } from '@/hooks/useStores';
import { formatPrice, formatDate } from '@/utils/formatters';
import { isExpired, isExpiringSoon } from '@/utils/helpers';
import { Product } from '@/types/product';
// Supprimer l'import de MainLayout
// import { MainLayout } from '@/components/layout/MainLayout';

export const Products = () => {
  const { products, isLoading, error } = useProducts();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { stores, isLoading: storesLoading } = useStores();
  const { getProductStock, getStockStatus } = useStock();
  const { canEditProducts } = usePermissions();
  const { profile } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  // Messages adaptatifs selon le rôle
  const getAdaptiveMessages = () => {
    const roleMessages = {
      admin: {
        title: "Gestion des produits",
        subtitle: "Gérez l'ensemble des produits de votre système",
        empty: "Commencez par ajouter votre premier produit.",
        count: (filtered: number, total: number) => `${filtered} produit(s) trouvé(s) sur ${total} total`
      },
      manager: {
        title: "Produits de vos magasins",
        subtitle: "Gérez les produits de vos magasins assignés",
        empty: "Ajoutez des produits à vos magasins.",
        count: (filtered: number, total: number) => `${filtered} produit(s) dans vos magasins`
      },
      seller: {
        title: "Produits disponibles",
        subtitle: "Consultez les produits disponibles dans votre magasin",
        empty: "Aucun produit disponible actuellement.",
        count: (filtered: number, total: number) => `${filtered} produit(s) disponible(s)`
      }
    };

    return roleMessages[profile?.role] || roleMessages.seller;
  };

  // Affichage adaptatif du stock selon le rôle
  const getDisplayStock = (productId: number) => {
    if (profile?.role === 'admin') {
      return getProductStock(productId); // Stock total
    } else if (profile?.store_ids?.length > 0) {
      // Stock dans les magasins assignés
      return profile.store_ids.reduce((total, storeId) => {
        return total + getProductStock(productId, storeId);
      }, 0);
    }
    return 0;
  };

  // Obtenir le stock par magasin pour les managers
  const getStockByStore = (productId: number) => {
    if (profile?.role !== 'manager' || !profile?.store_ids) return [];
    
    return profile.store_ids.map(storeId => {
      const store = stores.find(s => s.id === storeId);
      const stock = getProductStock(productId, storeId);
      return {
        storeId,
        storeName: store?.name || `Magasin ${storeId}`,
        stock
      };
    });
  };

  // Filtres adaptatifs selon le rôle
  const getAdaptiveFilters = () => {
    const filters = [
      { value: 'all', label: 'Toutes les catégories' },
      ...categories.map(category => ({
        value: category.id.toString(),
        label: category.name
      }))
    ];

    return filters;
  };

  // Filtres de magasin pour les managers
  const getStoreFilters = () => {
    if (profile?.role !== 'manager' || !profile?.store_ids) return [];
    
    return [
      { value: 'all', label: 'Tous les magasins' },
      ...profile.store_ids.map(storeId => {
        const store = stores.find(s => s.id === storeId);
        return {
          value: storeId.toString(),
          label: store?.name || `Magasin ${storeId}`
        };
      })
    ];
  };

  // Filtrage des produits avec adaptation selon le rôle
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filtrage de base
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category_id?.toString() === selectedCategory;
      
      // Filtrage par stock selon le rôle
      let matchesStock = true;
      if (selectedStockFilter === 'available') {
        const stock = getDisplayStock(product.id);
        matchesStock = stock > 0;
      } else if (selectedStockFilter === 'low_stock') {
        const stock = getDisplayStock(product.id);
        matchesStock = stock > 0 && stock <= 5;
      }
      
      // Filtrage par magasin pour les managers
      let matchesStore = true;
      if (profile?.role === 'manager' && selectedStoreFilter !== 'all') {
        const storeId = parseInt(selectedStoreFilter);
        const stockInStore = getProductStock(product.id, storeId);
        matchesStore = stockInStore > 0;
      }
      
      return matchesSearch && matchesCategory && matchesStock && matchesStore;
    });
  }, [products, searchTerm, selectedCategory, selectedStockFilter, selectedStoreFilter, profile]);

  const messages = getAdaptiveMessages();

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Erreur de chargement"
          message="Impossible de charger les produits"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (isLoading || categoriesLoading || storesLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des produits...</span>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* En-tête avec messages adaptatifs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{messages.title}</h2>
            <p className="text-gray-600">{messages.subtitle}</p>
            <p className="text-sm text-gray-500">
              {messages.count(filteredProducts.length, products.length)}
            </p>
          </div>
          {canEditProducts && (
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCategoryModalOpen(true)}
                variant="outline"
                className="h-12"
              >
                <Tag className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
              <Button 
                onClick={handleCreateProduct}
                className="bg-blue-600 hover:bg-blue-700 h-12"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </div>
          )}
        </div>

        {/* Barre de recherche et filtres adaptatifs */}
        <SearchAndFilter
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Rechercher par nom ou SKU..."
          filters={
            <div className="flex gap-3 flex-wrap">
              <FilterSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={getAdaptiveFilters()}
                placeholder="Toutes les catégories"
                className="h-12"
                name="category-filter"
              />
              
              {/* Filtre par magasin pour les managers */}
              {profile?.role === 'manager' && (
                <FilterSelect
                  value={selectedStoreFilter}
                  onChange={setSelectedStoreFilter}
                  options={getStoreFilters()}
                  placeholder="Tous les magasins"
                  className="h-12"
                />
              )}
              
              {/* Filtres de stock pour sellers et managers */}
              {(profile?.role === 'seller' || profile?.role === 'manager') && (
                <FilterSelect
                  value={selectedStockFilter}
                  onChange={setSelectedStockFilter}
                  options={[
                    { value: 'all', label: 'Tous les stocks' },
                    { value: 'available', label: 'En stock' },
                    { value: 'low_stock', label: 'Stock faible' }
                  ]}
                  placeholder="Filtrer par stock"
                  className="h-12"
                />
              )}
            </div>
          }
        />

        {/* Liste des produits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const displayStock = getDisplayStock(product.id);
            const stockStatus = getStockStatus(displayStock, 5);
            const stockByStore = getStockByStore(product.id);
            
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  
                  {/* Badges d'état */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <StatusBadge
                      type="stock"
                      value={displayStock}
                      minThreshold={5}
                    />
                    {product.expiration_date && (
                      <StatusBadge
                        type="expiration"
                        value=""
                        expirationDate={product.expiration_date}
                      />
                    )}
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                      {canEditProducts && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600">{product.sku}</p>
                    <Badge variant="outline">
                      {categories.find(cat => cat.id === product.category_id)?.name || 'Sans catégorie'}
                    </Badge>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Prix actuel:</span>
                        <span className="font-semibold text-gray-900">{formatPrice(product.current_price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {profile?.role === 'admin' ? 'Stock total:' : 'Stock disponible:'}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {displayStock} unités
                          {profile?.role === 'admin' && (
                            <span className="text-xs text-gray-500 ml-1">(total)</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Affichage du stock par magasin pour les managers */}
                    {profile?.role === 'manager' && stockByStore.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-1">Stock par magasin:</p>
                        <div className="space-y-1">
                          {stockByStore.map(({ storeId, storeName, stock }) => (
                            <div key={storeId} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 flex items-center">
                                <Store className="h-3 w-3 mr-1" />
                                {storeName}:
                              </span>
                              <span className={`font-medium flex items-center ${
                                stock > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stock > 0 ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                )}
                                {stock} unités
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {product.expiration_date && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Expire le: {formatDate(product.expiration_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <EmptyState
            icon={Package}
            title="Aucun produit trouvé"
            description={searchTerm ? 'Aucun produit ne correspond à votre recherche.' : messages.empty}
            actionLabel="Ajouter un produit"
            onAction={handleCreateProduct}
            showAction={canEditProducts}
          />
        )}

        {/* Modals */}
        <ProductModalEnhanced
          isOpen={isProductModalOpen}
          onClose={handleCloseProductModal}
          product={selectedProduct}
        />

        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      </div>
  );
};
