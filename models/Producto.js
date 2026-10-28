const mongoose = require('mongoose');

const EspecificacionesSchema = new mongoose.Schema({
  procesador: { type: String, required: true, trim: true },
  ram_gb: { type: Number, required: true, min: 0 },
  almacenamiento: { type: String, required: true, trim: true },
  tarjeta_grafica: { type: String, default: 'Integrada', trim: true },
  pantalla_pulgadas: { type: Number, default: null },
  sistema_operativo: { type: String, default: 'Sin SO', trim: true }
}, { _id: false });

const ProductoSchema = new mongoose.Schema({
  codigo_sku: {
    type: String,
    required: [true, 'El código SKU es obligatorio'],
    unique: true,
    uppercase: true,
    trim: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  marca: {
    type: String,
    required: [true, 'La marca es obligatoria'],
    trim: true
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: ['Laptops', 'Desktops', 'Monitores', 'Componentes', 'Perifericos']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  stock_minimo: {
    type: Number,
    default: 5,
    min: [0, 'El stock mínimo no puede ser negativo']
  },
  especificaciones: {
    type: EspecificacionesSchema,
    required: [true, 'Las especificaciones técnicas son obligatorias']
  },
  proveedor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: [true, 'El proveedor es obligatorio']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índice compuesto para optimizar búsquedas por categoría y rango de precios
ProductoSchema.index({ categoria: 1, precio: 1 });

// Índice de texto para búsquedas en catálogo por nombre, marca o procesador
ProductoSchema.index({
  nombre: 'text',
  marca: 'text',
  'especificaciones.procesador': 'text'
});

module.exports = mongoose.model('Producto', ProductoSchema);
