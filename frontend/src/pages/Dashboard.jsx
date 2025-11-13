import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ExternalLink, TrendingUp, Clock, Flame, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

const Dashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tokenData, setTokenData] = useState({});

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/tokens`);
      setTokens(response.data.tokens);
      
      // Fetch DexScreener data for each token
      response.data.tokens.forEach(token => {
        fetchTokenData(token.mintAddress);
      });
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Error loading tokens');
    } finally {
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
            volume24h: pair.volume?.h24,
            priceChange24h: pair.priceChange?.h24,
            liquidity: pair.liquidity?.usd,
            marketCap: pair.fdv
          }
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for ${mintAddress}:`, error);
    }
  };

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.mintAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatTime = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const isMayhemActive = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mayhem-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Token Dashboard</h1>
          <p className="text-gray-400">Track all tokens launched from this launchpad</p>
        </div>
        
        <button
          onClick={fetchTokens}
          className="btn-secondary flex items-center space-x-2 mt-4 md:mt-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="text-sm text-gray-400 mb-1">Total Tokens Launched</div>
          <div className="text-3xl font-bold text-mayhem-500">{tokens.length}</div>
        </div>
        
        <div className="card">
          <div className="text-sm text-gray-400 mb-1">Active Mayhem</div>
          <div className="text-3xl font-bold text-green-500">
            {tokens.filter(t => isMayhemActive(t.createdAt)).length}
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-gray-400 mb-1">Completed Mayhem</div>
          <div className="text-3xl font-bold text-blue-500">
            {tokens.filter(t => !isMayhemActive(t.createdAt)).length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, symbol, or mint address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Tokens List */}
      {filteredTokens.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">No tokens found</p>
          <Link to="/create" className="btn-primary mt-4 inline-block">
            Launch Your First Token
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTokens.map((token) => {
            const data = tokenData[token.mintAddress];
            const mayhemActive = isMayhemActive(token.createdAt);

            return (
              <div key={token.mintAddress} className="card hover:border-mayhem-700 transition-all">
                <div className="flex items-start space-x-4">
                  {/* Token Logo */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {token.metadataUri ? (
                        <div className="w-full h-full bg-gradient-to-br from-mayhem-500 to-mayhem-700 flex items-center justify-center text-white font-bold text-xl">
                          {token.symbol.substring(0, 2)}
                        </div>
                      ) : (
                        <Flame className="w-8 h-8 text-mayhem-500" />
                      )}
                    </div>
                  </div>

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold">{token.name}</h3>
                      <span className="text-gray-400">${token.symbol}</span>
                      {mayhemActive && (
                        <span className="flex items-center space-x-1 bg-mayhem-500 bg-opacity-20 text-mayhem-400 px-3 py-1 rounded-full text-xs font-bold">
                          <Flame className="w-3 h-3 animate-pulse" />
                          <span>MAYHEM ACTIVE</span>
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{token.description}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-400">Price</div>
                        <div className="font-bold">
                          {data?.price ? `$${parseFloat(data.price).toFixed(6)}` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">24h Volume</div>
                        <div className="font-bold">{data?.volume24h ? formatNumber(data.volume24h) : '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">24h Change</div>
                        <div className={`font-bold ${data?.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {data?.priceChange24h ? `${data.priceChange24h > 0 ? '+' : ''}${data.priceChange24h.toFixed(2)}%` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Market Cap</div>
                        <div className="font-bold">{data?.marketCap ? formatNumber(data.marketCap) : '-'}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/token/${token.mintAddress}`}
                        className="flex items-center space-x-1 text-mayhem-500 hover:text-mayhem-400 font-medium text-sm"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>View Chart</span>
                      </Link>

                      <a
                        href={token.pumpFunUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-400 hover:text-white font-medium text-sm"
                      >
                        <span>Pump.fun</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <a
                        href={token.solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-400 hover:text-white font-medium text-sm"
                      >
                        <span>Solscan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div className="flex items-center space-x-1 text-gray-500 text-xs ml-auto">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(token.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
