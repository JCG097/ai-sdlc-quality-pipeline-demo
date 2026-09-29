// Prueba E2E base: la aplicación desplegada carga su página principal.
// Las historias de usuario agregan sus propias pruebas en tests/e2e/issue-N.spec.js.
const { test, expect } = require('@playwright/test');

test('la página principal carga', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('titulo-app')).toBeVisible();
});
