import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ExternalLink, TrendingUp, Flame } from 'lucide-react';
import { API_URL } from '../config';

const LatestTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState({});

  useEffect(() => {
    fetchLatestTokens();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLatestTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatestTokens = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tokens?limit=4`);
      const latestTokens = response.data.tokens.slice(0, 4);
      setTokens(latestTokens);
      
      // Fetch DexScreener data for each token
      latestTokens.forEach(token => {
        fetchTokenData(token.mintAddress);
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching latest tokens:', error);
      setLoading(false);
    }
  };

  const fetchTokenData = async (mintAddress) => {
    try {
      const response = await axios.get(`${API_URL}/api/dexscreener/${mintAddress}`);
      if (response.data.pairs && response.data.pairs.length > 0) {
        const pair = response.data.pairs[0];
        setTokenData(prev => ({
          ...prev,
          [mintAddress]: {
            price: pair.priceUsd,
            priceChange24h: pair.priceChange?.h24,
            marketCap: pair.fdv
          }
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for ${mintAddress}:`, error);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const isMayhemActive = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-32 bg-gray-800 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-800 rounded mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="card text-center py-12">
        <Flame className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg mb-4">No tokens launched yet</p>
        <Link to="/create" className="btn-primary inline-block">
          Be the First to Launch
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tokens.map((token) => {
        const data = tokenData[token.mintAddress];
        const mayhemActive = isMayhemActive(token.createdAt);

        return (
          <Link
            key={token.mintAddress}
            to={`/token/${token.mintAddress}`}
            className="card hover:border-mayhem-700 transition-all group"
          >
            {/* Token Image */}
            <div className="relative mb-4">
              <div className="w-full h-32 bg-gradient-to-br from-mayhem-500 to-mayhem-700 rounded-lg flex items-center justify-center overflow-hidden">
                {token.imageUrl ? (
                  <img 
                    src={token.imageUrl} 
                    alt={token.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-2xl">${token.symbol.substring(0, 2)}</div>`;
                    }}
                  />
                ) : (
                  <div className="text-white font-bold text-2xl">
                    {token.symbol.substring(0, 2)}
                  </div>
                )}
              </div>
              
              {mayhemActive && (
                <div className="absolute top-2 right-2 flex items-center space-x-1 bg-mayhem-500 bg-opacity-90 text-white px-2 py-1 rounded-full text-xs font-bold">
                  <Flame className="w-3 h-3 animate-pulse" />
                  <span>LIVE</span>
                </div>
              )}
            </div>

            {/* Token Info */}
            <div className="mb-3">
              <h3 className="text-lg font-bold mb-1 group-hover:text-mayhem-400 transition-colors">
                {token.name}
              </h3>
              <span className="text-gray-400 text-sm">${token.symbol}</span>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Price</span>
                <span className="font-bold">
                  {data?.price ? `$${parseFloat(data.price).toFixed(6)}` : '-'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">24h</span>
                <span className={`font-bold ${data?.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {data?.priceChange24h ? `${data.priceChange24h > 0 ? '+' : ''}${data.priceChange24h.toFixed(2)}%` : '-'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">MCap</span>
                <span className="font-bold">
                  {data?.marketCap ? formatNumber(data.marketCap) : '-'}
                </span>
              </div>
            </div>

            {/* View Chart Link */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
              <span className="text-sm text-mayhem-500 group-hover:text-mayhem-400 flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>View Chart</span>
              </span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default LatestTokens;
