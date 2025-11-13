import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, Flame, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';

const CreateToken = () => {
  const { connected, publicKey, signMessage } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [balance, setBalance] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    twitter: '',
    telegram: '',
    website: '',
    devBuyAmount: '0.01',
    slippage: '10',
    priorityFee: '0.0005'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Verificar balance cuando se conecta
  useEffect(() => {
    if (connected && publicKey) {
      checkBalance();
    } else {
      setBalance(null);
    }
  }, [connected, publicKey]);

  const checkBalance = async () => {
    try {
      const bal = await connection.getBalance(publicKey);
      const solBalance = bal / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      console.log('Wallet balance:', solBalance, 'SOL');
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  // Convertir Uint8Array a base64 sin usar Buffer
  const uint8ArrayToBase64 = (bytes) => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

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
      if (file.size > 5 * 1024 * 1024) {
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
    
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Verificar balance
    const estimatedCost = parseFloat(formData.devBuyAmount) + parseFloat(formData.priorityFee) + 0.025;
    if (balance !== null && balance < estimatedCost) {
      toast.error(`Insufficient SOL. You have ${balance.toFixed(4)} SOL but need at least ${estimatedCost.toFixed(4)} SOL`, {
        duration: 5000
      });
      return;
    }

    if (!imageFile) {
      toast.error('Please upload a token image');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('🔥 Preparing MAYHEM MODE token...');

    try {
      // Paso 1: Firmar mensaje para verificar propiedad de wallet
      const message = new TextEncoder().encode(
        `Create MAYHEM token on Sorpresa Launchpad\nWallet: ${publicKey.toString()}\nTimestamp: ${Date.now()}`
      );

      let signature;
      try {
        console.log('Requesting signature from wallet:', publicKey.toString());
        signature = await signMessage(message);
        console.log('Signature received');
        toast.loading('✅ Wallet verified, creating token...', { id: loadingToast });
      } catch (error) {
        console.error('Signature error:', error);
        if (error.message?.includes('User rejected')) {
          toast.error('You must sign the message to create a token. Please try again.', { id: loadingToast });
        } else {
          toast.error('Failed to sign message: ' + error.message, { id: loadingToast });
        }
        setLoading(false);
        return;
      }

      // Paso 2: Preparar datos
      const formDataToSend = new FormData();
      
      // Agregar info de wallet
      formDataToSend.append('walletAddress', publicKey.toString());
      formDataToSend.append('signature', uint8ArrayToBase64(signature));
      formDataToSend.append('message', uint8ArrayToBase64(message));
      
      // Agregar datos del token
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Agregar imagen
      formDataToSend.append('image', imageFile);

      toast.loading('🔥 Launching MAYHEM MODE token on Pump.fun...', { id: loadingToast });

      // Paso 3: Enviar al backend
      const response = await axios.post(`${API_URL}/api/create-token`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });

      toast.success('🔥 MAYHEM MODE token created successfully! 🎉', { id: loadingToast });
      setCreatedToken(response.data.token);
      
      // Actualizar balance
      checkBalance();
      
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        twitter: '',
        telegram: '',
        website: '',
        devBuyAmount: '0.01',
        slippage: '10',
        priorityFee: '0.0005'
      });
      setImageFile(null);
      setImagePreview(null);

    } catch (error) {
      console.error('Error creating token:', error);
      
      let errorMsg = 'Error creating token';
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message?.includes('Insufficient funds')) {
        errorMsg = `Insufficient SOL. You need at least ${estimatedCost.toFixed(4)} SOL.`;
      } else if (error.message?.includes('User rejected')) {
        errorMsg = 'You must sign both popups to create the token.';
      } else if (error.message?.includes('timeout')) {
        errorMsg = 'Request timeout. Please try again.';
      } else if (error.message?.includes('Network Error')) {
        errorMsg = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg, { id: loadingToast, duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="card">
          <div className="bg-mayhem-500 bg-opacity-10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Flame className="w-10 h-10 text-mayhem-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8">
            Connect your Solana wallet to launch a MAYHEM MODE token
            <br />
            <strong className="text-mayhem-400">AI will trade your token for 24 hours!</strong>
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
          <div className="bg-mayhem-500 bg-opacity-10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Flame className="w-10 h-10 text-mayhem-500 animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-bold mb-2">🔥 MAYHEM MODE Activated! 🔥</h2>
          <p className="text-gray-400 mb-8">
            Your token is now live! The AI agent will trade it for the next 24 hours.
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
                <div className="font-mono text-xs break-all">{createdToken.mintAddress}</div>
              </div>
              {createdToken.signature && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-400 mb-1">Transaction</div>
                  <a 
                    href={createdToken.transactionUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-mayhem-400 hover:text-mayhem-300 break-all"
                  >
                    {createdToken.signature.slice(0, 16)}...{createdToken.signature.slice(-16)}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-mayhem-950 border border-mayhem-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Flame className="w-5 h-5 text-mayhem-500 animate-pulse" />
              <span className="font-bold text-mayhem-400">MAYHEM MODE ACTIVE</span>
            </div>
            <p className="text-sm text-gray-400">
              AI agent is now trading your token. Check back in 24 hours!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={createdToken.pumpFunUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Flame className="w-4 h-4" />
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
            Launch Another Token
          </button>
        </div>
      </div>
    );
  }

  const estimatedCost = parseFloat(formData.devBuyAmount) + parseFloat(formData.priorityFee) + 0.025;
  const hasEnoughSOL = balance === null || balance >= estimatedCost;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Flame className="w-10 h-10 text-mayhem-500 animate-pulse" />
          Launch MAYHEM MODE Token
        </h1>
        <p className="text-gray-400">AI will trade your token for 24 hours automatically</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <p className="text-sm text-mayhem-400">
            Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </p>
          {balance !== null && (
            <p className={`text-sm font-bold ${hasEnoughSOL ? 'text-green-500' : 'text-red-500'}`}>
              Balance: {balance.toFixed(4)} SOL
            </p>
          )}
        </div>
      </div>

      {/* Balance Warning */}
      {balance !== null && !hasEnoughSOL && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold text-red-500 mb-1">Insufficient Balance</div>
            <p className="text-gray-300">
              You have {balance.toFixed(4)} SOL but need at least {estimatedCost.toFixed(4)} SOL.
              <br />
              Please add more SOL or reduce the Dev Buy Amount.
            </p>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      <div className="bg-mayhem-500 bg-opacity-10 border border-mayhem-500 rounded-lg p-4 mb-6 flex items-start space-x-3">
        <Flame className="w-6 h-6 text-mayhem-500 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="text-sm">
          <div className="font-bold text-mayhem-400 mb-2">🔥 MAYHEM MODE FEATURES</div>
          <ul className="text-gray-300 space-y-1">
            <li>• <strong>2B total supply</strong> - Standard Pump.fun supply</li>
            <li>• <strong>AI trades for 24 hours</strong> - Autonomous agent creates volume</li>
            <li>• <strong>Random buy/sell actions</strong> - Unpredictable trading pattern</li>
            <li>• <strong>Unsold tokens burned</strong> - After 24h, remaining AI tokens destroyed</li>
          </ul>
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
                  className="w-32 h-32 rounded-lg object-cover border-2 border-mayhem-700"
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
          <h3 className="text-xl font-bold mb-4">Token Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="label">Token Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Mayhem Coin"
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
                placeholder="e.g. MAYHEM"
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
              <label className="label">Twitter / X</label>
              <input
                type="url"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                placeholder="https://x.com/yourtoken"
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
          <h3 className="text-xl font-bold mb-4">Launch Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="label">Initial Buy Amount (SOL)</label>
              <input
                type="number"
                name="devBuyAmount"
                value={formData.devBuyAmount}
                onChange={handleInputChange}
                placeholder="0.01"
                step="0.01"
                min="0"
                className="input-field"
              />
              <p className="text-sm text-gray-400 mt-1">
                Estimated total: <strong className={hasEnoughSOL ? 'text-green-500' : 'text-red-500'}>{estimatedCost.toFixed(4)} SOL</strong>
              </p>
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !hasEnoughSOL}
          className="btn-primary w-full text-lg flex items-center justify-center space-x-2 py-4"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Launching...</span>
            </>
          ) : (
            <>
              <Flame className="w-6 h-6 animate-pulse" />
              <span>Launch MAYHEM MODE Token</span>
              <Flame className="w-6 h-6 animate-pulse" />
            </>
          )}
        </button>

        {!hasEnoughSOL && (
          <p className="text-center text-sm text-red-500">
            You need at least {estimatedCost.toFixed(4)} SOL
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateToken;
