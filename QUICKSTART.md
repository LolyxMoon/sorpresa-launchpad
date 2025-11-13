# 🚀 INICIO RÁPIDO - MAYHEM LAUNCHPAD

## ⚡ Setup en 3 Minutos

### 1️⃣ Instalar Dependencias

```bash
# Opción A: Script automático
chmod +x install.sh
./install.sh

# Opción B: Manual
cd backend && npm install
cd ../frontend && npm install
```

### 2️⃣ Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3️⃣ Abrir en el Navegador

```
http://localhost:3000
```

## 🎯 Uso Básico

### Crear un Token

1. **Conecta tu Wallet** (Phantom/Solflare/Backpack)
2. **Ve a "Launch Token"**
3. **Llena el formulario:**
   - Nombre: "My Token"
   - Símbolo: "MTK"
   - Descripción: "Describe tu token"
   - Logo: Sube una imagen
   - Dev Buy: 0.1 SOL (recomendado)
4. **Click en "Launch Token with Mayhem Mode"**
5. **Firma la transacción en tu wallet**
6. **¡Listo! Tu token está en Mayhem Mode** 🔥

### Ver tus Tokens

1. Ve a **"Dashboard"**
2. Verás todos los tokens lanzados
3. Click en **"View Chart"** para ver detalles

## 🔑 Variables de Entorno

Tu archivo `backend/.env` ya está configurado con:

```env
✅ PUMPPORTAL_API_KEY=tu_api_key
✅ HELIUS_RPC_URL=tu_helius_url  
✅ DEXSCREENER_API=endpoint_publico
```

## 💰 Costos Estimados

Por cada token que crees:
- **Dev Buy**: 0.1 - 1.0 SOL (tú eliges)
- **Priority Fee**: ~0.0005 SOL
- **Transaction Fee**: ~0.000005 SOL
- **Total**: ~0.1005 SOL + tu dev buy

## 🎨 Personalización Rápida

### Cambiar el Nombre del Launchpad

**Frontend: `src/components/Navbar.jsx`**
```jsx
<span className="text-xl font-bold">
  TU NOMBRE AQUI LAUNCHPAD
</span>
```

### Cambiar Colores

**Frontend: `tailwind.config.js`**
```js
colors: {
  'mayhem': {
    500: '#tu-color-aqui',
  }
}
```

## 🐛 Problemas Comunes

### Backend no inicia
```bash
# Verifica que el puerto 3001 esté libre
lsof -i :3001
# Mata el proceso si es necesario
kill -9 PID
```

### Frontend no conecta con Backend
```bash
# Verifica que el backend esté corriendo en http://localhost:3001
curl http://localhost:3001/api/health
```

### Wallet no conecta
- Actualiza tu wallet extension
- Refresca la página
- Prueba con otra wallet

## 📱 Próximos Pasos

✅ **Ya funcional:**
- Crear tokens con Mayhem Mode
- Dashboard con todos los tokens
- Gráficos en tiempo real
- Ver holders

🔄 **Mejoras opcionales:**
- Agregar MongoDB para persistencia
- Agregar autenticación
- Agregar analytics
- Agregar notificaciones

## 🆘 Necesitas Ayuda?

1. Lee el README.md completo
2. Revisa los logs en la terminal
3. Verifica las API keys en `.env`
4. Asegúrate de tener SOL en tu wallet

## 🎉 ¡Eso es Todo!

Tu launchpad está listo para crear tokens con Mayhem Mode.

**¡Buena suerte con tus lanzamientos!** 🔥🚀
