# Sistema para Venta de Computadoras y Componentes (MongoDB API)

Repositorio que contiene el diseño de base de datos orientada a documentos en **MongoDB**, esquemas y validaciones con **Mongoose**, scripts de población (seeder), consultas analíticas con **Aggregation Pipelines** y la API REST desarrollada con **Node.js** y **Express**.

---

## 👨‍💻 Información del Estudiante
* **Estudiante:** Rodrigo Gutierrez Lazo
* **Carrera:** Ingeniería de Sistemas e Informática
* **Asignatura:** Base de Datos Avanzadas / Gestión de Base de Datos
* **Fecha:** 28/10/2026
* **Institución:** Universidad Continental

---

## 🛠️ Tecnologías y Versiones
* **Entorno de Ejecución:** Node.js v25.9+
* **Framework Web:** Express v4.19.2
* **Base de Datos NoSQL:** MongoDB v7.0+
* **ODM:** Mongoose v8.4.0
* **Herramientas Adicionales:** Dotenv, CORS, Nodemon

---

## 📂 Estructura del Proyecto

```text
sistema-venta-computadoras-mongodb/
├── database/
│   ├── connection.js             # Módulo de conexión Mongoose
│   └── seeders/
│       ├── seed.js               # Script de población e indexación automática
│       └── data/                 # Archivos JSON para importación (mongoimport / script)
│           ├── proveedores.json
│           ├── clientes.json
│           ├── productos.json
│           └── ventas.json
├── docs/
│   └── modelo_documentos.md      # Diagrama Mermaid, justificaciones técnicas y JSON Schema
├── models/
│   ├── Cliente.js                # Modelo de Clientes con validaciones e índice único
│   ├── Producto.js               # Modelo con especificaciones embebidas e índices compuestos/texto
│   ├── Proveedor.js              # Modelo de Proveedores
│   └── Venta.js                  # Modelo de Ventas con patrón snapshot embebido
├── routes/
│   ├── clientes.routes.js        # Endpoints CRUD para clientes
│   ├── productos.routes.js       # Endpoints de productos, catálogo y filtros
│   ├── proveedores.routes.js     # Endpoints CRUD para proveedores
│   ├── reportes.routes.js        # Consultas con Aggregation Pipeline ($lookup, $group, etc.)
│   └── ventas.routes.js          # Registro de ventas y deducción de inventario
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore                    # Exclusión de credenciales y dependencias
├── entrega_moodle.txt            # Formato oficial para la entrega de la actividad
├── package.json                  # Definición del proyecto y scripts
├── README.md                     # Documentación principal
└── server.js                     # Servidor Express y punto de entrada
```

---

## 📐 Estrategia de Modelado de Datos

El diseño detallado y el diagrama formal se encuentran en [docs/modelo_documentos.md](docs/modelo_documentos.md). A continuación se resumen las decisiones clave:

1. **Especificaciones Técnicas Embebidas (`Producto.especificaciones`):**
   * Se modela como un subdocumento embebido dentro del producto.
   * **Justificación:** Relación 1:1 fuertemente acoplada sin existencia propia fuera del equipo. Elimina la necesidad de operaciones `$lookup` en las consultas de catálogo, maximizando la velocidad de lectura.
2. **Historial y Snapshot de Items Embebidos (`Venta.items`):**
   * Contiene una copia inmutable del nombre, código SKU y precio unitario vigente al momento de emitirse la factura.
   * **Justificación:** Evita que futuras actualizaciones de precios en el catálogo alteren los registros contables históricos (Patrón Snapshot).
3. **Referencias por `ObjectId` en Proveedores y Clientes:**
   * `Producto.proveedor_id` referencia a `proveedores`.
   * `Venta.cliente_id` referencia a `clientes`.
   * **Justificación:** Previene el antipadrón *Unbounded Growth* (evita que un cliente con miles de compras supere el límite estricto de 16 MB por documento BSON) y centraliza los datos de proveedores para evitar inconsistencias por redundancia masiva.

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/RodrigoGutierrezLazo/sistema-venta-computadoras-mongodb.git
cd sistema-venta-computadoras-mongodb
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copiar el archivo de muestra `.env.example` hacia `.env`:
```bash
cp .env.example .env
```

Configurar la cadena de conexión en el archivo `.env`:

* **Opción A: MongoDB Local (por defecto):**
  ```env
  PORT=3000
  MONGODB_URI=mongodb://127.0.0.1:27017/tienda_computadoras
  ```

* **Opción B: MongoDB Atlas (Nube):**
  ```env
  PORT=3000
  MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/tienda_computadoras?retryWrites=true&w=majority
  ```

### 4. Ejecutar el Seeder de datos
El script limpia las colecciones existentes, inserta los datos de prueba coherentes y sincroniza los índices:
```bash
npm run seed
```

