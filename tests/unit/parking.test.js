const {
  crearParqueadero,
  normalizarPlaca,
  registrarIngreso,
  registrarSalida,
  listarEspacios,
  resumen,
} = require('../../app/src/parking');

// Fecha fija para que las pruebas de cobro sean repetibles.
const INGRESO = new Date('2026-10-01T08:00:00Z');
const minutosDespues = (min) => new Date(INGRESO.getTime() + min * 60000);

describe('normalizarPlaca', () => {
  test('convierte a mayúsculas y quita espacios y guiones', () => {
    expect(normalizarPlaca(' abc-123 ')).toBe('ABC123');
  });

  test('devuelve texto vacío si no hay placa', () => {
    expect(normalizarPlaca(undefined)).toBe('');
  });
});

describe('registrarIngreso', () => {
  test('asigna el primer espacio libre de carro', () => {
    const parq = crearParqueadero();
    const espacio = registrarIngreso(parq, { placa: 'ABC123', tipo: 'carro' }, INGRESO);
    expect(espacio).toMatchObject({ codigo: 'C-01', estado: 'ocupado', placa: 'ABC123' });
  });

  test('asigna espacio de moto con placa de moto', () => {
    const parq = crearParqueadero();
    const espacio = registrarIngreso(parq, { placa: 'XYZ12A', tipo: 'moto' }, INGRESO);
    expect(espacio.codigo).toBe('M-01');
  });

  test('rechaza un tipo de vehículo inválido', () => {
    const parq = crearParqueadero();
    expect(() => registrarIngreso(parq, { placa: 'ABC123', tipo: 'bus' })).toThrow('Tipo de vehículo inválido');
  });

  test.each([
    ['AB1', 'carro'],
    ['ABC12D', 'carro'],
    ['ABC123', 'moto'],
  ])('rechaza la placa %s para %s', (placa, tipo) => {
    const parq = crearParqueadero();
    expect(() => registrarIngreso(parq, { placa, tipo })).toThrow('Placa inválida');
  });

  test('rechaza un vehículo que ya está dentro', () => {
    const parq = crearParqueadero();
    registrarIngreso(parq, { placa: 'ABC123', tipo: 'carro' });
    expect(() => registrarIngreso(parq, { placa: 'abc 123', tipo: 'carro' })).toThrow('ya está dentro');
  });

  test('rechaza el ingreso cuando no hay cupos', () => {
    const parq = crearParqueadero({ carros: 1, motos: 0 });
    registrarIngreso(parq, { placa: 'AAA111', tipo: 'carro' });
    expect(() => registrarIngreso(parq, { placa: 'BBB222', tipo: 'carro' })).toThrow('No hay espacios libres');
  });
});

describe('registrarSalida', () => {
  test('cobra una hora mínima aunque la estadía sea corta', () => {
    const parq = crearParqueadero();
    registrarIngreso(parq, { placa: 'ABC123', tipo: 'carro' }, INGRESO);
    const recibo = registrarSalida(parq, { placa: 'ABC123' }, minutosDespues(10));
    expect(recibo).toMatchObject({ minutos: 10, horasCobradas: 1, valor: 3000 });
  });

  test('cobra por hora o fracción', () => {
    const parq = crearParqueadero();
    registrarIngreso(parq, { placa: 'ABC123', tipo: 'carro' }, INGRESO);
    const recibo = registrarSalida(parq, { placa: 'ABC123' }, minutosDespues(61));
    expect(recibo).toMatchObject({ horasCobradas: 2, valor: 6000 });
  });

  test('aplica la tarifa de moto', () => {
    const parq = crearParqueadero();
    registrarIngreso(parq, { placa: 'XYZ12A', tipo: 'moto' }, INGRESO);
    const recibo = registrarSalida(parq, { placa: 'XYZ12A' }, minutosDespues(120));
    expect(recibo.valor).toBe(3000);
  });

  test('libera el espacio al salir', () => {
    const parq = crearParqueadero();
    registrarIngreso(parq, { placa: 'ABC123', tipo: 'carro' }, INGRESO);
    registrarSalida(parq, { placa: 'ABC123' }, minutosDespues(30));
    expect(listarEspacios(parq, { estado: 'ocupado' })).toHaveLength(0);
  });

  test('rechaza la salida de un vehículo que no está', () => {
    const parq = crearParqueadero();
    expect(() => registrarSalida(parq, { placa: 'ZZZ999' })).toThrow('no está en el parqueadero');
  });
});

describe('listarEspacios y resumen', () => {
  test('filtra por tipo y estado', () => {
    const parq = crearParqueadero();
    registrarIngreso(parq, { placa: 'ABC123', tipo: 'carro' });
    expect(listarEspacios(parq, { tipo: 'moto' })).toHaveLength(6);
    expect(listarEspacios(parq, { tipo: 'carro', estado: 'ocupado' })).toHaveLength(1);
  });

  test('cuenta cupos libres y ocupados por tipo', () => {
    const parq = crearParqueadero();
    registrarIngreso(parq, { placa: 'ABC123', tipo: 'carro' });
    expect(resumen(parq)).toEqual({
      carro: { total: 12, ocupados: 1, libres: 11 },
      moto: { total: 6, ocupados: 0, libres: 6 },
    });
  });
});
