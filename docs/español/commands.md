# Referencia de Comandos de jshutter

Este documento detalla en profundidad el funcionamiento de la Interfaz de Línea de Comandos (CLI) de **jshutter**, explicando cada comando, sus banderas (flags), casos de uso y códigos de salida.

---

## 1. `jshutter run [config]` (Alias: `r`)

Ejecuta el motor de capturas basándose en la configuración especificada.
- Si se omite la ruta del archivo, busca por defecto `./jshutter.json` o `./jshutter/jshutter.json` en el directorio de trabajo actual.
- Si se especifica un nombre simple (como `ayari` o `ayari.json`), se buscará y resolverá automáticamente dentro del directorio `./jshutter/` (ej: `./jshutter/ayari.json`).

### Descripción del Funcionamiento:
- **Orquestación de Playwright**: Inicializa una única instancia del navegador solicitado (`chromium`, `firefox` o `webkit`) y abre contextos de navegación aislados (`BrowserContext`) para cada tarea activa. Esto previene que se compartan estados de cookies, sesiones o caché de forma accidental entre tareas distintas.
- **Flujo de Ejecución**: Sigue de forma estricta las fases de: navegación a la URL -> espera de retraso (`delay`) -> ejecución secuencial de interacciones (`actions`) -> captura de pantalla (`screenshot`) -> persistencia en archivo -> cierre del contexto.
- **Códigos de Salida**:
	- `0`: Todas las tareas activas se ejecutaron y guardaron correctamente.
	- `1`: Hubo un error de sintaxis, falta de dependencias (navegadores no instalados) o una o más tareas fallaron (por timeout, selectores inexistentes, etc.).

### Banderas (Flags) de Ejecución:

#### `--headed`
- **Descripción**: Lanza el navegador en modo visible (con interfaz gráfica de usuario).
- **Caso de uso**: Depuración visual local. Permite observar paso a paso cómo se ejecutan los clics, los scrolls y el rellenado de formularios en tiempo real.

#### `-v, --verbose`
- **Descripción**: Activa los logs detallados del ciclo de vida interno del motor.
- **Caso de uso**: Diagnóstico de fallos. Imprime logs detallados de cada navegación, retrasos activos y parámetros de cada acción antes de ejecutarse en el navegador.

#### `--silent`
- **Descripción**: Silencia toda la salida por consola (excepto errores críticos e insalvables).
- **Caso de uso**: Ejecución en scripts automatizados, tareas programadas (cron) o pipelines de Integración Continua (CI) donde se desea mantener un log limpio.

#### `--dry-run`
- **Descripción**: Valida el archivo de configuración y muestra en la terminal una tabla con el resumen de las tareas que se ejecutarían, sin abrir ningún navegador.
- **Caso de uso**: Previsualización rápida. Permite comprobar qué tareas se filtrarán y en qué rutas se guardarán las capturas antes de disparar la ejecución real. Exita inmediatamente con código `0`.

#### `--task <id>`
- **Descripción**: Filtra la ejecución para correr únicamente la tarea que coincida con el identificador único (`id`) especificado. Las demás tareas son omitidas e impresas como `SKIPPED`.
- **Caso de uso**: Pruebas unitarias de capturas. Permite probar una interacción compleja (como una pasarela de pago o login) sin volver a capturar el resto del sitio web.

#### `--tag <tag>`
- **Descripción**: Filtra la ejecución para correr únicamente aquellas tareas que contengan la etiqueta especificada en su arreglo `tags`. Las demás se omiten.
- **Caso de uso**: Ejecución por entornos o grupos (ej: `--tag prod` o `--tag checkout`).

#### `--browser <type>`
- **Descripción**: Define el motor del navegador para la ejecución de Playwright. Valores soportados: `chromium` (default), `firefox` y `webkit`.
- **Caso de uso**: Pruebas de compatibilidad cross-browser (ej: probar cómo se ve el diseño en WebKit/Safari o Firefox).
- **Control de errores**: Si los binarios del navegador solicitado no están instalados localmente, el comando aborta arrojando un error descriptivo con instrucciones para instalarlo mediante `npx playwright install`.

