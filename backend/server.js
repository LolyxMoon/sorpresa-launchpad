import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import multer from 'multer';
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'https://sorpresa-launchpad.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configurar multer para manejar uploads de archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MongoDB connection (opcional)
let db;
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      db = client.db();
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('⚠️ MongoDB not configured, using in-memory storage');
    }
  } catch (error) {
    console.log('⚠️ MongoDB connection failed, using in-memory storage');
  }
};

// In-memory storage si no hay MongoDB
let tokensInMemory = [];

// ====================
// RUTAS
// ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Crear token en Mayhem Mode
app.post('/api/create-token', upload.single('image'), async (req, res) => {
  try {
    const {
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

    const imageFile = req.file;

    // Validaciones
    if (!name || !symbol || !description || !imageFile) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: name, symbol, description, image'
      });
    }

    console.log('📝 Creando token:', { name, symbol });

    // Paso 1: Upload imagen a IPFS de Pump.fun
    const formData = new FormData();
    formData.append('file', imageFile.buffer, {
      filename: imageFile.originalname,
      contentType: imageFile.mimetype
    });
    formData.append('name', name);
    formData.append('symbol', symbol);
    formData.append('description', description);
    if (twitter) formData.append('twitter', twitter);
    if (telegram) formData.append('telegram', telegram);
    if (website) formData.append('website', website);
    formData.append('showName', showName || 'true');

    console.log('📤 Subiendo metadata a IPFS...');
    const ipfsResponse = await axios.post(
      'https://pump.fun/api/ipfs',
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    const metadataUri = ipfsResponse.data.metadataUri;
    console.log('✅ Metadata URI:', metadataUri);

    // Paso 2: Generar keypair para el mint
    const mintKeypair = Keypair.generate();
    const mintAddress = mintKeypair.publicKey.toBase58();
    const mintPrivateKey = bs58.encode(mintKeypair.secretKey);

    console.log('🔑 Mint address generado:', mintAddress);

    // Paso 3: Crear token con PumpPortal en Mayhem Mode
    const tokenMetadata = {
      name: name,
      symbol: symbol,
      uri: metadataUri
    };

    const createPayload = {
      action: 'create',
      tokenMetadata: tokenMetadata,
      mint: mintPrivateKey,
      denominatedInSol: 'true',
      amount: parseFloat(devBuyAmount) || 0.1,
      slippage: parseInt(slippage) || 10,
      priorityFee: parseFloat(priorityFee) || 0.0005,
      pool: 'pump',
      isMayhemMode: 'true' // ← SIEMPRE TRUE PARA MAYHEM MODE
    };

    console.log('🚀 Enviando transacción a PumpPortal...');
    const createResponse = await axios.post(
      `https://pumpportal.fun/api/trade?api-key=${process.env.PUMPPORTAL_API_KEY}`,
      createPayload,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (createResponse.status !== 200) {
      throw new Error('Error al crear token en PumpPortal');
    }

    const signature = createResponse.data.signature;
    console.log('✅ Token creado! Signature:', signature);

    // Paso 4: Guardar en base de datos
    const tokenData = {
      mintAddress,
      name,
      symbol,
      description,
      twitter: twitter || null,
      telegram: telegram || null,
      website: website || null,
      metadataUri,
      devBuyAmount: parseFloat(devBuyAmount) || 0.1,
      signature,
      isMayhemMode: true,
      createdAt: new Date(),
      solscanUrl: `https://solscan.io/tx/${signature}`,
      pumpFunUrl: `https://pump.fun/${mintAddress}`
    };

    if (db) {
      await db.collection('tokens').insertOne(tokenData);
    } else {
      tokensInMemory.push(tokenData);
    }

    res.json({
      success: true,
      token: tokenData
    });

  } catch (error) {
    console.error('❌ Error creando token:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al crear token',
      details: error.response?.data || error.message
    });
  }
});

// Obtener todos los tokens lanzados
app.get('/api/tokens', async (req, res) => {
  try {
    let tokens;
    if (db) {
      tokens = await db.collection('tokens')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      tokens = tokensInMemory.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    res.json({ tokens });
  } catch (error) {
    console.error('Error obteniendo tokens:', error);
    res.status(500).json({ error: 'Error obteniendo tokens' });
  }
});

// Obtener un token específico
app.get('/api/tokens/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    let token;
    if (db) {
      token = await db.collection('tokens').findOne({ mintAddress });
    } else {
      token = tokensInMemory.find(t => t.mintAddress === mintAddress);
    }

    if (!token) {
      return res.status(404).json({ error: 'Token no encontrado' });
    }

    res.json({ token });
  } catch (error) {
    console.error('Error obteniendo token:', error);
    res.status(500).json({ error: 'Error obteniendo token' });
  }
});

// Obtener datos de DexScreener para un token
app.get('/api/dexscreener/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo datos de DexScreener:', error);
    res.status(500).json({ error: 'Error obteniendo datos de DexScreener' });
  }
});

// Obtener holders de un token usando Helius
app.get('/api/holders/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    const response = await axios.post(
      process.env.HELIUS_RPC_URL,
      {
        jsonrpc: '2.0',
        id: 'holder-check',
        method: 'getTokenLargestAccounts',
        params: [mintAddress]
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo holders:', error);
    res.status(500).json({ error: 'Error obteniendo holders' });
  }
});

// Iniciar servidor
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🚀 MAYHEM LAUNCHPAD BACKEND        ║
║   Server running on port ${PORT}       ║
║   Environment: ${process.env.NODE_ENV}          ║
╚═══════════════════════════════════════╝
    `);
  });
};

startServer();
