const mongoose = require('mongoose');

const ItemVentaSchema = new mongoose.Schema({
  producto_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  codigo_sku: {
    type: String,
    required: true,
    uppercase: true
  },
  nombre_producto: {
    type: String,
    required: true
  },
  precio_unitario: {
    type: Number,
    required: true,
    min: 0
  },
  cantidad: {
    type: Number,
    required: true,
    min: [1, 'La cantidad mínima por item es 1']
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const VentaSchema = new mongoose.Schema({
  numero_factura: {
    type: String,
    required: [true, 'El número de factura es obligatorio'],
    unique: true,
    trim: true,
    index: true
  },
  cliente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El cliente es obligatorio'],
    index: true
  },
  fecha: {
    type: Date,
    default: Date.now,
    index: true
  },
  items: {
    type: [ItemVentaSchema],
    validate: [
      (val) => Array.isArray(val) && val.length > 0,
      'La venta debe incluir al menos un producto'
    ]
  },
  metodo_pago: {
    type: String,
    required: [true, 'El método de pago es obligatorio'],
    enum: ['Efectivo', 'Tarjeta de Credito', 'Tarjeta de Debito', 'Transferencia Bancaria', 'Yape/Plin']
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  impuesto: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: [true, 'El total de la venta es obligatorio'],
    min: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Venta', VentaSchema);
