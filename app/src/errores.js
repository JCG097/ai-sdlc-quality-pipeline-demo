// Errores de negocio y manejo central de errores de la API.

// Error esperado del dominio: se responde al cliente con su mensaje y código HTTP.
class ErrorNegocio extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.status = status;
  }
}

// Middleware de Express: convierte cualquier error en una respuesta JSON clara.
function manejarErrores(err, req, res, next) {
  if (err instanceof ErrorNegocio) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}

module.exports = { ErrorNegocio, manejarErrores };
