# 🔥 MAYHEM LAUNCHPAD

Un launchpad completo para crear tokens en Solana con **Mayhem Mode** de Pump.fun - trading automático con IA durante las primeras 24 horas.

## 🚀 Características

- ✅ **Lanzamiento Simple**: Formulario intuitivo para crear tokens
- 🤖 **Mayhem Mode**: AI trading automático en las primeras 24h
- 📊 **Dashboard Completo**: Visualiza todos los tokens lanzados
- 📈 **Gráficos en Tiempo Real**: Charts con datos de DexScreener
- 👥 **Análisis de Holders**: Ve quién tiene tus tokens
- 🔐 **Self-Custodial**: Los usuarios usan sus propias wallets

## 🏗️ Arquitectura

```
mayhem-launchpad/
├── backend/          # API en Node.js + Express
│   ├── server.js     # Servidor principal
│   ├── .env          # Variables de entorno
│   └── package.json
│
└── frontend/         # React + Vite + Tailwind
    ├── src/
    │   ├── components/  # Navbar, etc.
    │   ├── pages/       # Home, CreateToken, Dashboard, TokenDetail
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## 📋 Requisitos Previos

- Node.js v18 o superior
- npm o yarn
- API Keys:
  - ✅ PumpPortal API Key (ya tienes)
  - ✅ Helius RPC URL (ya tienes)
  - ✅ DexScreener API (pública)

## 🛠️ Instalación

### Backend

```bash
cd backend
npm install
npm start
```

El servidor correrá en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend correrá en `http://localhost:3000`

## 🔑 Configuración de Variables de Entorno

El archivo `.env` ya está configurado con tus API keys:

```env
PUMPPORTAL_API_KEY=tu_api_key
HELIUS_RPC_URL=tu_helius_url
DEXSCREENER_API=https://api.dexscreener.com/token-profiles/latest/v1
PORT=3001
```

## 📝 Cómo Usar

### 1. Conectar Wallet
- Abre el frontend en tu navegador
- Click en "Connect Wallet" (Phantom, Solflare, Backpack)

### 2. Crear Token
- Ve a "Launch Token"
- Llena el formulario:
  - Nombre del token
  - Símbolo
  - Descripción
  - Logo (imagen)
  - Links sociales (opcional)
  - Dev buy amount (SOL)
  - Slippage
  - Priority fee
- Click en "Launch Token with Mayhem Mode"
- Firma la transacción en tu wallet

### 3. Ver Dashboard
- Ve a "Dashboard"
- Ve todos los tokens lanzados
- Filtra por nombre/símbolo/dirección
- Ve stats en tiempo real

### 4. Ver Detalles de Token
- Click en "View Chart" en cualquier token
- Ve gráfico de precio
- Ve top holders
- Links a Pump.fun y Solscan

## 🎯 Características de Mayhem Mode

- **Total Supply**: 2,000,000,000 tokens (2B)
- **AI Trading**: 24 horas de trading automático
- **Trading Pattern**: Compra/venta aleatoria con igual probabilidad
- **No Fees**: El AI no paga fees de protocolo
- **Token Burn**: Tokens no vendidos se queman después de 24h

## 🔄 API Endpoints

### Backend API

```
GET  /api/health                    - Health check
POST /api/create-token              - Crear nuevo token
GET  /api/tokens                    - Listar todos los tokens
GET  /api/tokens/:mintAddress       - Obtener token específico
GET  /api/dexscreener/:mintAddress  - Datos de DexScreener
GET  /api/holders/:mintAddress      - Top holders
```

## 🎨 Personalización

### Cambiar Colores del Tema

Edita `frontend/tailwind.config.js`:

```js
colors: {
  'mayhem': {
    500: '#ef4444',  // Color principal
    600: '#dc2626',
    700: '#b91c1c',
  }
}
```

### Cambiar Logo

Reemplaza el componente Flame en `Navbar.jsx` con tu logo

## 🐛 Troubleshooting

### Error: Cannot connect to database
- El launchpad funciona sin MongoDB (usa memoria)
- Si quieres usar MongoDB, instálalo y configura `MONGODB_URI`

### Error: API Key invalid
- Verifica que las API keys en `.env` sean correctas
- Asegúrate de que el archivo `.env` esté en la carpeta `backend/`

### Error: Cannot fetch token data
- Verifica que DexScreener tenga datos del token
- Algunos tokens nuevos pueden tardar en aparecer

## 📊 Monitoreo

- **Logs del backend**: Se muestran en la terminal donde corre el servidor
- **Logs del frontend**: Abre DevTools del navegador (F12)

## 🚀 Deployment

### Backend (Railway/Heroku/Render)

1. Sube el código a GitHub
2. Conecta con Railway/Heroku/Render
3. Configura las variables de entorno
4. Deploy!

### Frontend (Vercel/Netlify)

1. Sube el código a GitHub
2. Conecta con Vercel/Netlify
3. Configura:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_API_URL=https://tu-backend-url.com`
4. Deploy!

## 📚 Tecnologías Usadas

**Backend:**
- Node.js + Express
- Solana Web3.js
- Axios
- Multer (file uploads)
- MongoDB (opcional)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Solana Wallet Adapter
- Lightweight Charts
- React Router
- Axios

## ⚠️ Disclaimers

- Mayhem Mode es una feature **experimental** de Pump.fun
- No hay garantía de que el AI tradee todos los tokens
- Mayor volatilidad = mayor riesgo
- Lee los disclaimers de Pump.fun antes de usar

## 🤝 Soporte

Si tienes problemas:
1. Revisa los logs en la consola
2. Verifica que las API keys sean válidas
3. Asegúrate de tener SOL en tu wallet para las fees
4. Consulta la documentación de Pump.fun

## 📄 Licencia

MIT License - Úsalo libremente!

---

**¡Hecho con 🔥 para la comunidad de Solana!**
