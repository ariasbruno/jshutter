# Guía de Configuración de jshutter (`jshutter.json`)

Este documento describe en profundidad el formato, los bloques y cada una de las propiedades admitidas en el archivo de configuración `jshutter.json`, así como las reglas de prioridad (cascada) y resolución de rutas en el sistema.

---

## 1. Estructura General

El archivo `jshutter.json` se compone de cinco bloques principales de nivel superior:
- **`global`**: Valores predeterminados compartidos por todas las tareas.
- **`presets`**: Definición de resoluciones personalizadas reutilizables.
- **`macros`**: Definición de scripts JS externos reutilizables bajo un alias.
- **`setupTasks`**: Listado de tareas de inicialización ejecutadas de forma secuencial.
- **`tasks`**: Listado de tareas individuales de captura a ejecutar en paralelo.

```json
{
	"$schema": "https://raw.githubusercontent.com/ariasbruno/jshutter/main/jshutter.schema.json",
	"global": { ... },
	"presets": { ... },
	"macros": { ... },
	"setupTasks": [ ... ],
	"tasks": [ ... ]
}
```

### Autocompletado y Validación de Sintaxis
Para facilitar la escritura de la configuración y evitar errores, **jshutter** proporciona un archivo de JSON Schema oficial (`jshutter.schema.json`). Podés configurar tu editor de código para habilitar autocompletado y validación de campos en tiempo real agregando la clave `$schema` en la raíz del archivo:

*	**Enlace remoto** (Recomendado):
	```json
	{
		"$schema": "https://raw.githubusercontent.com/ariasbruno/jshutter/main/jshutter.schema.json",
		"global": { ... },
		"tasks": [ ... ]
	}
	```
*	**Enlace local** (Para desarrollo dentro del repositorio):
	```json
	{
		"$schema": "../jshutter.schema.json",
		"global": { ... },
		"tasks": [ ... ]
	}
	```

## 2. Bloque `global` (Opcional)

Este bloque define las opciones globales que se aplicarán a todas las tareas de captura a menos que una tarea específica las sobrescriba.

