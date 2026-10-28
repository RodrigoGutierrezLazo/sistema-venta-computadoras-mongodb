const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

// GET /api/productos - Listar productos con filtros y paginación básica
router.get('/', async (req, res) => {
  try {
    const { categoria, minPrecio, maxPrecio, q } = req.query;
    const filtro = {};

    if (categoria) {
      filtro.categoria = new RegExp(`^${categoria}$`, 'i');
    }

    if (minPrecio || maxPrecio) {
      filtro.precio = {};
      if (minPrecio) filtro.precio.$gte = Number(minPrecio);
      if (maxPrecio) filtro.precio.$lte = Number(maxPrecio);
    }

    if (q) {
      filtro.$text = { $search: q };
    }

    const productos = await Producto.find(filtro)
      .populate('proveedor_id', 'nombre_empresa contacto ruc_cuit')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: productos.length,
      data: productos
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/productos/categoria/:tipo - Filtrar por categoría
router.get('/categoria/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const productos = await Producto.find({
      categoria: new RegExp(`^${tipo}$`, 'i')
    }).populate('proveedor_id', 'nombre_empresa contacto');

    res.json({
      success: true,
      categoria: tipo,
      total: productos.length,
      data: productos
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/productos/:id - Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('proveedor_id', 'nombre_empresa contacto ruc_cuit direccion');

    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({ success: true, data: producto });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/productos - Crear un nuevo producto
router.post('/', async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    const guardado = await nuevoProducto.save();
    res.status(201).json({ success: true, data: guardado });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/productos/:id - Actualizar datos o stock de un producto
router.put('/:id', async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!actualizado) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({ success: true, data: actualizado });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/productos/:id - Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    const eliminado = await Producto.findByIdAndDelete(req.params.id);

    if (!eliminado) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
