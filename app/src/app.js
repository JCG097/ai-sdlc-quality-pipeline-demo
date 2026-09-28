// Define la API REST. Se exporta sin arrancar el servidor para poder probarla (Newman, pruebas de integración).
const path = require('node:path');
const express = require('express');
const {
  ErrorNegocio,
  crearParqueadero,
  registrarIngreso,
  registrarSalida,
  listarEspacios,
  resumen,
} = require('./parking');

function crearApp(opciones) {
  const app = express();
  const parqueadero = crearParqueadero(opciones);

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (req, res) => {
    res.json({ estado: 'ok' });
  });

  app.get('/api/espacios', (req, res) => {
    res.json(listarEspacios(parqueadero, req.query));
  });

  app.get('/api/resumen', (req, res) => {
    res.json(resumen(parqueadero));
  });

  app.post('/api/ingresos', (req, res) => {
    res.status(201).json(registrarIngreso(parqueadero, req.body));
  });

  app.post('/api/salidas', (req, res) => {
    res.json(registrarSalida(parqueadero, req.body));
  });

  // Manejo central de errores: responde siempre JSON con un mensaje claro.
  app.use((err, req, res, next) => {
    if (err instanceof ErrorNegocio) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}

module.exports = { crearApp };
