# UTN-ASI-C1-GRUPO10.github.io

Prototipo demostrativo del trabajo práctico integral de Análisis de Sistemas, realizado por el grupo 10 de la comisión 1.

## Prototipo de agenda personal de retiros

La página estática simula estos casos de uso:

- **Registrar retiro:** nombre, ubicación y fechas son obligatorios; el resto de los datos se puede completar después. Las fechas se ingresan como `dd/mm/yy`.
- **Consultar retiro:** muestra la agenda y el detalle del retiro, con pagos, estado de participación y elementos necesarios cuando estén registrados.
- **Modificar retiro:** desde la lista de consulta, cada retiro tiene una acción para editar sus datos, revisar un resumen, confirmar los cambios o cancelar y descartarlos.

La agenda comienza con retiros de ejemplo. Los cambios viven solo en memoria y se pierden al refrescar la página. No hay base de datos ni pagos reales.

## Publicación

GitHub Pages sirve el `index.html` de la raíz del repositorio. No requiere instalación ni proceso de compilación.
