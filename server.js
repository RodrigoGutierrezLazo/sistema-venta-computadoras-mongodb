require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./database/connection');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
connectDB();

// Ruta de comprobación de estado de la API
app.get('/', (req, res) => {
  res.json({
    proyecto: 'Sistema de Gestión y Venta de Computadoras (MongoDB API)',
    autor: 'Rodrigo Gutierrez Lazo',
    estado: 'Servidor en línea',
    version: '1.0.0',
    rutas_disponibles: {
      productos: '/api/productos',
      clientes: '/api/clientes',
      proveedores: '/api/proveedores',
      ventas: '/api/ventas',
      reportes: {
        top_vendidos: '/api/reportes/mas-vendidos',
        stock_critico: '/api/reportes/stock-critico',
        ventas_mes: '/api/reportes/ventas-por-mes',
        mejores_clientes: '/api/reportes/mejores-clientes'
      }
    }
  });
});

// Registro de Rutas
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/proveedores', require('./routes/proveedores.routes'));
app.use('/api/ventas', require('./routes/ventas.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejador centralizado de errores (500)
app.use((err, req, res, next) => {
  console.error('Error interno del servidor:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  console.log(`Documentación y estado en: http://localhost:${PORT}/`);
});
