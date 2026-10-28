const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');

// 1. Reporte: Productos Más Vendidos
// Pipeline: $unwind -> $group -> $lookup -> $unwind -> $project -> $sort
router.get('/mas-vendidos', async (req, res) => {
  try {
    const reporte = await Venta.aggregate([
      // Etapa 1: Desarmar el array embebido de items
      { $unwind: '$items' },

      // Etapa 2: Agrupar por producto_id y calcular totales
      {
        $group: {
          _id: '$items.producto_id',
          unidadesVendidas: { $sum: '$items.cantidad' },
          ingresosTotales: { $sum: '$items.subtotal' },
          totalOperaciones: { $sum: 1 }
        }
      },

      // Etapa 3: Cruzar con la colección de productos
      {
        $lookup: {
          from: 'productos',
          localField: '_id',
          foreignField: '_id',
          as: 'detalleProducto'
        }
      },

      // Etapa 4: Desanidar el resultado del lookup
      { $unwind: '$detalleProducto' },

      // Etapa 5: Proyectar y dar formato a los campos de salida
      {
        $project: {
          _id: 1,
          sku: '$detalleProducto.codigo_sku',
          nombre: '$detalleProducto.nombre',
          marca: '$detalleProducto.marca',
          categoria: '$detalleProducto.categoria',
          precioActual: '$detalleProducto.precio',
          stockRestante: '$detalleProducto.stock',
          unidadesVendidas: 1,
          ingresosTotales: { $round: ['$ingresosTotales', 2] },
          totalOperaciones: 1
        }
      },

      // Etapa 6: Ordenar descendente por unidades vendidas
      { $sort: { unidadesVendidas: -1 } }
    ]);

    res.json({
      success: true,
      tipoReporte: 'Ranking de Productos Más Vendidos',
      totalItems: reporte.length,
      data: reporte
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Reporte: Stock Crítico (Productos con stock menor o igual al mínimo)
// Pipeline: $match ($expr) -> $lookup -> $unwind -> $project -> $sort
router.get('/stock-critico', async (req, res) => {
  try {
    const reporte = await Producto.aggregate([
      // Etapa 1: Filtrar productos con stock menor o igual a stock_minimo
      {
        $match: {
          $expr: { $lte: ['$stock', '$stock_minimo'] }
        }
      },

      // Etapa 2: Cruzar con la colección de proveedores
      {
        $lookup: {
          from: 'proveedors',
          localField: 'proveedor_id',
          foreignField: '_id',
          as: 'proveedor'
        }
      },

      // Etapa 3: Desanidar proveedor
      { $unwind: '$proveedor' },

      // Etapa 4: Proyectar información clave para reposición de compras
      {
        $project: {
          _id: 1,
          sku: '$codigo_sku',
          producto: '$nombre',
          categoria: '$categoria',
          stockActual: '$stock',
          stockMinimo: '$stock_minimo',
          unidadesFaltantes: { $subtract: ['$stock_minimo', '$stock'] },
          proveedor: {
            nombre: '$proveedor.nombre_empresa',
            ruc: '$proveedor.ruc_cuit',
            asesor: '$proveedor.contacto.asesor',
            email: '$proveedor.contacto.email',
            telefono: '$proveedor.contacto.telefono'
          }
        }
      },

      // Etapa 5: Ordenar por menor stock primero
      { $sort: { stockActual: 1 } }
    ]);

    res.json({
      success: true,
      tipoReporte: 'Alerta de Inventario y Stock Crítico',
      cantidadCriticos: reporte.length,
      data: reporte
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Reporte: Facturación y Ventas agrupadas por Mes
// Pipeline: $group -> $project -> $sort
router.get('/ventas-por-mes', async (req, res) => {
  try {
    const reporte = await Venta.aggregate([
      // Etapa 1: Agrupar por año y mes de la fecha de la venta
      {
        $group: {
          _id: {
            anio: { $year: '$fecha' },
            mes: { $month: '$fecha' }
          },
          totalFacturado: { $sum: '$total' },
          totalSubtotal: { $sum: '$subtotal' },
          totalImpuestos: { $sum: '$impuesto' },
          cantidadTransacciones: { $sum: 1 }
        }
      },

      // Etapa 2: Proyectar y calcular métricas adicionales
      {
        $project: {
          _id: 0,
          anio: '$_id.anio',
          mes: '$_id.mes',
          totalFacturado: { $round: ['$totalFacturado', 2] },
          totalSubtotal: { $round: ['$totalSubtotal', 2] },
          totalImpuestos: { $round: ['$totalImpuestos', 2] },
          cantidadTransacciones: 1,
          ticketPromedio: {
            $round: [{ $divide: ['$totalFacturado', '$cantidadTransacciones'] }, 2]
          }
        }
      },

      // Etapa 3: Ordenar cronológicamente descendente
      { $sort: { anio: -1, mes: -1 } }
    ]);

    res.json({
      success: true,
      tipoReporte: 'Resumen Mensual de Facturación',
      data: reporte
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Reporte: Clientes con Mayor Volumen de Compra
// Pipeline: $group -> $lookup -> $unwind -> $project -> $sort
router.get('/mejores-clientes', async (req, res) => {
  try {
    const reporte = await Venta.aggregate([
      // Etapa 1: Agrupar por cliente
      {
        $group: {
          _id: '$cliente_id',
          totalGastado: { $sum: '$total' },
          cantidadPedidos: { $sum: 1 }
        }
      },

      // Etapa 2: Cruzar con la colección clientes
      {
        $lookup: {
          from: 'clientes',
          localField: '_id',
          foreignField: '_id',
          as: 'cliente'
        }
      },

      // Etapa 3: Desanidar cliente
      { $unwind: '$cliente' },

      // Etapa 4: Proyectar resultados
      {
        $project: {
          _id: 1,
          nombreCliente: '$cliente.nombre_completo',
          documento: '$cliente.numero_documento',
          email: '$cliente.email',
          ciudad: '$cliente.direccion.ciudad',
          totalGastado: { $round: ['$totalGastado', 2] },
          cantidadPedidos: 1,
          promedioPorPedido: {
            $round: [{ $divide: ['$totalGastado', '$cantidadPedidos'] }, 2]
          }
        }
      },

      // Etapa 5: Ordenar por mayor consumo
      { $sort: { totalGastado: -1 } }
    ]);

    res.json({
      success: true,
      tipoReporte: 'Clientes con Mayor Facturación',
      data: reporte
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
