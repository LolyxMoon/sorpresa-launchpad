import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, Flame, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { API_URL } from '../config';

const CreateToken = () => {
  const { connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    twitter: '',
    telegram: '',
    website: '',
    showName: true,
    devBuyAmount: '0.1',
    slippage: '10',
    priorityFee: '0.0005'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload a token image');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating your token...');

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add image
      formDataToSend.append('image', imageFile);

      const response = await axios.post(`${API_URL}/api/create-token`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Token created successfully! 🎉', { id: loadingToast });
      setCreatedToken(response.data.token);
      
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        twitter: '',
        telegram: '',
        website: '',
        showName: true,
        devBuyAmount: '0.1',
        slippage: '10',
        priorityFee: '0.0005'
      });
      setImageFile(null);
      setImagePreview(null);

    } catch (error) {
      console.error('Error creating token:', error);
      toast.error(error.response?.data?.error || 'Error creating token', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="card">
          <div className="bg-mayhem-500 bg-opacity-10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Flame className="w-10 h-10 text-mayhem-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8">
            You need to connect your Solana wallet to create a token
          </p>
          <WalletMultiButton className="!bg-mayhem-600 hover:!bg-mayhem-700 !rounded-lg" />
          <p className="text-sm text-gray-500 mt-4">
            Supported: Phantom, Solflare
          </p>
        </div>
      </div>
    );
  }

  if (createdToken) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="bg-green-500 bg-opacity-10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Token Created Successfully!</h2>
          <p className="text-gray-400 mb-8">
            Your token is now live with Mayhem Mode activated. The AI will trade it for the next 24 hours.
          </p>

          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Token Name</div>
                <div className="font-bold">{createdToken.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Symbol</div>
                <div className="font-bold">{createdToken.symbol}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-400 mb-1">Mint Address</div>
                <div className="font-mono text-sm break-all">{createdToken.mintAddress}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={createdToken.pumpFunUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <span>View on Pump.fun</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            
            <a 
              href={createdToken.solscanUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <span>View on Solscan</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={() => setCreatedToken(null)}
            className="mt-6 text-mayhem-500 hover:text-mayhem-400 font-medium"
          >
            Create Another Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Launch Your Token</h1>
        <p className="text-gray-400">Fill in the details to launch your token with Mayhem Mode</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-orange-500 bg-opacity-10 border border-orange-500 rounded-lg p-4 mb-6 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-bold text-orange-500 mb-1">Mayhem Mode Notice</div>
          <p className="text-gray-300">
            This will create a token with Mayhem Mode enabled. An AI agent will trade your token for 24 hours. 
            Make sure you understand the risks before launching.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="card">
          <label className="label">Token Image *</label>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Token preview" 
                  className="w-32 h-32 rounded-lg object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700">
                  <Upload className="w-8 h-8 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label 
                htmlFor="image-upload"
                className="btn-secondary cursor-pointer inline-block"
              >
                Choose Image
              </label>
              <p className="text-sm text-gray-400 mt-2">PNG, JPG or GIF (max 5MB)</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="label">Token Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. My Awesome Token"
                className="input-field"
                required
                maxLength="32"
              />
            </div>

            <div>
              <label className="label">Token Symbol *</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="e.g. MAT"
                className="input-field"
                required
                maxLength="10"
              />
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your token..."
                className="input-field"
                rows="4"
                required
                maxLength="500"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Social Links (Optional)</h3>
          
          <div className="space-y-4">
            <div>
              <label className="label">Twitter</label>
              <input
                type="url"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                placeholder="https://twitter.com/yourtoken"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Telegram</label>
              <input
                type="url"
                name="telegram"
                value={formData.telegram}
                onChange={handleInputChange}
                placeholder="https://t.me/yourtoken"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourtoken.com"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Trading Settings */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Trading Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="label">Dev Buy Amount (SOL)</label>
              <input
                type="number"
                name="devBuyAmount"
                value={formData.devBuyAmount}
                onChange={handleInputChange}
                placeholder="0.1"
                step="0.01"
                min="0"
                className="input-field"
              />
              <p className="text-sm text-gray-400 mt-1">Amount of SOL to buy on creation</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Slippage (%)</label>
                <input
                  type="number"
                  name="slippage"
                  value={formData.slippage}
                  onChange={handleInputChange}
                  placeholder="10"
                  min="1"
                  max="50"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Priority Fee (SOL)</label>
                <input
                  type="number"
                  name="priorityFee"
                  value={formData.priorityFee}
                  onChange={handleInputChange}
                  placeholder="0.0005"
                  step="0.0001"
                  min="0"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mayhem Mode Info */}
        <div className="card bg-mayhem-950 border-mayhem-800">
          <div className="flex items-start space-x-3">
            <Flame className="w-6 h-6 text-mayhem-500 flex-shrink-0 mt-1 animate-pulse" />
            <div>
              <h3 className="text-xl font-bold mb-2 text-mayhem-400">Mayhem Mode Enabled</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Total supply: 2,000,000,000 tokens</li>
                <li>• AI agent will trade for 24 hours</li>
                <li>• Random buy/sell with equal probability</li>
                <li>• All unsold AI tokens burned after 24h</li>
                <li>• No protocol fees for AI trades</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating Token...</span>
            </>
          ) : (
            <>
              <Flame className="w-5 h-5" />
              <span>Launch Token with Mayhem Mode</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateToken;
