import {
  Home,
  Package,
  ShoppingCart,
  RefreshCw,
  Users,
  Building2,
  BarChart3,
  Settings,
  User,
  Cog,
  TrendingUp,
  DollarSign,
  Globe,
  Save
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SupportButton } from '@/components/support/SupportButton';

const getMenuItems = (userRole) => {
  const baseItems = [
    {
      title: 'Tableau de bord',
      url: 'dashboard',
      icon: Home,
      roles: ['admin', 'manager', 'seller']
    },
    {
      title: 'Produits',
      url: 'products',
      icon: Package,
      roles: ['admin', 'manager', 'seller']
    },
    {
      title: 'Ventes (POS)',
      url: 'sales',
      icon: ShoppingCart,
      roles: ['admin', 'manager', 'seller']
    },
    {
      title: 'Retours & Échanges',
      url: 'returns',
      icon: RefreshCw,
      roles: ['admin', 'manager', 'seller']
    }
  ];

  const managerItems = [
    {
      title: 'Gestion Magasins',
      url: 'stores',
      icon: Building2,
      roles: ['admin', 'manager']
    },
    {
      title: 'Fournisseurs',
      url: 'suppliers',
      icon: Users,
      roles: ['admin', 'manager']
    },
    {
      title: 'Inventaire',
      url: 'inventory',
      icon: Package,
      roles: ['admin', 'manager']
    },
    {
      title: 'Analytics',
      url: 'analytics',
      icon: TrendingUp,
      roles: ['admin', 'manager']
    },
    {
      title: 'Gestion Financière',
      url: 'finance',
      icon: DollarSign,
      roles: ['admin', 'manager']
    },
    {
      title: 'Rapports',
      url: 'reports',
      icon: BarChart3,
      roles: ['admin', 'manager']
    }
  ];

  const adminItems = [
    {
      title: 'Utilisateurs',
      url: 'users',
      icon: Users,
      roles: ['admin']
    },
    {
      title: 'Devises',
      url: 'currencies',
      icon: Globe,
      roles: ['admin']
    },
    {
      title: 'Sauvegarde',
      url: 'backup',
      icon: Save,
      roles: ['admin']
    },
    {
      title: 'Configuration',
      url: 'admin-config',
      icon: Cog,
      roles: ['admin']
    }
  ];

  return [...baseItems, ...managerItems, ...adminItems].filter(item =>
    item.roles.includes(userRole)
  );
};

export const AppSidebar = ({ user, currentPage, onPageChange }) => {
  const menuItems = getMenuItems(user?.role);
  
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Administrateur',
      manager: 'Gérant',
      seller: 'Vendeur'
    };
    return roleLabels[role] || role;
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">SF</span>
          </div>
          <div className="text-white">
            <h2 className="font-semibold">StockFlow Pro</h2>
            <p className="text-xs text-blue-100">v1.0</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={currentPage === item.url}
                    className="h-12"
                  >
                    <button 
                      onClick={() => onPageChange(item.url)}
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-0 bg-gray-50 border-t">
        <SupportButton user={user} />
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
