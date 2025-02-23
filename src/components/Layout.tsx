import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  BookOpen, User, LogOut, Search, Clock, BookMarked, Users, Bell, 
  ClipboardList, BookPlus, Settings 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Layout = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  const studentLinks = [
    { to: '/', icon: BookOpen, label: 'Dashboard' },
    { to: '/search', icon: Search, label: 'Search Books' },
    { to: '/history', icon: Clock, label: 'Borrowing History' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const librarianLinks = [
    { to: '/', icon: BookOpen, label: 'Dashboard' },
    { to: '/manage-catalog', icon: BookPlus, label: 'Manage Catalog' },
    { to: '/manage-borrows', icon: ClipboardList, label: 'Manage Borrows' },
    { to: '/manage-users', icon: Users, label: 'Manage Users' },
    { to: '/notifications', icon: Bell, label: 'System Alerts' },
  ];

  const links = role === 'librarian' ? librarianLinks : studentLinks;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8" />
                <span className="text-xl font-bold">CUET Library</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/notifications" className="p-2 hover:bg-indigo-700 rounded-full">
                <Bell className="h-5 w-5" />
              </Link>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 p-2 hover:bg-indigo-700 rounded-lg"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-lg h-[calc(100vh-4rem)] fixed">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="flex-1 ml-64 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;