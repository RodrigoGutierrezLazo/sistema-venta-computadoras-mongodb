const mongoose = require('mongoose');

const DireccionSchema = new mongoose.Schema({
  calle: { type: String, required: true, trim: true },
  ciudad: { type: String, required: true, trim: true },
  departamento: { type: String, required: true, trim: true },
  codigo_postal: { type: String, trim: true }
}, { _id: false });

const ClienteSchema = new mongoose.Schema({
  nombre_completo: {
    type: String,
    required: [true, 'El nombre del cliente es obligatorio'],
    trim: true
  },
  tipo_documento: {
    type: String,
    enum: ['DNI', 'RUC', 'CE', 'Pasaporte'],
    default: 'DNI'
  },
  numero_documento: {
    type: String,
    required: [true, 'El número de documento es obligatorio'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'El correo electrónico no es válido'],
    index: true
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  direccion: {
    type: DireccionSchema,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Cliente', ClienteSchema);
