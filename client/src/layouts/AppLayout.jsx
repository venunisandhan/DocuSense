import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Cpu,
  Search,
  Bell,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AppLayout = ({ children, title }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    ...(user?.role === 'HR' ? [{ icon: Users, label: 'HR Management', path: '/hr' }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-alice-blue/30 overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-sky-blue/10 blob blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-tangerine/5 blob blur-3xl -z-10 animate-pulse delay-700"></div>

      {/* Sidebar */}
      <aside 
        className={cn(
          "glass m-4 rounded-3xl transition-all duration-500 flex flex-col items-center py-8 z-50",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex items-center gap-3 mb-12 px-4">
          <div className="w-10 h-10 bg-sky-blue rounded-xl flex items-center justify-center shadow-lg shadow-sky-blue/20">
            <Cpu className="text-white w-6 h-6" />
          </div>
          {!isSidebarCollapsed && (
            <span className="font-heading text-xl font-bold tracking-tight text-slate-800">DocuSense</span>
          )}
        </div>

        <nav className="flex-1 w-full px-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 hover:bg-white/40",
                isActive ? "bg-white/60 text-sky-blue shadow-sm" : "text-slate-500",
                isSidebarCollapsed && "justify-center"
              )}
            >
              <item.icon className="w-6 h-6 shrink-0" />
              {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="w-full px-3 mt-auto space-y-2">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-white/40 transition-all cursor-pointer"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-6 h-6 mx-auto" /> : (
              <>
                <ChevronLeft className="w-6 h-6" />
                <span className="font-medium">Collapse</span>
              </>
            )}
          </button>
          
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all cursor-pointer",
              isSidebarCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-6 h-6 shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden relative">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 glass rounded-2xl mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            <p className="text-slate-500 text-sm">Welcome back, {user?.name}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-sky-blue transition-colors" />
              <input 
                type="text" 
                placeholder="Search documents..." 
                className="glass-input pl-10 w-64 text-sm"
              />
            </div>
            
            <button className="glass-button p-2 relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-tangerine rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-indigo-400 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
