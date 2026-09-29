// API del proyecto. Se exporta sin arrancar el servidor para poder probarla.
// Las rutas de cada funcionalidad se agregan aquí; la lógica de negocio vive en módulos de app/src/.
const path = require('node:path');
const express = require('express');
const { manejarErrores } = require('./errores');

function crearApp() {
  const app = express();

  // No revelar la tecnología del servidor (encabezado X-Powered-By).
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (req, res) => {
    res.json({ estado: 'ok' });
  });

  // Manejo central de errores: siempre al final.
  app.use(manejarErrores);

  return app;
}

module.exports = { crearApp };