#### `baseUrl` (`string`, default: `null`)
URL base de navegación (ej: `https://example.com`). Si se define, las tareas y las acciones de navegación ([`navigate`](docs/actions.md#navigate)) pueden especificar rutas relativas (ej: `/login`, `/contact`).

#### `baseOutputDir` (`string`, default: `"./output"`)
Directorio base donde se almacenan las capturas y reportes. Se resuelve relativo a la ubicación del archivo `jshutter.json`.

#### `viewport` (`string`, `object` o `array`, default: `{"width": 1280, "height": 720}`)
Dimensiones de pantalla predeterminadas. Puede ser un nombre de preset (ej: `"mobile"`), un objeto `{width, height}`, o un array mixto de ellos (ej: `["desktop", {"width": 1024, "height": 768}]`).

#### `fullPage` (`boolean`, default: `false`)
Si es `true`, captura el alto total de la página. Si es `false`, captura únicamente el área del viewport visible actual.

#### `maxPageHeight` (`number`, default: `8000`)
Límite de altura máxima en píxeles al realizar capturas de página completa (`fullPage: true`). Si la página supera este alto, el viewport se recorta a este valor para evitar saturar la memoria RAM. `0` desactiva el límite.

#### `delay` (`number`, default: `500`)
Tiempo de espera en milisegundos una vez cargada la página (y antes de ejecutar acciones o tomar la captura final). Rango: `>= 0`.

#### `format` (`string`, default: `"png"`)
Formato de archivo de imagen resultante. Valores admitidos: `"png"` y `"jpeg"`.

#### `quality` (`number`, default: `100`)
Calidad de compresión (rango `0-100`). Solo aplica cuando el formato es `"jpeg"`.

#### `timeout` (`number`, default: `30000`)
Límite máximo de tiempo en milisegundos para procesar la tarea completa. Si se supera, la tarea aborta por `TimeoutError`. `0` desactiva el timeout.

#### `colorScheme` (`string`, default: `"light"`)
Configura el modo de color preferido en el navegador. Valores admitidos: `"light"`, `"dark"` y `"no-preference"`.

#### `userAgent` (`string`, default: `null`)
Cadena de User-Agent personalizada que enviará el navegador en las peticiones HTTP.

#### `report` (`string`, default: `"none"`)
Configura la generación por defecto de reportes. Valores admitidos: `"json"`, `"html"`, `"all"`, `"none"`.

#### `embedBase64` (`boolean`, default: `true`)
Si es `true`, embebe las capturas de pantalla directamente dentro del reporte HTML en formato Base64 (reporte autónomo). Si es `false`, inyecta enlaces con rutas relativas físicas de las imágenes, ideal para reportes masivos.

#### `headed` (`boolean`, default: `false`)
Indica si el navegador debe iniciarse de forma visible por defecto.

#### `parallel` (`number`, default: `1`)
Número máximo de tareas a ejecutar en paralelo de forma predeterminada.

#### `saveStorageState` (`string`, default: `null`)
Ruta del archivo JSON donde se guardará el estado de autenticación (cookies/localStorage) globalmente.

#### `storageState` (`string`, default: `null`)
Ruta del archivo JSON desde el cual se cargará el estado de autenticación de forma predeterminada para todos los contextos.

#### `actions` (`array`, default: `[]`)
Secuencia de interacciones por defecto que se ejecutan antes del screenshot de cada tarea. Si una tarea define sus propias `actions`, estas se reemplazan completamente (no se fusionan). Ver [Catálogo de Acciones](./actions.md) para la lista completa de tipos disponibles.

---

## 3. Bloque `presets` (Opcional)

Diccionario que permite declarar dimensiones de pantalla (viewports) personalizadas bajo un nombre descriptivo para ser reutilizadas en las tareas.

### Formato de un Preset:
Cada entrada dentro del objeto `presets` debe ser un objeto con dos campos numéricos positivos:
- `width` (number): Ancho en píxeles.
- `height` (number): Alto en píxeles.

```json
"presets": {
	"custom-screen": {
		"width": 1440,
		"height": 900
	}
}
```

### Presets Built-in (Predefinidos):
**jshutter** ya cuenta con los siguientes nombres reservados, los cuales podés usar en cualquier tarea sin necesidad de declararlos en el bloque `presets`:
- `mobile-s`: `320 x 568`
- `mobile`: `375 x 812`
- `mobile-l`: `428 x 926`
- `tablet`: `768 x 1024`
- `tablet-l`: `1024 x 1366`
- `desktop`: `1280 x 720`
- `desktop-hd`: `1920 x 1080`
- `desktop-2k`: `2560 x 1440`

---

## 4. Bloque `macros` (Opcional)

Diccionario clave-valor que permite registrar archivos de script JS externos bajo un alias descriptivo para ser ejecutados dentro de las tareas de captura.

### Formato de un Macro:
Cada macro debe mapear una clave de texto con la ruta relativa del archivo JavaScript (relativa a la ubicación del archivo `jshutter.json`):

```json
"macros": {
	"close-warning": "./macros/close-warning.js"
}
```

Las macros registradas aquí se pueden invocar dentro de las tareas utilizando la acción `{ "type": "macro", "name": "close-warning" }`. El motor de jshutter leerá, validará y cargará de forma asíncrona la macro en tiempo de ejecución.

---

## 5. Bloque `tasks` (Requerido)

Arreglo que contiene la lista de tareas de captura. Cada tarea se ejecuta de manera aislada en su propio contexto limpio de Playwright.

### Propiedades de una Tarea:

#### Requeridas:
- **`id`** (`string`): Identificador único de la tarea. No debe repetirse en el archivo. Se utiliza para logs, filtrado (`--task <id>`) y reportes.
- **`url`** (`string`): Dirección web completa o ruta relativa (si se configuró `global.baseUrl`) a capturar (ej: `http://example.com/contact` o `/contact`). Debe tener un formato de URL o path válido.
- **`output`** (`string`): Ruta de destino para guardar la captura (ej: `contact.png` o `vistas/contact_mobile.png`). Se resuelve de forma relativa al directorio `baseOutputDir`.

#### Opcionales (Sobrescriben los valores globales):
- **`viewport`** (`string`, `object` o `array`): Dimensiones específicas para esta tarea. Puede ser un preset (ej: `"mobile"`), un objeto `{width, height}`, o un array mixto de ellos.
- **`fullPage`** (`boolean`): Sobrescribe la opción global.
- **`maxPageHeight`** (`number`): Sobrescribe el límite de altura máxima global.
- **`delay`** (`number`): Sobrescribe el retraso global.
- **`format`** (`string`): `"png"` o `"jpeg"`.
- **`quality`** (`number`): Calidad de imagen JPEG (rango `0-100`).
- **`colorScheme`** (`string`): `"light"`, `"dark"` o `"no-preference"`.
- **`timeout`** (`number`): Límite de tiempo específico para esta tarea.
- **`userAgent`** (`string`): User-Agent específico para esta tarea.
- **`tags`** (`array de strings`): Etiquetas asignadas a la tarea (ej: `["prod", "auth"]`). Permiten filtrar ejecuciones grupales desde la CLI (`--tag <tag>`).
- **`actions`** (`array de objetos`): Secuencia estructurada de interacciones que se ejecutarán antes del screenshot final. Ver [Catálogo de Acciones](./actions.md) para los tipos disponibles y sus parámetros.
- **`saveStorageState`** (`string`): Ruta relativa del archivo JSON donde se guardará el estado de sesión de Playwright (cookies & localStorage) tras el éxito de esta tarea.
- **`storageState`** (`string`): Ruta relativa del archivo JSON que cargará esta tarea al iniciar el contexto del navegador para iniciar pre-autenticado.

### Expansión de Múltiples Viewports

Si una tarea resuelve múltiples viewports o presets (sea porque los define como un array localmente, o porque los hereda como array del bloque `global`):
- **Clonación de Tareas**: La tarea original se multiplica en múltiples ejecuciones concurrentes independientes, una para cada dimensión resuelta.
- **Deduplicación**: Si hay duplicados (ej: `["mobile", "mobile"]`), se filtran automáticamente antes de iniciar la ejecución.
- **ID Único**: Los IDs de cada clon se auto-generan añadiendo el sufijo del preset o dimensiones correspondientes para evitar colisiones: `[id-original]-[sufijo]`.
- **Ruta de Archivo Automática**: Para evitar sobrescribirse mutuamente, el nombre del archivo de salida especificado en `output` inyecta automáticamente el sufijo antes de la extensión. Por ejemplo, `landing.png` se guardará como `landing-mobile.png` y `landing-desktop-hd.png`.
- **Retrocompatibilidad**: Si la tarea solo resuelve a una única dimensión/preset, no se aplica ningún sufijo, manteniendo los IDs y nombres de salida exactamente como fueron definidos originalmente.

---

## 6. Reglas de Resolución de Valores (Cascada)

Para determinar el valor final de cualquier propiedad opcional de una tarea (como el viewport o el formato de imagen), el motor de **jshutter** sigue estrictamente el siguiente orden de precedencia de mayor a menor prioridad:

1. **Configuración Directa en la Tarea**: Si la tarea especifica la propiedad directamente (ej: `"viewport": "mobile"` o `"format": "jpeg"`).
2. **Bloque `global`**: Si la propiedad está definida dentro de la clave `global` del archivo JSON (ej: `"viewport": ["desktop", "tablet"]`).
3. **Valor por Defecto del Sistema**: Las constantes preestablecidas en el código de **jshutter** si no se definió en ninguna de las capas anteriores (por defecto, viewport `1280x720`).

---

## 7. Resolución de Rutas (Paths)

**jshutter** gestiona la resolución de directorios y archivos de la siguiente manera:

1. **Directorio de Trabajo (`cwd`)**: Es el directorio desde donde ejecutás el comando `jshutter run`.
2. **Ubicación del archivo de configuración**: El archivo JSON de configuración (ubicado por defecto en `./jshutter/jshutter.json`) actúa como el punto de anclaje para resolver las rutas relativas de macros, salida y capturas.
3. **`baseOutputDir` (Directorio de Salida)**:
   - Si se define como una ruta relativa (ej: `"baseOutputDir": "./output"`), se resuelve de manera relativa al directorio que contiene el archivo de configuración actual.
   - Si es absoluta, se escribe directamente en dicha ruta.
4. **`output`** (Ruta de la captura):
   - Se resuelve **siempre** de forma relativa a la ruta calculada de `baseOutputDir`.
   - **Estándar recomendado**: Para mantener organizados los archivos, se sugiere colocar `"baseOutputDir": "./output"` a nivel global y definir los outputs de las tareas con el prefijo `"screenshots/"` (ej: `"output": "screenshots/contact.png"`). Esto guardará las imágenes en `jshutter/output/screenshots/contact.png` y mantendrá los reportes limpios y accesibles en la raíz del directorio de salida: `jshutter/output/jshutter-report.html`.

   **Una sola configuración de capturas:**
   ```
   mi-proyecto/
   └── jshutter/
       ├── jshutter.json
       └── output/
           ├── jshutter-report.html
           └── screenshots/
               ├── home.png
               └── contact.png
   ```

   **Múltiples configuraciones de capturas:**
   ```
   mi-proyecto/
   └── jshutter/
       ├── produccion.json
       ├── testing.json
       └── output/
           ├── produccion/
           │   ├── jshutter-report.html
           │   └── screenshots/
           │       ├── home.png
           │       └── contact.png
           └── testing/
               ├── jshutter-report.html
               └── screenshots/
                   ├── home.png
                   └── contact.png
   ```

---

## 8. Bloque `setupTasks` (Opcional)

El bloque `setupTasks` es un array opcional de tareas de preparación que se ejecutan **secuencialmente** (una tras otra, `parallel = 1`) antes de que se inicie el pool de ejecución paralelo de las tareas principales (`tasks`).

Es ideal para cualquier preparación que deba ocurrir antes de las capturas: obtener datos del servidor, generar archivos temporales, configurar un estado de la aplicación, o realizar un inicio de sesión.

*	**Garantía Secuencial**: Las tareas en `setupTasks` nunca corren en paralelo entre sí ni colisionan.
*	**Inmunidad a Filtros**: A diferencia del bloque `tasks`, las tareas de preparación **siempre** se ejecutan aunque uses las banderas de filtrado `--task` o `--tag` en la consola (para asegurar que cualquier estado o archivo necesario esté listo).
*	**Cancelación por Error**: Si una de las tareas del bloque `setupTasks` falla, el motor abortará inmediatamente y no ejecutará las tareas en paralelo de `tasks`, previniendo capturas defectuosas.
*	**Estructura Idéntica**: Cada objeto en `setupTasks` soporta exactamente las mismas propiedades que las tareas normales del bloque `tasks`.

---

## 9. Uso de Variables de Entorno (Seguridad)

Para evitar almacenar credenciales, tokens o contraseñas en texto plano dentro del archivo `jshutter.json`, podés utilizar el prefijo `$env.` en cualquier propiedad de tipo string.

*	**Sintaxis**: `$env.NOMBRE_VARIABLE`
*	**Ejemplo**:
	```json
	{
		"type": "fill_form",
		"fields": [
			{ "selector": "#email", "value": "$env.JSHUTTER_USER" },
			{ "selector": "#password", "value": "$env.JSHUTTER_PASSWORD" }
		]
	}
	```
*	**Resolución**: Al cargar la configuración, el motor de **jshutter** leerá de forma dinámica `process.env.NOMBRE_VARIABLE`. Si la variable no está configurada en el entorno actual del sistema, se mostrará una advertencia destacada en la consola y se resolverá como una cadena vacía.
