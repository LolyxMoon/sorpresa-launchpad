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

// Configuración de CORS
app.use(cors({
  origin: ['https://www.sorpresa.fun', 'https://sorpresa.fun', 'https://sorpresa-launchpad.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuración de Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Crear directorio de uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Variables de entorno
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const PUMPPORTAL_API_KEY = process.env.PUMPPORTAL_API_KEY || '5x8n8y1ge5338v3ncxtq8nud8wtketut6h26muabecwm2xv76t5ppntn7184ukaragqmmgb49x0pcrb7b98ppp22chrjpuv5a95k4mure1h4wtkeaxr44gahetaqgpaa6hrmcwkm84yku9t5nau3bett7mjuucmnpwtabc88x46gwaq9nt2yktm6ctqcnk29h34pw24dn0kuf8tmb';
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=0b23dead-e221-43e0-9e34-283af384a9b0';
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Base de datos
let db = null;

// Conectar a MongoDB
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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

// Verificar firma de wallet
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

// ============================================
// FUNCIÓN PARA PREPARAR TOKEN (TRADE-LOCAL)
// ============================================

async function prepareMayhemToken(tokenCreationData, imageBuffer) {
  try {
    console.log('🔥 Preparing MAYHEM MODE token transaction...');
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

    // 4. Preparar transacción con MAYHEM MODE (TRADE-LOCAL)
    console.log('🔥 Preparing MAYHEM transaction for user to sign...');
    
    const createPayload = {
      publicKey: tokenCreationData.creator, // ⭐ WALLET DEL USUARIO
      action: 'create',
      tokenMetadata: tokenMetadata,
      mint: bs58.encode(mintKeypair.secretKey),
      denominatedInSol: 'true',
      amount: parseFloat(tokenCreationData.devBuyAmount || 0),
      slippage: parseInt(tokenCreationData.slippage || 10),
      priorityFee: parseFloat(tokenCreationData.priorityFee || 0.0005),
      pool: 'pump',
      isMayhemMode: 'true'
    };

    console.log('📝 Payload:', {
      publicKey: createPayload.publicKey,
      action: createPayload.action,
      tokenMetadata: createPayload.tokenMetadata,
      mint: '[SECRET KEY HIDDEN]',
      denominatedInSol: createPayload.denominatedInSol,
      amount: createPayload.amount,
      slippage: createPayload.slippage,
      priorityFee: createPayload.priorityFee,
      pool: createPayload.pool,
      isMayhemMode: createPayload.isMayhemMode
    });

    console.log('📡 Calling PumpPortal TRADE-LOCAL...');

    // ⭐ USAR TRADE-LOCAL en vez de TRADE
    const createResponse = await axios.post(
      `https://pumpportal.fun/api/trade-local?api-key=${PUMPPORTAL_API_KEY}`,
      createPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    console.log('✅ PumpPortal Response Status:', createResponse.status);
    console.log('📦 Response keys:', Object.keys(createResponse.data));

    const encodedTransaction = createResponse.data;

    console.log('✅ Transaction prepared successfully');
    console.log('   Mint:', mintAddress);
    console.log('   Transaction ready for user signature');

    return {
      success: true,
      mintAddress: mintAddress,
      encodedTransaction: encodedTransaction,
      metadataUri: metadataUri,
      mayhemMode: true
    };

  } catch (error) {
    console.error('❌ Error preparing Mayhem token:', error.response?.data || error.message);
    console.error('📦 Error Response:', JSON.stringify(error.response?.data, null, 2));
    throw new Error(error.response?.data?.message || error.message || 'Failed to prepare token');
  }
}

// ============================================
// ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mayhemMode: true,
    tradeLocal: true,
    timestamp: new Date().toISOString(),
    mongodb: db ? 'connected' : 'in-memory'
  });
});
// Preparar token (devuelve transacción para firmar)
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

    // Verificar datos de wallet
    if (!walletAddress || !signature || !message) {
      console.log('❌ Missing wallet verification data');
      return res.status(400).json({ error: 'Missing wallet verification data' });
    }

    // Verificar firma
    console.log(`🔐 Verifying wallet: ${walletAddress.slice(0, 8)}...`);
    const isValidSignature = verifyWalletSignature(walletAddress, signature, message);
    
    if (!isValidSignature) {
      console.log('❌ Invalid signature!');
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }

    console.log('✅ Wallet verified!');
    console.log(`   User wallet: ${walletAddress}`);

    // Verificar imagen
    if (!req.file) {
      console.log('❌ No image provided');
      return res.status(400).json({ error: 'Token image is required' });
    }

    console.log(`📷 Image received: ${req.file.size} bytes`);

    // Guardar imagen localmente
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

    // Preparar datos del token
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

    // Preparar transacción en PumpPortal
    console.log('🔥 Preparing transaction for user to sign...');
    console.log(`   User will pay from: ${walletAddress}`);
    
    let pumpFunResult;
    try {
      pumpFunResult = await prepareMayhemToken(tokenCreationData, req.file.buffer);
    } catch (error) {
      console.error('❌ PumpPortal preparation failed:', error.message);
      return res.status(500).json({ 
        error: 'Failed to prepare token: ' + error.message 
      });
    }

    const { mintAddress, encodedTransaction, metadataUri } = pumpFunResult;

    console.log('✅ Transaction prepared!');
    console.log(`   Mint Address: ${mintAddress}`);
    console.log(`   User must sign and send transaction`);
    
    // Guardar token como "pending" en base de datos
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
      devBuyAmount: devBuyAmount || '0',
      mayhemMode: true,
      status: 'pending', // Pendiente de firma del usuario
      createdAt: new Date()
    };

    // Guardar en MongoDB
    if (db) {
      try {
        await db.collection('tokens').insertOne(token);
        console.log(`✅ Token saved as pending in MongoDB`);
      } catch (error) {
        console.error('⚠️ Error saving to MongoDB:', error.message);
      }
    } else {
      if (!global.tokensMemory) global.tokensMemory = [];
      global.tokensMemory.push(token);
      console.log(`✅ Token saved as pending in memory`);
    }

    console.log('🔥 ============================================');
    console.log(`🔥 TRANSACTION READY FOR ${walletAddress.slice(0, 8)}...`);
    console.log('🔥 ============================================\n');

    // ⭐ DEVOLVER TRANSACCIÓN PARA QUE EL USUARIO FIRME
    res.json({ 
      success: true, 
      token,
      requiresSignature: true,
      encodedTransaction // El frontend hará que el usuario firme esto
    });

  } catch (error) {
    console.error('❌ Error preparing token:', error);
    res.status(500).json({ 
      error: error.message || 'Error preparing token' 
    });
  }
});

