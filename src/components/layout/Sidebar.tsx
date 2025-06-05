
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  User, 
  Book, 
  Calendar,
  FileText,
  Home
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { user } = useAuth();

  const adminNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/students', label: 'Alunos', icon: Users },
    { to: '/teachers', label: 'Professores', icon: User },
    { to: '/subjects', label: 'Disciplinas', icon: Book },
    { to: '/classes', label: 'Turmas', icon: Users },
    { to: '/reports', label: 'Relatórios', icon: FileText },
  ];

  const teacherNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/attendance', label: 'Presença', icon: Calendar },
    { to: '/grades', label: 'Notas', icon: FileText },
    { to: '/my-classes', label: 'Minhas Turmas', icon: Users },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : teacherNavItems;

  return (
    <aside className="bg-gradient-to-b from-blue-800 via-blue-700 to-blue-900 text-white w-full h-full min-h-screen p-4 sm:p-6">
      <div className="mb-6 block md:hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 via-red-400 to-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <h2 className="text-lg font-bold">ETDA</h2>
            <p className="text-xs text-blue-200">Sistema Escolar</p>
          </div>
        </div>
      </div>
      
      <nav className="space-y-1 sm:space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-md text-sm sm:text-base",
                isActive && "bg-blue-600 shadow-lg border-l-4 border-orange-400"
              )
            }
          >
            <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
