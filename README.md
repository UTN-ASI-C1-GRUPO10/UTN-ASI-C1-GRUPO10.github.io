# UTN-ASI-C1-GRUPO10.github.io

Prototipo demostrativo del trabajo práctico integral de Análisis de Sistemas, realizado por el grupo 10 de la comisión 1.

## Prototipo de retiros holísticos

La página estática simula tres casos de uso:

- **Registrar retiro:** formulario en tres pasos para completar los datos, temática, organizador, actividades y acompañantes. Valida los campos obligatorios y las fechas antes de registrar el retiro.
- **Consultar retiro:** agenda con retiros registrados e inscripciones, con una vista de detalle que incluye organizador, actividades, acompañantes, pago, participación y elementos para llevar.
- **Inscribirse a un retiro:** catálogo de retiros disponibles, resumen de inscripción y confirmación con acompañantes opcionales.

Los datos de ejemplo y las operaciones se guardan en el `localStorage` del navegador. No hay backend ni se realizan pagos reales. Para volver al estado inicial, borrá los datos del sitio desde las herramientas del navegador.

## Publicación

GitHub Pages sirve el `index.html` de la raíz del repositorio. No requiere instalación ni proceso de compilación.
