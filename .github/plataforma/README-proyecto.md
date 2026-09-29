<!-- readme-proyecto -->
# {{NOMBRE}}

> Proyecto generado automáticamente desde la plantilla [{{PLANTILLA}}](https://github.com/{{PLANTILLA}}) el {{FECHA}}, con el autoservicio de proyectos.

Este producto se construye **historia a historia**: cada historia de usuario la desarrolla la IA con TDD y la valida un pipeline DevSecOps con 10 quality gates antes de desplegarla en ambientes efímeros de DEV y QA. Ningún cambio llega a `main` sin pasar por un PR con todos los gates en verde.

## Enviar una historia de usuario

1. Ve a **Issues → New issue → Historia de usuario**.
2. Escribe la historia ("Como … quiero … para …") y sus criterios de aceptación, uno por línea y con valores concretos.
3. Crea el Issue. La etiqueta `claude-dev` se asigna sola y arranca el flujo.

Cuanto más concretos sean los criterios (valores, mensajes y códigos de respuesta esperados), menos margen de interpretación tiene la IA.

## Qué pasa después

1. **IA QA** crea las pruebas de aceptación (y E2E si hay interfaz) a partir de los criterios, en la rama `claude/issue-N`.
2. **IA Desarrollo** implementa con TDD para que esas pruebas pasen y abre el PR.
3. **El pipeline** ejecuta los 10 quality gates, construye la imagen y la despliega en DEV y QA.
4. **Si un gate falla**, el reporte llega al PR y al chat del equipo, y la IA corrige hasta 3 veces antes de pedir revisión humana.
5. **Una persona revisa el PR y hace merge.** El Issue se cierra automáticamente.

Todo el avance se ve en [Actions](https://github.com/{{REPO}}/actions), y las alertas llegan al espacio de Google Chat del equipo.

## Quality gates

| Stage | Gate | Herramienta |
| --- | --- | --- |
| CI | TDD verificado | `scripts/check-tdd.js` |
| CI | Integridad de pruebas de aceptación | `scripts/check-acceptance-integrity.js` |
| CI | Secretos en el código | Gitleaks |
| CI | Análisis estático | ESLint |
| CI | Pruebas unitarias y de aceptación (cobertura mínima 80 %) | Jest |
| CI | Dependencias vulnerables | OSV-Scanner |
| CI | Calidad y seguridad del código | SonarQube Cloud |
| Build | Seguridad de la imagen | Trivy |
| DEV | Smoke | curl |
| QA | E2E de aceptación | Playwright |

## Enlaces del proyecto

| Recurso | Enlace |
| --- | --- |
| Pipeline y ejecuciones | https://github.com/{{REPO}}/actions |
| Imágenes publicadas | https://github.com/{{REPO}}/pkgs/container/{{NOMBRE}} |
| Despliegues en DEV y QA | https://github.com/{{REPO}}/deployments |
| Calidad del código | https://sonarcloud.io/project/overview?id={{SONAR_KEY}} |
| Alertas de seguridad | https://github.com/{{REPO}}/security |

## Trabajar en local

```powershell
npm install
npm start          # http://localhost:3000
npm run lint
npm run test:coverage
npm run test:e2e   # requiere la app corriendo en http://localhost:3000
```

## Reglas y configuración

- **Reglas de la IA por rol:** `CLAUDE.md`.
- **Umbrales de los gates:** `jest.config.js`, `eslint.config.js` y `sonar-project.properties`.
- **Excepciones de seguridad revisadas:** `.gitleaks.toml`.
- **Protección de `main`:** ruleset **Proteger main**, con los 10 gates obligatorios.

La documentación completa de la plataforma está en la [plantilla](https://github.com/{{PLANTILLA}}).
