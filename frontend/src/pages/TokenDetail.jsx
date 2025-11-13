import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { createChart } from 'lightweight-charts';
import { 
  ExternalLink, 
  TrendingUp, 
  Users, 
  Flame, 
  ArrowLeft,
  Twitter,
  Send,
  Globe,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

const TokenDetail = () => {
  const { mintAddress } = useParams();
  const [token, setToken] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    fetchTokenData();
  }, [mintAddress]);

  useEffect(() => {
    if (tokenData?.pairs?.[0]) {
      initChart();
    }
  }, [tokenData]);

  const fetchTokenData = async () => {
    try {
      setLoading(true);

      // Fetch token from our backend
      const tokenResponse = await axios.get(`${API_URL}/api/tokens/${mintAddress}`);
      setToken(tokenResponse.data.token);

      // Fetch DexScreener data
      const dexResponse = await axios.get(`${API_URL}/api/dexscreener/${mintAddress}`);
      setTokenData(dexResponse.data);

      // Fetch holders
      try {
        const holdersResponse = await axios.get(`${API_URL}/api/holders/${mintAddress}`);
        setHolders(holdersResponse.data.result?.value || []);
      } catch (error) {
        console.error('Error fetching holders:', error);
      }

    } catch (error) {
      console.error('Error fetching token data:', error);
      toast.error('Error loading token data');
    } finally {
      setLoading(false);
    }
  };

  const initChart = () => {
    if (!chartContainerRef.current || !tokenData?.pairs?.[0]) return;

    // Clear existing chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#111827' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    // Add candlestick series (mock data - in production you'd fetch real OHLC data)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Mock data - replace with real data from DexScreener or similar
    const mockData = generateMockOHLCData(tokenData.pairs[0]);
    candlestickSeries.setData(mockData);

    chart.timeScale().fitContent();
    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  const generateMockOHLCData = (pair) => {
    const data = [];
    const basePrice = parseFloat(pair.priceUsd);
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 100; i >= 0; i--) {
      const time = now - (i * 3600); // Hourly data
      const volatility = 0.05;
      const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
      const close = basePrice * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);

      data.push({
        time,
        open,
        high,
        low,
        close,
      });
    }
    return data;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mayhem-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Token Not Found</h2>
          <p className="text-gray-400 mb-6">The token you're looking for doesn't exist or hasn't been launched from this launchpad.</p>
          <Link to="/dashboard" className="btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const pair = tokenData?.pairs?.[0];
  const mayhemActive = isMayhemActive(token.createdAt);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link to="/dashboard" className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-mayhem-500 to-mayhem-700 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
              {token.symbol.substring(0, 2)}
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{token.name}</h1>
                <span className="text-xl text-gray-400">${token.symbol}</span>
                {mayhemActive && (
                  <span className="flex items-center space-x-1 bg-mayhem-500 bg-opacity-20 text-mayhem-400 px-3 py-1 rounded-full text-sm font-bold">
                    <Flame className="w-4 h-4 animate-pulse" />
                    <span>MAYHEM ACTIVE</span>
                  </span>
                )}
              </div>
              
              <p className="text-gray-400 mb-3">{token.description}</p>
              
              {/* Social Links */}
              <div className="flex items-center space-x-4">
                {token.twitter && (
                  <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {token.telegram && (
                  <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                    <Send className="w-5 h-5" />
                  </a>
                )}
                {token.website && (
                  <a href={token.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="flex flex-col space-y-2">
            <a
              href={token.pumpFunUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <span>Trade on Pump.fun</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={token.solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <span>View on Solscan</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Mint Address */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Mint Address</div>
              <div className="font-mono text-sm">{token.mintAddress}</div>
            </div>
            <button
              onClick={() => copyToClipboard(token.mintAddress)}
              className="text-gray-400 hover:text-white"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-400 mb-1">Price</div>
          <div className="text-2xl font-bold">
            {pair?.priceUsd ? `$${parseFloat(pair.priceUsd).toFixed(6)}` : '-'}
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-gray-400 mb-1">24h Volume</div>
          <div className="text-2xl font-bold">
            {pair?.volume?.h24 ? formatNumber(pair.volume.h24) : '-'}
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-gray-400 mb-1">24h Change</div>
          <div className={`text-2xl font-bold ${pair?.priceChange?.h24 > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {pair?.priceChange?.h24 ? `${pair.priceChange.h24 > 0 ? '+' : ''}${pair.priceChange.h24.toFixed(2)}%` : '-'}
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-gray-400 mb-1">Market Cap</div>
          <div className="text-2xl font-bold">
            {pair?.fdv ? formatNumber(pair.fdv) : '-'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Price Chart</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Last 24 Hours</span>
          </div>
        </div>
        <div ref={chartContainerRef} />
      </div>

      {/* Holders */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-mayhem-500" />
          <h2 className="text-xl font-bold">Top Holders</h2>
        </div>
        
        {holders.length > 0 ? (
          <div className="space-y-2">
            {holders.slice(0, 10).map((holder, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-bold text-gray-400">#{index + 1}</div>
                  <div className="font-mono text-sm">{holder.address.substring(0, 8)}...{holder.address.substring(holder.address.length - 8)}</div>
                </div>
                <div className="text-sm font-bold">
                  {((holder.amount / 10 ** 9) / 2000000000 * 100).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No holder data available
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetail;
