import { Badge } from '@/components/ui/badge';
import { getSaleStatusBadge, getStockStatus, getRoleBadgeColor } from '@/utils/helpers';

interface StatusBadgeProps {
  type: 'sale' | 'stock' | 'role' | 'expiration';
  value: string | number;
  minThreshold?: number;
  expirationDate?: string;
  className?: string;
}

export const StatusBadge = ({ 
  type, 
  value, 
  minThreshold = 5, 
  expirationDate,
  className 
}: StatusBadgeProps) => {
  const getBadgeContent = () => {
    switch (type) {
      case 'sale':
        const saleStatus = getSaleStatusBadge(value as string);
        return {
          label: saleStatus.label,
          color: saleStatus.color
        };
        
      case 'stock':
        const stockStatus = getStockStatus(value as number, minThreshold);
        return {
          label: stockStatus.label,
          color: stockStatus.color
        };
        
      case 'role':
        return {
          label: value as string,
          color: getRoleBadgeColor(value as string)
        };
        
      case 'expiration':
        if (!expirationDate) {
          return { label: 'N/A', color: 'bg-gray-100 text-gray-800' };
        }
        
        const isExpired = new Date(expirationDate) < new Date();
        const isExpiringSoon = (() => {
          const today = new Date();
          const expDate = new Date(expirationDate);
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays > 0;
        })();
        
        if (isExpired) {
          return { label: 'Expiré', color: 'bg-red-100 text-red-800' };
        } else if (isExpiringSoon) {
          return { label: 'Expire bientôt', color: 'bg-yellow-100 text-yellow-800' };
        } else {
          return { label: 'OK', color: 'bg-green-100 text-green-800' };
        }
        
      default:
        return { label: value as string, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const { label, color } = getBadgeContent();

  return (
    <Badge className={`${color} ${className}`}>
      {label}
    </Badge>
  );
};