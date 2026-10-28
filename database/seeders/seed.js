require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Proveedor = require('../../models/Proveedor');
const Cliente = require('../../models/Cliente');
const Producto = require('../../models/Producto');
const Venta = require('../../models/Venta');

const loadJSON = (fileName) => {
  const filePath = path.join(__dirname, 'data', fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const parseMongoJSON = (docs) => {
  return docs.map(doc => {
    const parsed = { ...doc };
    if (parsed._id && parsed._id.$oid) {
      parsed._id = new mongoose.Types.ObjectId(parsed._id.$oid);
    }
    if (parsed.proveedor_id && parsed.proveedor_id.$oid) {
      parsed.proveedor_id = new mongoose.Types.ObjectId(parsed.proveedor_id.$oid);
    }
    if (parsed.cliente_id && parsed.cliente_id.$oid) {
      parsed.cliente_id = new mongoose.Types.ObjectId(parsed.cliente_id.$oid);
    }
    if (parsed.fecha && parsed.fecha.$date) {
      parsed.fecha = new Date(parsed.fecha.$date);
    }
    if (Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map(item => {
        const itemCopy = { ...item };
        if (itemCopy.producto_id && itemCopy.producto_id.$oid) {
          itemCopy.producto_id = new mongoose.Types.ObjectId(itemCopy.producto_id.$oid);
        }
        return itemCopy;
      });
    }
    return parsed;
  });
};

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tienda_computadoras';
    console.log('Conectando a MongoDB para ejecución de seeder...');
    await mongoose.connect(mongoUri);

    console.log('Limpiando colecciones existentes...');
    await Promise.all([
      Proveedor.deleteMany({}),
      Cliente.deleteMany({}),
      Producto.deleteMany({}),
      Venta.deleteMany({})
    ]);

    console.log('Cargando datos desde archivos JSON...');
    const rawProveedores = loadJSON('proveedores.json');
    const rawClientes = loadJSON('clientes.json');
    const rawProductos = loadJSON('productos.json');
    const rawVentas = loadJSON('ventas.json');

    const proveedores = parseMongoJSON(rawProveedores);
    const clientes = parseMongoJSON(rawClientes);
    const productos = parseMongoJSON(rawProductos);
    const ventas = parseMongoJSON(rawVentas);

    console.log('Insertando proveedores...');
    await Proveedor.insertMany(proveedores);

    console.log('Insertando clientes...');
    await Cliente.insertMany(clientes);

    console.log('Insertando productos con especificaciones embebidas...');
    await Producto.insertMany(productos);

    console.log('Insertando ventas con snapshot de items embebidos...');
    await Venta.insertMany(ventas);

    console.log('Construyendo y sincronizando índices...');
    await Promise.all([
      Proveedor.syncIndexes(),
      Cliente.syncIndexes(),
      Producto.syncIndexes(),
      Venta.syncIndexes()
    ]);

    console.log('--------------------------------------------------');
    console.log('Población de base de datos completada con éxito:');
    console.log(`- Proveedores insertados: ${proveedores.length}`);
    console.log(`- Clientes insertados:    ${clientes.length}`);
    console.log(`- Productos insertados:   ${productos.length}`);
    console.log(`- Ventas insertadas:      ${ventas.length}`);
    console.log('--------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error durante la ejecución del seeder:', error);
    process.exit(1);
  }
};

seedDatabase();
