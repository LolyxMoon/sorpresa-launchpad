const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { Keypair } = require('@solana/web3.js');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://www.sorpresa.fun', 'https://sorpresa.fun', 'https://sorpresa-launchpad.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir));

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const PUMPPORTAL_API_KEY = process.env.PUMPPORTAL_API_KEY;
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
const API_URL = process.env.API_URL || 'http://localhost:3001';

console.log('🔑 API Key present:', !!PUMPPORTAL_API_KEY);
console.log('🌐 RPC URL:', HELIUS_RPC_URL);

let db = null;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    db = mongoose.connection.db;
  })
  .catch((error) => {
    console.error('⚠️ MongoDB connection failed:', error.message);
  });
} else {
  console.log('⚠️ MongoDB URI not provided, using in-memory storage');
  global.tokensMemory = [];
}

function verifyWalletSignature(walletAddress, signature, message) {
  try {
    const publicKey = bs58.decode(walletAddress);
    const signatureBytes = Buffer.from(signature, 'base64');
    const messageBytes = Buffer.from(message, 'base64');

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey
    );

    console.log(`🔐 Wallet ${walletAddress.slice(0, 8)}... signature: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error.message);
    return false;
  }
}

// ⭐ CREAR TOKEN CON /api/trade (Mayhem Mode)
async function createMayhemToken(tokenCreationData, imageBuffer) {
  try {
    console.log('🔥 Creating MAYHEM MODE token...');
    console.log(`   For wallet: ${tokenCreationData.creator}`);
    
    // 1. Subir metadata a IPFS
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'token.png',
      contentType: 'image/png'
    });
    formData.append('name', tokenCreationData.name);
    formData.append('symbol', tokenCreationData.symbol);
    formData.append('description', tokenCreationData.description);
    formData.append('twitter', tokenCreationData.twitter || '');
    formData.append('telegram', tokenCreationData.telegram || '');
    formData.append('website', tokenCreationData.website || '');
    formData.append('showName', 'true');

    console.log('📤 Uploading metadata to IPFS...');
    
    const metadataResponse = await axios.post(
      'https://pump.fun/api/ipfs',
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const metadataUri = metadataResponse.data.metadataUri;
    console.log('✅ Metadata uploaded:', metadataUri);

    // 2. Generar keypair para el token
    const mintKeypair = Keypair.generate();
    const mintAddress = mintKeypair.publicKey.toBase58();
    
    console.log('🔑 Generated mint keypair:', mintAddress);

    // 3. Preparar token metadata
    const tokenMetadata = {
      name: tokenCreationData.name,
      symbol: tokenCreationData.symbol,
      uri: metadataUri
    };

    // 4. Crear token con MAYHEM MODE usando /api/trade
    console.log('🔥 Creating token with MAYHEM MODE...');
    
    const createPayload = {
      publicKey: tokenCreationData.creator, // ⭐ WALLET DEL USUARIO - ÉL PAGA
      action: 'create',
      tokenMetadata: tokenMetadata,
      mint: bs58.encode(mintKeypair.secretKey),
      denominatedInSol: true,
      amount: parseFloat(tokenCreationData.devBuyAmount || 0),
      slippage: parseInt(tokenCreationData.slippage || 10),
      priorityFee: parseFloat(tokenCreationData.priorityFee || 0.0005),
      pool: 'pump',
      isMayhemMode: true // ⭐ MAYHEM MODE
    };

    console.log('📝 Creating token with:', {
      publicKey: createPayload.publicKey,
      action: createPayload.action,
      amount: createPayload.amount,
      isMayhemMode: createPayload.isMayhemMode
    });

    console.log('📡 Calling PumpPortal /api/trade (Mayhem Mode)...');

    // ⭐ USAR /api/trade (NO trade-local)
    const createResponse = await axios.post(
      `https://pumpportal.fun/api/trade?api-key=${PUMPPORTAL_API_KEY}`,
      createPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    console.log('✅ PumpPortal Response Status:', createResponse.status);
    console.log('📦 Response:', JSON.stringify(createResponse.data, null, 2));

    const signature = createResponse.data.signature;
    const transaction = createResponse.data;

    if (!signature) {
      console.log('⚠️ No signature in response, transaction may be pending');
    } else {
      console.log('✅ Transaction signature:', signature);
    }

    return {
      success: true,
      mintAddress: mintAddress,
      signature: signature || 'pending',
      transaction: transaction,
      metadataUri: metadataUri,
      mayhemMode: true
    };

  } catch (error) {
    console.error('❌ Error creating Mayhem token:', error.message);
    console.error('📦 Status Code:', error.response?.status);
    console.error('📦 Error Response:', JSON.stringify(error.response?.data, null, 2));
    
    throw new Error(error.response?.data?.message || error.message || 'Failed to create token');
  }
}
// ============================================
// ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mayhemMode: true,
    apiTrade: true, // Usando /api/trade
    timestamp: new Date().toISOString(),
    mongodb: db ? 'connected' : 'in-memory',
    apiKeyPresent: !!PUMPPORTAL_API_KEY
  });
});

