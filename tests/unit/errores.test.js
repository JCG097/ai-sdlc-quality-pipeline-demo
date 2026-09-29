const { ErrorNegocio, manejarErrores } = require('../../app/src/errores');

// Respuesta simulada de Express para probar el middleware de forma aislada.
const respuesta = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('manejarErrores', () => {
  test('responde el mensaje y el código de un error de negocio', () => {
    const res = respuesta();
    manejarErrores(new ErrorNegocio('No encontrado.', 404), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No encontrado.' });
  });

  test('usa 400 por defecto en errores de negocio', () => {
    expect(new ErrorNegocio('Dato inválido.').status).toBe(400);
  });

  test('responde 500 ante un error inesperado', () => {
    const res = respuesta();
    const espia = jest.spyOn(console, 'error').mockImplementation(() => {});
    manejarErrores(new Error('falla'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor.' });
    espia.mockRestore();
  });
});
