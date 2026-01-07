'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { BarChart3, Home } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary border-r" style={{ borderColor: 'var(--border-primary)' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <Link href="/" className="text-lg font-semibold text-purple hover:opacity-80 transition-opacity">
          Insider Dashboard
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="p-3 mb-2 rounded-lg border cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? 'var(--purple-light)' : 'var(--bg-primary)',
                    borderColor: isActive ? 'var(--purple-secondary)' : 'var(--border-primary)',
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" style={{ color: isActive ? 'var(--purple-primary)' : 'var(--text-secondary)' }} />
                    <span 
                      className="text-sm font-medium"
                      style={{ color: isActive ? 'var(--purple-primary)' : 'var(--text-primary)' }}
                    >
                      {item.name}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={toggleTheme}
          className="w-full px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)'
          }}
        >
          {theme === 'light' ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-sm">Dark Mode</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm">Light Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

