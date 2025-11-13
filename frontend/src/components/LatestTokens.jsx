import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Flame, ExternalLink } from 'lucide-react';

const LatestTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [tokenData, setTokenData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestTokens();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchLatestTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatestTokens = async () => {
    try {
      const response = await axios.get('/api/tokens');
      const latest = response.data.tokens.slice(0, 4); // Solo los últimos 4
      setTokens(latest);
      
      // Fetch DexScreener data para cada token
      latest.forEach(token => {
        fetchTokenData(token.mintAddress);
      });
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenData = async (mintAddress) => {
    try {
      const response = await axios.get(`/api/dexscreener/${mintAddress}`);
      if (response.data.pairs && response.data.pairs.length > 0) {
        const pair = response.data.pairs[0];
        setTokenData(prev => ({
          ...prev,
          [mintAddress]: {
            price: pair.priceUsd,
            volume24h: pair.volume?.h24,
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
            <div className="bg-gray-800 h-32 rounded-lg mb-4"></div>
            <div className="bg-gray-800 h-4 rounded mb-2"></div>
            <div className="bg-gray-800 h-4 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="card text-center py-12">
        <Flame className="w-16 h-16 text-mayhem-500 mx-auto mb-4 opacity-50" />
        <p className="text-gray-400 text-lg mb-4">No tokens launched yet</p>
        <p className="text-gray-500 text-sm">Be the first to launch a token!</p>
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
            className="card hover:border-mayhem-700 transition-all group cursor-pointer"
          >
            {/* Token Image */}
            <div className="relative mb-4">
              <div className="w-full aspect-square bg-gradient-to-br from-mayhem-500 to-mayhem-700 rounded-lg flex items-center justify-center overflow-hidden">
                <span className="text-white font-bold text-4xl">
                  {token.symbol.substring(0, 2)}
                </span>
              </div>
              {mayhemActive && (
                <div className="absolute top-2 right-2 bg-mayhem-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1 animate-pulse-glow">
                  <Flame className="w-3 h-3" />
                  <span>LIVE</span>
                </div>
              )}
            </div>

            {/* Token Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg truncate">{token.name}</h3>
                <span className="text-gray-400 text-sm">${token.symbol}</span>
              </div>

              {/* Price */}
              {data?.price && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="font-bold">
                    ${parseFloat(data.price).toFixed(6)}
                  </span>
                </div>
              )}

              {/* Market Cap */}
              {data?.marketCap && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">MCap</span>
                  <span className="font-bold">{formatNumber(data.marketCap)}</span>
                </div>
              )}

              {/* 24h Change */}
              {data?.priceChange24h !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">24h</span>
                  <span
                    className={`font-bold ${
                      data.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {data.priceChange24h > 0 ? '+' : ''}
                    {data.priceChange24h.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {/* View Button */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between text-sm">
              <span className="text-gray-400 group-hover:text-mayhem-500 transition-colors flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>View Chart</span>
              </span>
              <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-mayhem-500 transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default LatestTokens;
