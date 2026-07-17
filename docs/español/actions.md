# Catálogo de Acciones Secuenciales

Las acciones dentro del campo `actions` de cada tarea se ejecutan secuencialmente antes de la captura final.

---

## Acciones Soportadas

#### `click`
Hace clic en un elemento del DOM.
- `selector` (string): Selector CSS del elemento.
- `optional` (boolean, opcional): Si es `true`, no falla si el elemento no se encuentra.

#### `type`
Introduce texto en un campo de formulario.
- `selector` (string): Selector CSS del input.
- `value` (string/number): Texto a escribir.
- `clear` (boolean, opcional): Si es `true`, vacía el campo antes de escribir.

#### `select`
Selecciona una opción en un `<select>` usando el atributo `value`.
- `selector` (string): Selector CSS del `<select>`.
- `value` (string): Valor del atributo `value` de la opción a seleccionar.

#### `hover`
Posiciona el cursor sobre el elemento indicado para disparar estilos `:hover`.
- `selector` (string): Selector CSS del elemento.

#### `scroll`
Desplaza la pantalla.
- `value` (string/number): `"down"` o `"up"` para scroll suave, o número de píxeles específicos.

#### `wait`
Pausa la ejecución por el número de milisegundos indicado.
- `value` (number): Milisegundos de espera.

#### `wait_selector`
Pausa hasta que el selector aparezca en el DOM.
- `selector` (string): Selector CSS a esperar.
- `timeout` (number, opcional): Tiempo máximo de espera en ms.

#### `wait_navigation`
Espera a que termine una redirección o navegación de red.
- `timeout` (number, opcional): Tiempo máximo de espera en ms.

#### `wait_network_idle`
Espera a que no haya solicitudes de red activas durante al menos 500ms.
- `timeout` (number, opcional): Tiempo máximo de espera en ms.

#### `keyboard`
Simula presionar una tecla física.
- `key` (string): Nombre de la tecla (ej: `"Enter"`, `"Tab"`, `"Escape"`, `"ArrowDown"`).

#### `navigate`
Navega a otra página dentro de la misma sesión/contexto de navegador.
- `url` (string): URL de destino.

#### `screenshot`
Toma una captura intermedia.
- `output` (string): Ruta del archivo de salida (relativa a `baseOutputDir`).

#### `fill_form`
Rellena varios inputs en un solo paso (equivalente a múltiples `type`).
- `fields` (array de objetos): Cada objeto contiene `selector` (string), `value` (string) y opcionalmente `clear` (boolean).

#### `hide`
Oculta elemento(s) mediante `display: none` de forma segura. Usa un `MutationObserver` si se montan asíncronamente.
- `selector` (string): Selector CSS del elemento a ocultar.

#### `set_storage`
Inyecta un par clave-valor en `localStorage` o `sessionStorage`.
- `key` (string): Nombre de la clave.
- `value` (any): Valor a inyectar (auto-serializa objetos/arrays).
- `storageType` (string, opcional): `"local"` (default) o `"session"`.

> [!IMPORTANT]
> Como las acciones se ejecutan **después** de que la página carga, usá `navigate` después de `set_storage` si la página necesita leer estos datos durante su render inicial.

> Los datos inyectados vía `set_storage` están Scoped al contexto de navegador de la tarea actual. No están disponibles en otras tareas.

#### `evaluate`
Ejecuta código JavaScript directamente en la página.
- `script` (string): Código JS a ejecutar vía `page.evaluate()`.

> [!WARNING]
> Úsese con precaución. El código se ejecuta en el contexto del navegador. Los datos seteados aquí (ej: `window.__data`, `localStorage`) están scoped al contexto de navegador de la tarea actual y no están disponibles en otras tareas.

#### `macro`
Llama y ejecuta una macro de JavaScript externa registrada en el bloque `macros`.
- `name` (string): Alias de la macro registrada.

---

## Buenas Prácticas

-	**Evitar esperas rígidas (`wait`):** En su lugar, prefiere utilizar `wait_selector` o `wait_network_idle` para que la ejecución sea más rápida y robusta frente a variaciones de velocidad de red.
-	**Cierre de modales y diálogos:** Si hay banners persistentes, usá la acción `hide` con una lista de selectores separados por comas para eliminarlos del viewport antes de tomar la captura de pantalla final.
-	**Persistencia de contexto:** Dado que cada tarea corre en su propia sesión aislada, si necesitás capturar una página interna segura, realizá el flujo de inicio de sesión (`navigate` -> `fill_form` -> `click` -> `wait_navigation`) como las primeras acciones de esa misma tarea. Si múltiples tareas necesitan la misma preparación (ej: cerrar un modal), repetí esas acciones en cada tarea en lugar de depender de una tarea de setup.
