import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Flame } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-900 bg-opacity-50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-mayhem-500 p-2 rounded-lg group-hover:bg-mayhem-600 transition-colors">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Sorpresa</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/')
                  ? 'bg-mayhem-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Home
            </Link>
            <Link
              to="/create"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/create')
                  ? 'bg-mayhem-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Launch Token
            </Link>
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-mayhem-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Dashboard
            </Link>
          </div>

          {/* Wallet Button */}
          <div className="flex items-center">
            <WalletMultiButton className="!bg-mayhem-600 hover:!bg-mayhem-700 !rounded-lg !h-10" />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-center space-x-1 pb-3">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/')
                ? 'bg-mayhem-500 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            Home
          </Link>
          <Link
            to="/create"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/create')
                ? 'bg-mayhem-500 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            Launch
          </Link>
          <Link
            to="/dashboard"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-mayhem-500 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
