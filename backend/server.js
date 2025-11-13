const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'https://sorpresa-launchpad.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuración de Multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(uploadsDir));
console.log('📁 Serving uploads from:', uploadsDir);

// Variables de entorno
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const PUMPPORTAL_API_KEY = process.env.PUMPPORTAL_API_KEY;
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL;
const DEXSCREENER_API = process.env.DEXSCREENER_API || 'https://api.dexscreener.com/latest/dex';
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
    console.error('⚠️ MongoDB connection failed, using in-memory storage:', error.message);
  });
} else {
  console.log('⚠️ MongoDB URI not provided, using in-memory storage');
}

// Storage en memoria para desarrollo (si no hay MongoDB)
if (!db) {
  global.tokensMemory = [];
}

// Función para verificar firma de wallet
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

    console.log(`🔐 Wallet signature verification for ${walletAddress.slice(0, 8)}...: ${isValid ? 'VALID ✅' : 'INVALID ❌'}`);
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error.message);
    return false;
  }
}

// ============================================
// ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: db ? 'connected' : 'in-memory'
  });
});

// Crear token con verificación de wallet
app.post('/api/create-token', upload.single('image'), async (req, res) => {
  try {
    console.log('📝 Creating token...');
    
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
      showName,
      devBuyAmount,
      slippage,
      priorityFee
    } = req.body;

    // Verificar que tenemos todos los datos necesarios
    if (!walletAddress || !signature || !message) {
      console.log('❌ Missing wallet verification data');
      return res.status(400).json({ error: 'Missing wallet verification data' });
    }

    // Verificar firma de wallet
    console.log(`🔐 Verifying wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`);
    const isValidSignature = verifyWalletSignature(walletAddress, signature, message);
    
    if (!isValidSignature) {
      console.log('❌ Invalid signature!');
      return res.status(401).json({ error: 'Invalid wallet signature. Please try again.' });
    }

    console.log('✅ Wallet verified!');

    // Procesar imagen
    let imageUrl = null;
    if (req.file) {
      try {
        const imageFilename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const imagePath = path.join(uploadsDir, imageFilename);
        fs.writeFileSync(imagePath, req.file.buffer);
        
        // URL pública de la imagen
        imageUrl = `${API_URL}/uploads/${imageFilename}`;
        
        console.log(`📷 Image saved: ${imageUrl}`);
      } catch (error) {
        console.error('❌ Error saving image:', error.message);
        // Continuar sin imagen
      }
    }

    // ============================================
    // INTEGRACIÓN CON PUMP.FUN
    // ============================================
    // IMPORTANTE: Aquí debes integrar tu lógica de Pump.fun
    // El ejemplo a continuación es solo un placeholder
    
    // TODO: Reemplazar con tu integración real de Pump.fun
    // que use el walletAddress del usuario para crear el token
    
    // Por ahora, crear un token de ejemplo
    const mintAddress = 'TOKEN' + Date.now() + Math.random().toString(36).substring(7);
    
    console.log('🚀 Token creation initiated');
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Creator: ${walletAddress.slice(0, 8)}...`);
    
    // ============================================
    // FIN DE INTEGRACIÓN CON PUMP.FUN
    // ============================================
    
    // Preparar datos del token
    const token = {
      mintAddress,
      name,
      symbol,
      description,
      imageUrl,
      creator: walletAddress,
      twitter: twitter || null,
      telegram: telegram || null,
      website: website || null,
      pumpFunUrl: `https://pump.fun/${mintAddress}`,
      solscanUrl: `https://solscan.io/token/${mintAddress}`,
      metadataUri: imageUrl,
      devBuyAmount: devBuyAmount || '0',
      createdAt: new Date()
    };

    // Guardar en base de datos
    if (db) {
      try {
        await db.collection('tokens').insertOne(token);
        console.log(`✅ Token saved to MongoDB: ${mintAddress}`);
      } catch (error) {
        console.error('❌ Error saving to MongoDB:', error.message);
        // Continuar de todos modos
      }
    } else {
      // Guardar en memoria si no hay MongoDB
      if (!global.tokensMemory) global.tokensMemory = [];
      global.tokensMemory.push(token);
      console.log(`✅ Token saved to memory: ${mintAddress}`);
    }

    console.log(`🎉 Token created successfully by ${walletAddress.slice(0, 8)}...`);

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

// Obtener todos los tokens (con límite opcional)
app.get('/api/tokens', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    let tokens = [];
    
    if (db) {
      // Desde MongoDB
      tokens = await db.collection('tokens')
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      console.log(`📊 Returning ${tokens.length} tokens from MongoDB`);
    } else {
      // Desde memoria
      tokens = (global.tokensMemory || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
      console.log(`📊 Returning ${tokens.length} tokens from memory`);
    }

    res.json({ tokens });
    
  } catch (error) {
    console.error('❌ Error fetching tokens:', error);
    res.json({ tokens: [] });
  }
});

// Obtener token específico por mintAddress
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

    console.log(`📊 Returning token: ${mintAddress}`);
    res.json({ token });
    
  } catch (error) {
    console.error('❌ Error fetching token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener datos de DexScreener
app.get('/api/dexscreener/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    const response = await axios.get(
      `${DEXSCREENER_API}/tokens/${mintAddress}`,
      { timeout: 5000 }
    );

    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Error fetching DexScreener data:', error.message);
    res.json({ pairs: [] });
  }
});

// Obtener holders de un token
app.get('/api/holders/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    if (!HELIUS_RPC_URL) {
      return res.json({ result: { value: [] } });
    }

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
    console.error('❌ Error fetching holders:', error.message);
    res.json({ result: { value: [] } });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   🚀 MAYHEM LAUNCHPAD BACKEND        ║');
  console.log(`║   Server running on port ${PORT}       ║`);
  console.log(`║   Environment: ${process.env.NODE_ENV || 'development'}          ║`);
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('📍 Endpoints:');
  console.log(`   GET  ${API_URL}/api/health`);
  console.log(`   POST ${API_URL}/api/create-token`);
  console.log(`   GET  ${API_URL}/api/tokens`);
  console.log(`   GET  ${API_URL}/api/tokens/:mintAddress`);
  console.log(`   GET  ${API_URL}/api/dexscreener/:mintAddress`);
  console.log(`   GET  ${API_URL}/api/holders/:mintAddress`);
  console.log('');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});