// Crear token con Mayhem Mode
app.post('/api/create-token', upload.single('image'), async (req, res) => {
  try {
    console.log('🔥 ============================================');
    console.log('🔥 MAYHEM MODE TOKEN CREATION REQUEST');
    console.log('🔥 ============================================');
    
    const { 
      walletAddress, 
      signature, 
      message,
      name, 
      symbol, 
      description,
      twitter,
      telegram,
      website,
      devBuyAmount,
      slippage,
      priorityFee
    } = req.body;

    if (!walletAddress || !signature || !message) {
      console.log('❌ Missing wallet verification data');
      return res.status(400).json({ error: 'Missing wallet verification data' });
    }

    console.log(`🔐 Verifying wallet: ${walletAddress.slice(0, 8)}...`);
    const isValidSignature = verifyWalletSignature(walletAddress, signature, message);
    
    if (!isValidSignature) {
      console.log('❌ Invalid signature!');
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }

    console.log('✅ Wallet verified!');
    console.log(`   User wallet: ${walletAddress}`);

    if (!req.file) {
      console.log('❌ No image provided');
      return res.status(400).json({ error: 'Token image is required' });
    }

    console.log(`📷 Image received: ${req.file.size} bytes`);

    let localImageUrl = null;
    try {
      const imageFilename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const imagePath = path.join(uploadsDir, imageFilename);
      fs.writeFileSync(imagePath, req.file.buffer);
      localImageUrl = `${API_URL}/uploads/${imageFilename}`;
      console.log(`✅ Image saved: ${localImageUrl}`);
    } catch (error) {
      console.error('⚠️ Error saving image:', error.message);
    }

    const tokenCreationData = {
      creator: walletAddress, // ⭐ WALLET DEL USUARIO
      name,
      symbol,
      description,
      twitter: twitter || '',
      telegram: telegram || '',
      website: website || '',
      devBuyAmount: devBuyAmount || '0',
      slippage: slippage || '10',
      priorityFee: priorityFee || '0.0005'
    };

    console.log('🔥 Creating token on PumpPortal...');
    console.log(`   User will pay from: ${walletAddress}`);
    
    let pumpFunResult;
    try {
      pumpFunResult = await createMayhemToken(tokenCreationData, req.file.buffer);
    } catch (error) {
      console.error('❌ PumpPortal creation failed:', error.message);
      return res.status(500).json({ 
        error: 'Failed to create token: ' + error.message 
      });
    }

    const { mintAddress, signature: txSignature, metadataUri } = pumpFunResult;

    console.log('✅ Token created!');
    console.log(`   Mint Address: ${mintAddress}`);
    console.log(`   Signature: ${txSignature}`);
    
    const token = {
      mintAddress,
      name,
      symbol,
      description,
      imageUrl: localImageUrl,
      metadataUri,
      creator: walletAddress, // ⭐ WALLET DEL USUARIO
      twitter: twitter || null,
      telegram: telegram || null,
      website: website || null,
      pumpFunUrl: `https://pump.fun/${mintAddress}`,
      solscanUrl: `https://solscan.io/token/${mintAddress}`,
      transactionUrl: txSignature !== 'pending' ? `https://solscan.io/tx/${txSignature}` : null,
      signature: txSignature,
      devBuyAmount: devBuyAmount || '0',
      mayhemMode: true,
      status: 'confirmed',
      createdAt: new Date()
    };

    if (db) {
      try {
        await db.collection('tokens').insertOne(token);
        console.log(`✅ Token saved in MongoDB`);
      } catch (error) {
        console.error('⚠️ Error saving to MongoDB:', error.message);
      }
    } else {
      if (!global.tokensMemory) global.tokensMemory = [];
      global.tokensMemory.push(token);
      console.log(`✅ Token saved in memory`);
    }

    console.log('🔥 ============================================');
    console.log(`🔥 TOKEN CREATED FOR ${walletAddress.slice(0, 8)}...`);
    console.log('🔥 ============================================\n');

    res.json({ 
      success: true, 
      token
    });

  } catch (error) {
    console.error('❌ Error creating token:', error);
    res.status(500).json({ 
      error: error.message || 'Error creating token' 
    });
  }
});

// Obtener todos los tokens
app.get('/api/tokens', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    let tokens = [];
    
    if (db) {
      tokens = await db.collection('tokens')
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    } else {
      tokens = (global.tokensMemory || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    }

    console.log(`📊 Returning ${tokens.length} tokens`);
    res.json({ tokens });
    
  } catch (error) {
    console.error('❌ Error fetching tokens:', error);
    res.json({ tokens: [] });
  }
});

// Obtener token específico
app.get('/api/tokens/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    let token = null;
    
    if (db) {
      token = await db.collection('tokens').findOne({ mintAddress });
    } else {
      token = (global.tokensMemory || []).find(t => t.mintAddress === mintAddress);
    }

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({ token });
    
  } catch (error) {
    console.error('❌ Error fetching token:', error);
    res.status(500).json({ error: error.message });
  }
});

// DexScreener data
app.get('/api/dexscreener/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`,
      { timeout: 5000 }
    );

    res.json(response.data);
    
  } catch (error) {
    console.error('❌ DexScreener error:', error.message);
    res.json({ pairs: [] });
  }
});

// Holders data
app.get('/api/holders/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    const response = await axios.post(
      HELIUS_RPC_URL,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenLargestAccounts',
        params: [mintAddress]
      },
      { timeout: 5000 }
    );

    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Holders error:', error.message);
    res.json({ result: { value: [] } });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   🔥 MAYHEM LAUNCHPAD BACKEND 🔥     ║');
  console.log(`║   Server running on port ${PORT}       ║`);
  console.log('║   ⚡ USING /api/trade ENDPOINT       ║');
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('🔥 Mayhem Mode creates from user wallet');
  console.log('');
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});
