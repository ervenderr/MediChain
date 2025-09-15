'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function DesktopNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [patientName, setPatientName] = useState<string>('');

  useEffect(() => {
    const name = localStorage.getItem('patientName');
    if (name) {
      setPatientName(name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('patientId');
    localStorage.removeItem('patientName');
    router.push('/');
  };

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        </svg>
      )
    },
    {
      href: '/dashboard/records',
      label: 'Health Records',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      href: '/dashboard/qr',
      label: 'QR Codes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      href: '/dashboard/emergency',
      label: 'Emergency Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              <img 
                src="/medichain.svg" 
                alt="MediChain" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-gray-900">MediChain</span>
            </Link>

            {/* Navigation items */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* User greeting */}
            <div className="hidden lg:block text-sm text-gray-600">
              Welcome back, <span className="font-medium text-gray-900">{patientName}</span>
            </div>

            {/* Quick actions dropdown */}
            <div className="relative">
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {patientName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden xl:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

    </nav>
  );
}