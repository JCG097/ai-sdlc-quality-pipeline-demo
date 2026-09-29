# Lista de tareas pendientes

Como persona organizada quiero registrar tareas pendientes para no olvidar lo que tengo que hacer.

Criterios de aceptación:
- Dado que no hay tareas, cuando consulto GET /api/tareas, entonces responde 200 con una lista vacía.
- Cuando creo una tarea con POST /api/tareas y el título "Comprar leche", entonces responde 201 con la tarea creada, un id y el estado "pendiente".
- Cuando intento crear una tarea con el título vacío, entonces responde 400 con el mensaje "El título de la tarea es obligatorio."
