#!/bin/bash

# Mayhem Launchpad - Quick Setup Script
# Este script instala todas las dependencias necesarias

echo "🔥 MAYHEM LAUNCHPAD - INSTALACIÓN"
echo "=================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js v18 o superior."
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"
echo ""

# Backend
echo "📦 Instalando dependencias del BACKEND..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend instalado correctamente"
else
    echo "❌ Error instalando backend"
    exit 1
fi

echo ""

# Frontend
echo "📦 Instalando dependencias del FRONTEND..."
cd ../frontend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend instalado correctamente"
else
    echo "❌ Error instalando frontend"
    exit 1
fi

cd ..

echo ""
echo "=================================="
echo "✅ ¡INSTALACIÓN COMPLETADA!"
echo "=================================="
echo ""
echo "Para iniciar el proyecto:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "El launchpad estará disponible en:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
echo "🔥 ¡Listo para lanzar tokens con Mayhem Mode!"
