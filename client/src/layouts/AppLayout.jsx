import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Search,
  User,
  Menu,
  X,
  Loader2,
  File
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AppLayout = ({ children, title, hideWelcome = false }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [allDocs, setAllDocs] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchFocus = async () => {
    setShowSearchDropdown(true);
    if (allDocs.length === 0) {
      setIsSearching(true);
      try {
        const { getDocuments } = await import('../services/document.service');
        const docs = await getDocuments();
        setAllDocs(docs);
      } catch (err) {
        console.error('Failed to load documents for search', err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = allDocs.filter(d => 
      (d.title && d.title.toLowerCase().includes(q)) || 
      (d.originalFilename && d.originalFilename.toLowerCase().includes(q)) ||
      (d.tags && d.tags.some(t => t.toLowerCase().includes(q)))
    );
    setSearchResults(results.slice(0, 5));
  }, [searchQuery, allDocs]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    ...(user?.role !== 'HR' ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/' }] : []),
    { icon: FileText, label: 'Documents', path: '/documents' },
    ...(user?.role === 'HR' ? [{ icon: Users, label: 'HR Management', path: '/hr' }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-alice-blue/30 overflow-hidden">
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-sky-blue/10 blob blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-tangerine/5 blob blur-3xl -z-10 animate-pulse delay-700"></div>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      <aside 
        className={cn(
          "glass rounded-3xl transition-all duration-500 flex flex-col items-center py-8 z-[60] fixed md:relative h-[calc(100vh-2rem)] md:h-auto m-4",
          isSidebarCollapsed ? "w-20" : "w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 mb-12 px-4">
          <div className="w-10 h-10 bg-sky-blue rounded-xl flex items-center justify-center shadow-lg shadow-sky-blue/20">
            <Layers className="text-white w-6 h-6" />
          </div>
          {!isSidebarCollapsed && (
            <span className="font-heading text-xl font-bold tracking-tight text-slate-800">DocuSense</span>
          )}
        </div>

        <nav className="flex-1 w-full px-3 space-y-2 mt-4 md:mt-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
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
            className="hidden md:flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-white/40 transition-all cursor-pointer"
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
      <main className="flex-1 flex flex-col p-4 overflow-hidden relative">
        <header className="flex items-center justify-between px-4 md:px-6 py-4 glass rounded-2xl mb-6 shrink-0 gap-3 z-40 relative">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 glass-button md:hidden cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate">{title}</h1>
              {!hideWelcome && (
                <p className="text-slate-500 text-xs md:text-sm truncate">Welcome back, {user?.name}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="relative group w-32 sm:w-48 md:w-64" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-sky-blue transition-colors" />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                className="glass-input pl-10 w-full text-sm"
              />
              {showSearchDropdown && (searchQuery.trim().length > 0 || isSearching) && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] glass rounded-xl shadow-xl border border-white/40 overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin text-sky-blue" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {searchResults.map(doc => (
                        <button
                          key={doc._id}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            navigate(`/documents/${doc._id}`);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-white/60 flex items-start gap-3 border-b border-white/20 last:border-0 cursor-pointer transition-colors"
                        >
                          <File className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{doc.title || doc.originalFilename}</p>
                            <p className="text-[10px] text-slate-500 truncate">{doc.mimeType?.includes('pdf') ? 'PDF' : 'DOC'} • {doc.accessLevel}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500 italic">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0 md:pl-4 md:border-l border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-indigo-400 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;