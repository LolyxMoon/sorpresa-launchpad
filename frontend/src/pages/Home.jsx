import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Flame, BarChart3 } from 'lucide-react';
import LatestTokens from '../components/LatestTokens';

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20">
        <div className="inline-flex items-center space-x-2 bg-mayhem-950 border border-mayhem-800 rounded-full px-6 py-2 mb-8">
          <Flame className="w-4 h-4 text-mayhem-500 animate-pulse" />
          <span className="text-sm font-medium text-mayhem-400">Powered by Pump.fun Mayhem Mode</span>
        </div>
        
        <img 
          src="/banner123.png" 
          alt="Launch Your Token" 
          className="max-w-4xl mx-auto mb-6 w-full px-4"
        />
        
        <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
          Deploy your Solana token with Mayhem Mode - an autonomous AI agent that trades your token 
          in the first 24 hours, creating volume and visibility automatically.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create" className="btn-primary flex items-center justify-center space-x-2 text-lg">
            <Rocket className="w-5 h-5" />
            <span>Launch Token Now</span>
          </Link>
          
          <Link to="/dashboard" className="btn-secondary flex items-center justify-center space-x-2 text-lg">
            <BarChart3 className="w-5 h-5" />
            <span>View Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-20">
        <div className="card text-center">
          <div className="text-4xl font-bold text-mayhem-500 mb-2">24h</div>
          <div className="text-gray-400">AI Trading Period</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-mayhem-500 mb-2">2B</div>
          <div className="text-gray-400">Total Token Supply</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-mayhem-500 mb-2">100%</div>
          <div className="text-gray-400">Automated Trading</div>
        </div>
      </div>

      {/* Latest Tokens Section */}
      <div className="my-20">
        <h2 className="text-4xl font-bold text-center mb-12 flex items-center justify-center gap-3">
          Latest Launches 
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-10 w-10 object-contain inline-block"
          />
        </h2>
        <LatestTokens />
      </div>

      {/* How It Works Section */}
      <div className="my-20">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-mayhem-500 bg-opacity-10 border-2 border-mayhem-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-mayhem-500">1</span>
            </div>
            <h3 className="font-bold mb-2">Create Token</h3>
            <p className="text-gray-400 text-sm">Fill the form with your token details and upload a logo</p>
          </div>

          <div className="text-center">
            <div className="bg-mayhem-500 bg-opacity-10 border-2 border-mayhem-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-mayhem-500">2</span>
            </div>
            <h3 className="font-bold mb-2">AI Starts Trading</h3>
            <p className="text-gray-400 text-sm">Mayhem AI agent begins random buying and selling</p>
          </div>

          <div className="text-center">
            <div className="bg-mayhem-500 bg-opacity-10 border-2 border-mayhem-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-mayhem-500">3</span>
            </div>
            <h3 className="font-bold mb-2">Volume Attracts</h3>
            <p className="text-gray-400 text-sm">Trading activity brings real traders to your token</p>
          </div>

          <div className="text-center">
            <div className="bg-mayhem-500 bg-opacity-10 border-2 border-mayhem-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-mayhem-500">4</span>
            </div>
            <h3 className="font-bold mb-2">Track & Grow</h3>
            <p className="text-gray-400 text-sm">Monitor performance and build your community</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="card bg-gradient-to-r from-mayhem-950 to-gray-900 border-mayhem-700 text-center py-16 my-20">
        <h2 className="text-4xl font-bold mb-4">Ready to Launch?</h2>
        <p className="text-xl text-gray-400 mb-8">
          Join the future of token launches with AI-powered trading
        </p>
        <Link to="/create" className="btn-primary inline-flex items-center space-x-2">
          <Rocket className="w-5 h-5" />
          <span>Launch Your Token</span>
        </Link>
      </div>
    </div>
  );
};

export default Home;
