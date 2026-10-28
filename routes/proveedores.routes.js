const express = require('express');
const router = express.Router();
const Proveedor = require('../models/Proveedor');

// GET /api/proveedores - Listar proveedores
router.get('/', async (req, res) => {
  try {
    const proveedores = await Proveedor.find().sort({ nombre_empresa: 1 });
    res.json({ success: true, total: proveedores.length, data: proveedores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/proveedores/:id - Obtener proveedor por ID
router.get('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    res.json({ success: true, data: proveedor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/proveedores - Crear proveedor
router.post('/', async (req, res) => {
  try {
    const nuevoProveedor = new Proveedor(req.body);
    const guardado = await nuevoProveedor.save();
    res.status(201).json({ success: true, data: guardado });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/proveedores/:id - Actualizar proveedor
router.put('/:id', async (req, res) => {
  try {
    const actualizado = await Proveedor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!actualizado) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    res.json({ success: true, data: actualizado });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/proveedores/:id - Eliminar proveedor
router.delete('/:id', async (req, res) => {
  try {
    const eliminado = await Proveedor.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    res.json({ success: true, message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