#### `--parallel <number>`
- **Descripción**: Configura la cantidad máxima de tareas que se pueden procesar de forma simultánea. Por defecto es `1` (ejecución secuencial).
- **Caso de uso**: Optimización de rendimiento. Al correr, por ejemplo, con `--parallel 3`, el motor utiliza una cola concurrente (worker pool) para capturar 3 páginas a la vez compartiendo el mismo proceso del navegador, lo cual reduce drásticamente el tiempo de ejecución en suites grandes.
- **Nota de rendimiento**: Configurar una concurrencia demasiado alta (ej: mayor a 5 u 8 navegadores en paralelo) es responsabilidad del usuario y puede saturar la CPU y memoria RAM locales, ocasionando cuellos de botella o fallos de timeout en Playwright. Se recomienda ajustar este valor en base a los recursos disponibles de hardware.

#### `--report <type>`
- **Descripción**: Determina la generación de reportes de ejecución en el directorio base de salida. Opciones soportadas:
	- `none` (defecto): No escribe reportes adicionales.
	- `json`: Escribe un archivo estructurado `jshutter-report.json`.
	- `html`: Escribe un archivo interactivo `jshutter-report.html` con tarjetas de resultados, zoom modal de screenshots y filtros.
	- `all`: Genera ambos archivos.

#### `--force`
- **Descripción**: Omite las advertencias de confirmación interactiva para ejecuciones masivas de capturas.
- **Caso de uso**: Automatización en entornos no interactivos (como CI/CD o contenedores Docker) donde se desea forzar la generación del reporte HTML con Base64 activo para más de 100 capturas sin bloquear la terminal.

## Precedencia de Opciones

Las opciones `--report`, `--headed` y `--parallel` pueden definirse tanto en la línea de comandos de la CLI como en el bloque `"global"` de la configuración `jshutter.json`. La precedencia es:

1. **Flag de la CLI** (ej: `--report html` o `--parallel 4`) -> Prioridad máxima.
2. **Propiedad en el bloque `global`** de la configuración.
3. **Valor por defecto del sistema** (`"none"`, `false`, y `1` respectivamente) -> Prioridad mínima.

### Control de Seguridad: Advertencias de Git (.gitignore)

Al ejecutar `jshutter run`, si la configuración define la propiedad `saveStorageState` para guardar las cookies de sesión del navegador en un archivo local (ej. `auth-session.json`), el motor ejecutará automáticamente una comprobación de Git (`git check-ignore`).

*	**Propósito**: Evitar la filtración accidental de sesiones web activas en repositorios públicos.
*	**Comportamiento**: Si el archivo JSON resultante no está registrado dentro del archivo `.gitignore` del proyecto actual, se mostrará un mensaje de advertencia destacado en la consola antes de iniciar la ejecución. La advertencia es **informativa, no bloqueante**: la ejecución continúa de todas formas.

### Control de Rendimiento: Advertencia por Reportes Masivos (Alerta de Base64)

Al ejecutar `jshutter run`, si se cumplen simultáneamente las siguientes condiciones:
1. El número total de capturas individuales a realizar (tras la expansión de viewports) es **superior a 100**.
2. El tipo de reporte configurado o solicitado es `"html"` o `"all"`.
3. El reporte HTML se configuró para embeber las imágenes directamente en Base64 (`"embedBase64": true`).
4. Se está ejecutando en una terminal interactiva (TTY) sin la bandera `--force`.

*	**Comportamiento**: La consola detendrá la ejecución del motor e imprimirá una advertencia informando sobre el posible colapso del navegador al abrir un archivo HTML extremadamente pesado. Solicitará confirmación interactiva (`Do you want to continue with Base64 generation anyway? (y/N)`). Si el usuario rechaza o presiona Enter, el proceso finaliza con código `0`.
*	**Omisión**: El prompt se omite automáticamente si la terminal no es interactiva (CI/CD) o si se agrega la bandera `--force`.

### Verificación Automática de Versiones

Al ejecutar cualquier comando, **jshutter** verifica en segundo plano si hay una versión más reciente disponible en npm. Si la encuentra, muestra un aviso discreto con la nueva versión y el comando para actualizar. Esta verificación es no bloqueante y falla silenciosamente sin conexión a internet.

