
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormState } from '@/hooks/useFormState';

interface User {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'employee';
  storeIds: number[];
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => Promise<{ error?: string }>;
  user?: User | null;
  stores: Array<{ id: number; name: string }>;
}

const initialFormData: User = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  storeIds: []
};

export const UserModal = ({ isOpen, onClose, onSave, user, stores }: UserModalProps) => {
  const { formData, errors, updateField, setError, reset, setFormData } = useFormState<User>(initialFormData);
  const [serverError, setServerError] = useState<string | null>(null);
  const firstErrorRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      reset();
    }
    setServerError(null);
  }, [user, reset, setFormData, isOpen]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof User, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    if (!user && !formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!user && formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (formData.storeIds.length === 0) {
      newErrors.storeIds = 'Sélectionnez au moins un magasin';
    }

    Object.entries(newErrors).forEach(([field, message]) => {
      setError(field as keyof User, message);
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setServerError(null);
    if (validateForm()) {
      try {
        const result = await onSave(formData);
        if (result && result.error) {
          setServerError(result.error);
          if (firstErrorRef.current) firstErrorRef.current.focus();
          return;
        }
        onClose();
      } catch (error: any) {
        setServerError(error?.message || 'Erreur lors de la sauvegarde de l\'utilisateur.');
        if (firstErrorRef.current) firstErrorRef.current.focus();
      }
    } else {
      if (firstErrorRef.current) firstErrorRef.current.focus();
    }
  };

  const handleStoreChange = (storeId: number, checked: boolean) => {
    if (checked) {
      updateField('storeIds', [...formData.storeIds, storeId]);
    } else {
      updateField('storeIds', formData.storeIds.filter(id => id !== storeId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
          </DialogTitle>
        </DialogHeader>
        {serverError && (
          <div className="mb-4 text-red-600" role="alert" aria-live="assertive">{serverError}</div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              ref={firstErrorRef}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={formData.role} onValueChange={(value) => updateField('role', value as User['role'])}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Magasins assignés *</Label>
            <div className="space-y-2">
              {stores.map((store) => (
                <div key={store.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.storeIds.includes(store.id)}
                    onCheckedChange={(checked) => handleStoreChange(store.id, checked === true)}
                  />
                  <Label className="text-sm">{store.name}</Label>
                </div>
              ))}
            </div>
            {errors.storeIds && <p className="text-sm text-red-500">{errors.storeIds}</p>}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            {user ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