*Nota:* Si se prefiere usar la herramienta nativa de MongoDB `mongoimport`, los archivos listos se ubican en `database/seeders/data/`:
```bash
mongoimport --db tienda_computadoras --collection productos --file database/seeders/data/productos.json --jsonArray
```

### 5. Iniciar la aplicación
* **Modo desarrollo (con recarga automática):**
  ```bash
  npm run dev
  ```
* **Modo producción:**
  ```bash
  npm start
  ```

El servidor estará activo en `http://localhost:3000`.

---

## 🚀 Documentación de la API REST

### Productos (`/api/productos`)
* `GET /api/productos`: Lista todos los productos. Admite filtros por query params:
  * `?categoria=Laptops`
  * `?minPrecio=2000&maxPrecio=6000`
  * `?q=Ryzen` (Búsqueda textual mediante índice `$text`)
* `GET /api/productos/:id`: Obtiene el detalle completo de un producto con datos de su proveedor.
* `GET /api/productos/categoria/:tipo`: Filtra directamente por categoría (`Laptops`, `Desktops`, `Monitores`, `Componentes`, `Perifericos`).
* `POST /api/productos`: Registra un nuevo producto con sus especificaciones técnicas embebidas.
* `PUT /api/productos/:id`: Actualiza precios, datos técnicos o inventario.
* `DELETE /api/productos/:id`: Elimina un producto.

### Ventas (`/api/ventas`)
* `GET /api/ventas`: Obtiene el listado de ventas realizadas con datos del cliente asociado.
* `GET /api/ventas/:id`: Obtiene la factura completa con su desglose de items e impuestos.
* `POST /api/ventas`: Registra una nueva transacción de venta.
  * Valida la existencia del cliente y el stock disponible de cada producto.
  * Descuenta de forma automática las cantidades en la colección `productos`.
  * Calcula subtotal, impuesto (IGV 18%) y total.
  * Genera el snapshot de los items comprados.

**Ejemplo de Payload para `POST /api/ventas`:**
```json
{
  "cliente_id": "664d203a9e3b1a2c3d4e5f11",
  "metodo_pago": "Tarjeta de Credito",
  "items": [
    {
      "producto_id": "664d304a9e3b1a2c3d4e5f21",
      "cantidad": 1
    },
    {
      "producto_id": "664d304a9e3b1a2c3d4e5f27",
      "cantidad": 2
    }
  ]
}
```

---

## 📊 Consultas con Aggregation Pipeline

Los endpoints analíticos implementados en `/api/reportes` resuelven problemas de negocio mediante etapas avanzadas de MongoDB:

### 1. Ranking de Productos Más Vendidos (`GET /api/reportes/mas-vendidos`)
Analiza los arrays embebidos de ventas y consolida el volumen y facturación por artículo:
* **`$unwind`:** Descompone el arreglo `items` de cada factura.
* **`$group`:** Agrupa por `items.producto_id` calculando la suma de unidades vendidas y el monto recaudado.
* **`$lookup`:** Realiza un join hacia la colección `productos` para recuperar información en tiempo real (nombre, marca, SKU, categoría).
* **`$unwind`:** Aplana el objeto de producto resultante del lookup.
* **`$project`:** Proyecta la estructura limpia del reporte.
* **`$sort`:** Ordena de forma descendente por `unidadesVendidas`.

### 2. Alerta de Stock Crítico (`GET /api/reportes/stock-critico`)
Detecta productos cuyo inventario está en o por debajo del umbral mínimo de seguridad y asocia el proveedor para reabastecimiento:
* **`$match`:** Utiliza la expresión `$expr: { $lte: ['$stock', '$stock_minimo'] }` comparando campos del mismo documento.
* **`$lookup`:** Cruza con la colección `proveedors` mediante `proveedor_id`.
* **`$unwind`:** Aplana los datos del proveedor.
* **`$project`:** Proyecta el SKU, nombre del equipo, unidades en almacén, unidades faltantes y datos de contacto directo del proveedor.
* **`$sort`:** Ordena dando prioridad a los productos con menor stock.

### 3. Reporte de Ventas por Mes (`GET /api/reportes/ventas-por-mes`)
Agrupa la facturación total, impuestos y cantidad de transacciones por año y mes usando los operadores de fecha `$year` y `$month`.

### 4. Mejores Clientes (`GET /api/reportes/mejores-clientes`)
Determina qué clientes generan mayor volumen de facturación a través de `$group` y `$lookup` con la colección `clientes`.

---

## 🛡️ Seguridad y Buenas Prácticas
* **Variables de entorno protegidas:** El archivo `.env` se encuentra ignorado en `.gitignore` para no exponer cadenas de conexión en el repositorio público.
* **Manejo de Errores Centralizado:** Middleware en Express para control de errores de validación de Mongoose y códigos de estado HTTP adecuados (`200`, `201`, `400`, `404`, `500`).
* **Sincronización de Índices:** El script seeder invoca `syncIndexes()` para garantizar la creación de índices únicos y compuestos en el clúster.
