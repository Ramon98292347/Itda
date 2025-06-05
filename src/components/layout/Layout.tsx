
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Se não estiver autenticado e não estiver na página de login, mostrar apenas o children
  if (!isAuthenticated && location.pathname !== '/login') {
    return <>{children}</>;
  }

  // Se não estiver autenticado e estiver na página de login, mostrar apenas o children
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Se estiver autenticado, mostrar o layout completo
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col w-full min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
