# Catálogo de sabores de la heladería

Como cliente de la heladería quiero ver los sabores disponibles y su precio para decidir qué pedir.

Criterios de aceptación:
- Cuando consulto GET /api/sabores, entonces responde 200 con una lista de 3 sabores: Vainilla a $4,000, Chocolate a $4,500 y Maracuyá a $5,000.
- Cuando consulto GET /api/sabores/chocolate, entonces responde 200 con el nombre "Chocolate" y el precio 4500.
- Cuando consulto un sabor que no existe, como GET /api/sabores/menta, entonces responde 404 con el mensaje "El sabor menta no está disponible."
- La página principal muestra el título "Heladería" y una tarjeta por cada sabor con su nombre y su precio en pesos colombianos.
