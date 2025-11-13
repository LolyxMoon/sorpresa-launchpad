import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Flame, Rocket, LayoutDashboard, Twitter } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'text-mayhem-500 border-b-2 border-mayhem-500' : 'text-gray-300 hover:text-white';
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src="/sorpresabanner.png" 
              alt="Launchpad Logo" 
              className="h-10 md:h-12 object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/create" 
              className={`flex items-center space-x-2 py-2 transition-colors ${isActive('/create')}`}
            >
              <Rocket className="w-4 h-4" />
              <span className="font-medium">Launch Token</span>
            </Link>
            
            <Link 
              to="/dashboard" 
              className={`flex items-center space-x-2 py-2 transition-colors ${isActive('/dashboard')}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </Link>

            <a
              href="https://x.com/SorpresaPAD"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <Twitter className="w-4 h-4" />
              <span className="font-medium">Twitter</span>
            </a>
          </div>

          {/* Wallet Button */}
          <div className="flex items-center space-x-4">
            <WalletMultiButton className="!bg-mayhem-600 hover:!bg-mayhem-700 !rounded-lg !h-10" />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-3 border-t border-gray-800">
          <Link 
            to="/create" 
            className={`flex flex-col items-center space-y-1 ${isActive('/create')}`}
          >
            <Rocket className="w-5 h-5" />
            <span className="text-xs">Launch</span>
          </Link>
          
          <Link 
            to="/dashboard" 
            className={`flex flex-col items-center space-y-1 ${isActive('/dashboard')}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </Link>

          <a
            href="https://twitter.com/TU_USUARIO_AQUI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center space-y-1 text-gray-300"
          >
            <Twitter className="w-5 h-5" />
            <span className="text-xs">Twitter</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
