
import { Dashboard } from '@/components/pages/Dashboard';
import { Products } from '@/components/pages/Products';
import { Sales } from '@/components/pages/Sales';
import { Returns } from '@/components/pages/Returns';
import { Stores } from '@/components/pages/Stores';
import { Reports } from '@/components/pages/Reports';
import { Users } from '@/components/pages/Users';
import { AdminConfig } from '@/components/pages/AdminConfig';
import { Suppliers } from '@/components/pages/Suppliers';
import { Inventory } from '@/components/pages/Inventory';
import { Analytics } from '@/components/pages/Analytics';
import { Finance } from '@/components/pages/Finance';
import { Currencies } from '@/components/pages/Currencies';
import { Backup } from '@/components/pages/Backup';

export const MainContent = ({ currentPage, user, onPageChange }) => {
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} onPageChange={onPageChange} />;
      case 'products':
        return <Products />;
      case 'sales':
        return <Sales />;
      case 'returns':
        return <Returns />;
      case 'stores':
        return <Stores />;
      case 'suppliers':
        return <Suppliers />;
      case 'inventory':
        return <Inventory />;
      case 'analytics':
        return <Analytics user={user} />;
      case 'finance':
        return <Finance user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'users':
        return <Users user={user} />;
      case 'currencies':
        return <Currencies user={user} />;
      case 'backup':
        return <Backup />;
      case 'admin-config':
        return <AdminConfig onPageChange={onPageChange} />;
      default:
        return <Dashboard user={user} onPageChange={onPageChange} />;
    }
  };

  return (
    <main className="flex-1 overflow-auto">
      {renderPage()}
    </main>
  );
};
