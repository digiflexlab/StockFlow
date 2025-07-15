
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MainContent } from '@/components/layout/MainContent';
import { TopBar } from '@/components/layout/TopBar';

export const MainLayout = ({ user, onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

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