### Comandos Integrados de Commander

| Flag | Descripción |
| :--- | :--- |
| `--help` | Muestra la ayuda general del CLI con todos los comandos y banderas disponibles. |
| `-V, --version` | Muestra la versión actual de **jshutter** instalada. |

> [!NOTE]
> `-V` (versión) es distinto de `-v` (verbose), que es una bandera exclusiva del comando `run`.

---

## 2. `jshutter init` (Alias: `i`)

Crea una carpeta `jshutter/` en la raíz del proyecto conteniendo una configuración básica de plantilla `jshutter.json` destinado a guardar las capturas organizadas.

### Comportamiento:
- **Prevención de sobrescritura**: Si el instalador detecta que ya existe un archivo `./jshutter/jshutter.json` en el proyecto, solicita interactivamente confirmación en la consola (`The file jshutter/jshutter.json already exists. Do you want to overwrite it? (y/N):`).
- Si el usuario rechaza la sobrescritura, cancela el proceso de inmediato sin modificar el disco (código de salida `0`).
- Si el archivo no existe o se autoriza la sobrescritura, escribe una plantilla estándar con configuraciones globales (`baseOutputDir`, `viewport`, `delay`, `fullPage`) y una tarea de ejemplo apuntando a `example.com`.

---

## 3. `jshutter validate [config]` (Alias: `v`)

Analiza y valida estáticamente la estructura y coherencia del archivo de configuración especificado.

### Comportamiento:
- **Carga y Verificación**: Lee el JSON, analiza la sintaxis y valida el cumplimiento estricto del schema (viewports positivos, nombres de presets válidos, parámetros requeridos por cada acción en la lista).
- **Diagnóstico rápido**: No abre ningún navegador de Playwright, por lo que su ejecución es casi instantánea (menos de 50ms).
- **Códigos de Salida**:
	- Si es válido: Imprime `✓ Config válido` y el número de tareas encontradas, exitando con código `0`.
	- Si es inválido: Imprime `✗ Config inválido`, detalla el error de tipado o campo faltante detectado y exita con código `1`.

---

## 4. `jshutter install-skill` (Alias: `is`)

Instala el skill de asistencia de Inteligencia Artificial (`SKILL.md`) en la configuración local de agentes del proyecto.

### Comportamiento:
- **Registro de Skill**: Escribe el archivo principal en `.agents/skills/jshutter/SKILL.md` y sus referencias asociadas en `.agents/skills/jshutter/references/` (creando los subdirectorios necesarios de forma automática).
- **Detección inteligente**: Intenta cargar la copia local de los recursos empaquetados internamente en el propio paquete npm (dentro del directorio de instalación de `node_modules`). En caso de no encontrarlos, realiza un fallback para descargar la última versión estable desde el repositorio oficial en GitHub.
- **Propósito**: Esto registra el manual, la gramática del config y las referencias de comandos del proyecto directamente dentro de las capacidades de tu agente, permitiéndoles comprender de forma nativa cómo construir tareas y resolver interacciones complejas.

---

## 5. `jshutter open-report [config]` (Alias: `open`, `o`)

Abre el reporte interactivo HTML generado en el navegador predeterminado del sistema del usuario.

### Comportamiento:
- **Localización Automática**: Intenta leer el archivo de configuración resuelto para ubicar el directorio de salida global (`baseOutputDir`) y buscar el archivo `jshutter-report.html`.
- **Fallback de Rutas**: Si la carga del JSON falla, busca el reporte de manera secuencial en rutas comunes del proyecto (ej. `./output/jshutter-report.html`, `./jshutter/output/jshutter-report.html`, `./jshutter-report.html`).
- **Apertura Multiplataforma**: Detecta el sistema operativo y ejecuta de forma asíncrona y transparente el comando adecuado para invocar al navegador del usuario (`open` en macOS, `start` en Windows, `xdg-open` en entornos Linux).
- **Códigos de Salida**: Exita con código `0` si el reporte se abrió correctamente en el navegador y con código `1` si el archivo no se pudo localizar o el comando del sistema falló.
