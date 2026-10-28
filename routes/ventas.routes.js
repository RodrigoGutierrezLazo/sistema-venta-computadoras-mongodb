const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');

// GET /api/ventas - Listar ventas con información del cliente
router.get('/', async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate('cliente_id', 'nombre_completo email numero_documento telefono')
      .sort({ fecha: -1 });

    res.json({
      success: true,
      total: ventas.length,
      data: ventas
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ventas/:id - Detalle de venta específica
router.get('/:id', async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('cliente_id', 'nombre_completo email tipo_documento numero_documento direccion telefono');

    if (!venta) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada' });
    }

    res.json({ success: true, data: venta });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ventas - Registrar venta, validar y descontar stock
router.post('/', async (req, res) => {
  try {
    const { cliente_id, items, metodo_pago } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La venta debe contener al menos un item'
      });
    }

    // Verificar cliente
    const clienteExiste = await Cliente.findById(cliente_id);
    if (!clienteExiste) {
      return res.status(404).json({
        success: false,
        message: 'El cliente especificado no existe'
      });
    }

    let subtotalAcumulado = 0;
    const itemsSnapshot = [];
    const productosAActualizar = [];

    // Validar disponibilidad de stock de todos los productos
    for (const item of items) {
      const producto = await Producto.findById(item.producto_id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${item.producto_id} no fue encontrado`
        });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para '${producto.nombre}'. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`
        });
      }

      const itemSubtotal = Number((producto.precio * item.cantidad).toFixed(2));
      subtotalAcumulado += itemSubtotal;

      itemsSnapshot.push({
        producto_id: producto._id,
        codigo_sku: producto.codigo_sku,
        nombre_producto: producto.nombre,
        precio_unitario: producto.precio,
        cantidad: item.cantidad,
        subtotal: itemSubtotal
      });

      productosAActualizar.push({
        producto,
        nuevaCantidad: producto.stock - item.cantidad
      });
    }

    // Descontar inventario
    for (const itemUpdate of productosAActualizar) {
      itemUpdate.producto.stock = itemUpdate.nuevaCantidad;
      await itemUpdate.producto.save();
    }

    // Cálculos fiscales (Subtotal, IGV 18% y Total)
    const subtotal = Number((subtotalAcumulado / 1.18).toFixed(2));
    const impuesto = Number((subtotalAcumulado - subtotal).toFixed(2));
    const total = Number(subtotalAcumulado.toFixed(2));

    const correlativo = Date.now().toString().slice(-6);
    const numero_factura = `F001-0000${correlativo}`;

    const nuevaVenta = new Venta({
      numero_factura,
      cliente_id,
      items: itemsSnapshot,
      metodo_pago,
      subtotal,
      impuesto,
      total
    });

    const ventaGuardada = await nuevaVenta.save();

    res.status(201).json({
      success: true,
      message: 'Venta registrada con éxito',
      data: ventaGuardada
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