// Confirmar token después de que el usuario firmó
app.post('/api/confirm-token', express.json(), async (req, res) => {
  try {
    const { mintAddress, signature } = req.body;

    if (!mintAddress || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`✅ Token confirmed: ${mintAddress}`);
    console.log(`   Signature: ${signature}`);

    // Actualizar token en base de datos
    if (db) {
      await db.collection('tokens').updateOne(
        { mintAddress },
        { 
          $set: { 
            status: 'confirmed',
            signature,
            transactionUrl: `https://solscan.io/tx/${signature}`,
            confirmedAt: new Date()
          }
        }
      );
    } else {
      const tokenIndex = (global.tokensMemory || []).findIndex(t => t.mintAddress === mintAddress);
      if (tokenIndex !== -1) {
        global.tokensMemory[tokenIndex].status = 'confirmed';
        global.tokensMemory[tokenIndex].signature = signature;
        global.tokensMemory[tokenIndex].transactionUrl = `https://solscan.io/tx/${signature}`;
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error confirming token:', error);
    res.status(500).json({ error: error.message });
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   🔥 MAYHEM LAUNCHPAD BACKEND 🔥     ║');
  console.log(`║   Server running on port ${PORT}       ║`);
  console.log('║   ⚡ TRADE-LOCAL MODE ENABLED        ║');
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('🔥 User wallets will sign transactions');
  console.log('');
});

// Error handlers
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});
