import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Shield, 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Users,
  Settings,
  Key,
  Activity,
  Clock
} from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useStores } from '@/hooks/useStores';
import { useAuth } from '@/hooks/useAuth';
import { LoadingButton } from '@/components/common/LoadingButton';
import { toast } from '@/hooks/use-toast';

interface UserModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  user?: any;
  stores?: any[];
}

interface UserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'seller';
  storeIds: number[];
  permissions: string[];
  isActive: boolean;
  phone?: string;
  department?: string;
  notes?: string;
}

// Schéma de validation amélioré
const userValidationSchema = {
  name: { 
    required: true, 
    minLength: 2, 
    maxLength: 100,
    custom: (value: string) => {
      if (!value.trim()) return 'Le nom est requis';
      if (value.length < 2) return 'Le nom doit contenir au moins 2 caractères';
      if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) return 'Le nom ne peut contenir que des lettres';
      return null;
    }
  },
  email: { 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value) return 'L\'email est requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format d\'email invalide';
      return null;
    }
  },
  password: { 
    required: true, 
    minLength: 8,
    custom: (value: string) => {
      if (!value) return 'Le mot de passe est requis';
      if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
      if (!/(?=.*[a-z])/.test(value)) return 'Le mot de passe doit contenir au moins une minuscule';
      if (!/(?=.*[A-Z])/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule';
      if (!/(?=.*\d)/.test(value)) return 'Le mot de passe doit contenir au moins un chiffre';
      if (!/(?=.*[@$!%*?&])/.test(value)) return 'Le mot de passe doit contenir au moins un caractère spécial';
      return null;
    }
  },
  role: { 
    required: true,
    custom: (value: string) => {
      if (!value) return 'Le rôle est requis';
      if (!['admin', 'manager', 'seller'].includes(value)) return 'Rôle invalide';
      return null;
    }
  },
  storeIds: { 
    required: true,
    custom: (value: number[]) => {
      if (!value || value.length === 0) return 'Sélectionnez au moins un magasin';
      return null;
    }
  }
};

// Permissions par rôle
const ROLE_PERMISSIONS = {
  admin: [
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'products:view', 'products:create', 'products:edit', 'products:delete',
    'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
    'stores:view', 'stores:create', 'stores:edit', 'stores:delete',
    'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:delete',
    'reports:view', 'reports:export', 'reports:delete',
    'settings:view', 'settings:edit',
    'finance:view', 'finance:edit', 'finance:delete'
  ],
  manager: [
    'users:view', 'users:create', 'users:edit',
    'products:view', 'products:create', 'products:edit',
    'sales:view', 'sales:create', 'sales:edit',
    'stores:view', 'stores:edit',
    'suppliers:view', 'suppliers:create', 'suppliers:edit',
    'reports:view', 'reports:export',
    'settings:view',
    'finance:view', 'finance:edit'
  ],
  seller: [
    'products:view',
    'sales:view', 'sales:create',
    'stores:view',
    'reports:view'
  ]
};

// Catégories de permissions
const PERMISSION_CATEGORIES = {
  'Gestion des utilisateurs': ['users:view', 'users:create', 'users:edit', 'users:delete'],
  'Gestion des produits': ['products:view', 'products:create', 'products:edit', 'products:delete'],
  'Gestion des ventes': ['sales:view', 'sales:create', 'sales:edit', 'sales:delete'],
  'Gestion des magasins': ['stores:view', 'stores:create', 'stores:edit', 'stores:delete'],
  'Gestion des fournisseurs': ['suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:delete'],
  'Rapports et analytics': ['reports:view', 'reports:export', 'reports:delete'],
  'Configuration': ['settings:view', 'settings:edit'],
  'Finance': ['finance:view', 'finance:edit', 'finance:delete']
};

