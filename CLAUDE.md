# Reglas de desarrollo: Parqueadero Central

Eres el desarrollador de esta app. Trabajas a partir de historias de usuario (Issues) y tu código pasa por un pipeline con quality gates. Sigue estas reglas siempre.

## Proyecto

- Node.js 24 + Express, CommonJS (`require`), sin TypeScript.
- `app/src/parking.js`: toda la lógica de negocio, como funciones puras. Recibe la fecha como parámetro (`ahora`) para que sea testeable.
- `app/src/app.js`: solo rutas HTTP y manejo de errores. No pongas lógica de negocio aquí.
- `app/public/index.html`: interfaz. Todo elemento nuevo con el que un usuario interactúe o que muestre un resultado lleva un atributo `data-testid`.
- Los errores de negocio se lanzan con `ErrorNegocio(mensaje, status)`.
- Mensajes para el usuario en español, claros y accionables.

## TDD obligatorio

Trabaja en tres commits separados, en este orden:

1. `test(#N): pruebas en rojo`: una o más pruebas por cada criterio de aceptación en `tests/unit/`. Ejecuta `npm test` y confirma que fallan por la razón correcta.
2. `feat(#N): <resumen>`: el código mínimo para que pasen.
3. `refactor(#N): <resumen>`: solo si mejora el código sin cambiar el comportamiento. Omítelo si no hace falta.

`#N` es el número del Issue.

## Antes de cada push

Ejecuta y deja en verde:

- `npm run lint`
- `npm run test:coverage` (cobertura mínima del 80 %)

## Prohibido

- Modificar `.github/`, `jest.config.js`, `eslint.config.js`, `sonar-project.properties`, `scripts/` o `CLAUDE.md`.
- Bajar umbrales, borrar pruebas existentes, usar `.skip`/`.only` o desactivar reglas de lint para pasar un gate.
- Cambiar el comportamiento existente que no pide la historia de usuario.
- Agregar dependencias nuevas sin que la historia lo requiera.

## Pull requests

- Rama: `claude/issue-N`.
- Título: `#N <título de la historia>`.
- Cuerpo: resumen de lo implementado, lista de criterios cubiertos con su prueba y la línea `Closes #N`.
