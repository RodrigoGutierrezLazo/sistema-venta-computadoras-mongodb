const mongoose = require('mongoose');

const ProveedorSchema = new mongoose.Schema({
  nombre_empresa: {
    type: String,
    required: [true, 'El nombre de la empresa proveedora es obligatorio'],
    trim: true
  },
  ruc_cuit: {
    type: String,
    required: [true, 'El RUC/CUIT es obligatorio'],
    unique: true,
    trim: true
  },
  contacto: {
    asesor: { type: String, trim: true },
    email: { 
      type: String, 
      required: true, 
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Ingrese un correo electrónico válido']
    },
    telefono: { type: String, required: true, trim: true }
  },
  direccion: {
    type: String,
    required: true,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Proveedor', ProveedorSchema);