export const UserModalEnhanced = ({ 
  isOpen, 
  onClose, 
  onSave, 
  user, 
  stores = [] 
}: UserModalEnhancedProps) => {
  const { profile } = useAuth();
  const { stores: allStores } = useStores();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const initialUserData: UserData = {
    name: '',
    email: '',
    password: '',
    role: 'seller',
    storeIds: [],
    permissions: [],
    isActive: true,
    phone: '',
    department: '',
    notes: ''
  };

  const {
    data,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    updateField,
    handleSubmit,
    resetForm
  } = useFormValidation({
    initialData: initialUserData,
    validationSchema: userValidationSchema,
    onSubmit: async (userData) => {
      try {
        await onSave(userData);
        toast({
          title: user ? "Utilisateur modifié" : "Utilisateur créé",
          description: "L'utilisateur a été enregistré avec succès.",
        });
        onClose();
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'enregistrement.",
          variant: "destructive",
        });
      }
    }
  });

  // Charger les données de l'utilisateur à éditer
  useEffect(() => {
    if (user && isOpen) {
      Object.keys(initialUserData).forEach(key => {
        const value = user[key as keyof UserData];
        if (value !== undefined) {
          updateField(key, value);
        }
      });
    } else if (!user && isOpen) {
      resetForm();
    }
  }, [user, isOpen, updateField, resetForm]);

  // Permissions disponibles selon le rôle
  const availablePermissions = useMemo(() => {
    return ROLE_PERMISSIONS[data.role as keyof typeof ROLE_PERMISSIONS] || [];
  }, [data.role]);

  // Permissions sélectionnées par catégorie
  const permissionsByCategory = useMemo(() => {
    const result: Record<string, { permissions: string[], selected: string[] }> = {};
    
    Object.entries(PERMISSION_CATEGORIES).forEach(([category, permissions]) => {
      const availableInCategory = permissions.filter(p => availablePermissions.includes(p));
      const selectedInCategory = data.permissions.filter(p => availableInCategory.includes(p));
      
      if (availableInCategory.length > 0) {
        result[category] = {
          permissions: availableInCategory,
          selected: selectedInCategory
        };
      }
    });
    
    return result;
  }, [data.permissions, availablePermissions]);

  // Gestion des permissions
  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newPermissions = checked 
      ? [...data.permissions, permission]
      : data.permissions.filter(p => p !== permission);
    
    updateField('permissions', newPermissions);
  };

  // Gestion des magasins
  const handleStoreChange = (storeId: number, checked: boolean) => {
    const newStoreIds = checked 
      ? [...data.storeIds, storeId]
      : data.storeIds.filter(id => id !== storeId);
    
    updateField('storeIds', newStoreIds);
  };

  // Mise à jour automatique des permissions lors du changement de rôle
  const handleRoleChange = (role: string) => {
    updateField('role', role);
    // Appliquer les permissions par défaut du rôle
    const defaultPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
    updateField('permissions', defaultPermissions);
  };

  // Validation du mot de passe en temps réel
  const passwordStrength = useMemo(() => {
    const password = data.password;
    if (!password) return { score: 0, label: 'Vide', color: 'text-gray-400' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[@$!%*?&])/.test(password)) score++;
    
    const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Très bon'];
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500'];
    
    return {
      score,
      label: labels[score - 1] || 'Vide',
      color: colors[score - 1] || 'text-gray-400'
    };
  }, [data.password]);

  // Vérifier si l'utilisateur actuel peut modifier cet utilisateur
  const canModifyUser = useMemo(() => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (profile.role === 'manager' && data.role !== 'admin') return true;
    return false;
  }, [profile, data.role]);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <p className="text-gray-600">
                {user ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouvel utilisateur'}
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Informations</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="stores">Magasins</TabsTrigger>
                <TabsTrigger value="advanced">Avancé</TabsTrigger>
              </TabsList>

              {/* Onglet Informations de base */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={data.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                      placeholder="Nom et prénom"
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                      placeholder="email@exemple.com"
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={data.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+221 77 123 4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Département</Label>
                    <Input
                      id="department"
                      value={data.department}
                      onChange={(e) => updateField('department', e.target.value)}
                      placeholder="Ventes, Stock, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Rôle *</Label>
                    <Select value={data.role} onValueChange={handleRoleChange}>
                      <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seller">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Vendeur
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Manager
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Administrateur
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
                  </div>

                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={data.isActive ? 'active' : 'inactive'} onValueChange={(value) => updateField('isActive', value === 'active')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Actif
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Inactif
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!user && (
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={data.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                        placeholder="Mot de passe sécurisé"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    
                    {/* Indicateur de force du mot de passe */}
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Force :</span>
                        <span className={`text-sm font-medium ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            passwordStrength.score <= 1 ? 'bg-red-500' :
                            passwordStrength.score <= 2 ? 'bg-orange-500' :
                            passwordStrength.score <= 3 ? 'bg-yellow-500' :
                            passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Onglet Permissions */}
              <TabsContent value="permissions" className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Les permissions sont automatiquement définies selon le rôle sélectionné. 
                    Vous pouvez les ajuster manuellement si nécessaire.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, { permissions, selected }]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permissions.map(permission => {
                            const isChecked = selected.includes(permission);
                            const permissionLabel = permission.split(':')[1];
                            
                            return (
                              <div key={permission} className="flex items-center space-x-2">
                                <Checkbox
                                  id={permission}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                                  disabled={!canModifyUser}
                                />
                                <Label htmlFor={permission} className="text-sm font-medium">
                                  {permissionLabel.charAt(0).toUpperCase() + permissionLabel.slice(1)}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">
                      {data.permissions.length} permission(s) sélectionnée(s)
                    </p>
                    <p className="text-sm text-blue-700">
                      Rôle : {data.role.charAt(0).toUpperCase() + data.role.slice(1)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-blue-700">
                    {Math.round((data.permissions.length / availablePermissions.length) * 100)}% des permissions
                  </Badge>
                </div>
              </TabsContent>

              {/* Onglet Magasins */}
              <TabsContent value="stores" className="space-y-4">
                <Alert>
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                    Sélectionnez les magasins auxquels cet utilisateur aura accès.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allStores.map(store => {
                    const isSelected = data.storeIds.includes(store.id);
                    
                    return (
                      <Card key={store.id} className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`store-${store.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleStoreChange(store.id, checked as boolean)}
                              disabled={!canModifyUser}
                            />
                            <div className="flex-1">
                              <Label htmlFor={`store-${store.id}`} className="font-medium cursor-pointer">
                                {store.name}
                              </Label>
                              <p className="text-sm text-gray-600">{store.address}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {data.storeIds.length === 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Aucun magasin sélectionné. L'utilisateur ne pourra pas accéder au système.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Onglet Avancé */}
              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={4}
                    placeholder="Notes supplémentaires sur l'utilisateur..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Informations de sécurité</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Dernière connexion</span>
                        <span className="text-sm">Jamais</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Statut du compte</span>
                        <Badge variant={data.isActive ? 'default' : 'destructive'}>
                          {data.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Résumé des permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Permissions totales</span>
                        <span className="text-sm font-medium">{data.permissions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Magasins assignés</span>
                        <span className="text-sm font-medium">{data.storeIds.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                disabled={!isValid || !isDirty || isSubmitting || !canModifyUser}
                className="min-w-[120px]"
              >
                {user ? 'Modifier' : 'Créer'}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 