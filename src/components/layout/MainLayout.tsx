
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MainContent } from '@/components/layout/MainContent';
import { TopBar } from '@/components/layout/TopBar';

export const MainLayout = ({ user, onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Vérification de sécurité pour éviter les erreurs si user est undefined
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          user={user} 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
        <div className="flex-1 flex flex-col">
          <TopBar user={user} onLogout={onLogout} />
          <MainContent 
            currentPage={currentPage} 
            user={user}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};
