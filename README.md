<p align="center">
  <h1 align="center">📷️ jshutter</h1>
  <p align="center">
    <em>Automate web page captures with a single JSON file</em>
  </p>
</p>

<p align="center">
  <b id="english">English</b> · <a href="#español">Español</a>
</p>

---

## Overview

**jshutter** is a CLI that standardizes web page screenshots through a JSON configuration file. Instead of writing automation scripts for each site, you declare the pages, resolutions, and required interactions in a single file and run everything with `npx jshutter run`.

### Index

- [Highlights](#highlights)
- [Quick Start](#quick-start)
- [CLI Commands & Option Flags](#cli-commands--option-flags)
- [Configuration & Advanced Usage](#configuration--advanced-usage)
- [Installation](#installation)
- [Authors](#authors)
- [License](#license)

## Highlights

- **Zero Code**: Define all your captures and interaction flows in a simple `jshutter.json` file.
- **IDE Autocomplete**: Real-time type validation and IntelliSense in your IDE via built-in **JSON Schema**.
- **Sequential Preparation**: Define setup tasks ([`setupTasks`](docs/english/configuration.md#8-setuptasks-block-optional)) sequentially for any preparation (authentication, data generation, state configuration) before captures.
- **Session Persistence**: Save and load cookie/localStorage state ([`storageState`](docs/english/configuration.md#optional-overrides-global-values)) automatically to run protected captures in parallel without repeating logins.
- **Task Isolation**: Each capture runs in an independent browser context (`BrowserContext`), free from cookie or session collisions.
- **Sequential Actions**: Simulate real interactions (clicks, forms, scroll, network wait, or code injection) before capturing.
- **Reusable Macros**: Define JS scripts in standalone files and call them to avoid duplication (e.g., common login flows).
- **Self-contained HTML Report**: Generate an interactive HTML report with captures and execution metadata.
- **AI-Friendly**: Install the official skill (`jshutter install-skill`) so AI agents like Cursor or Copilot know jshutter's grammar and help you generate configurations.

## Quick Start

Standardizing your captures is as simple as defining a `./jshutter.json` file at your project root to declare the pages you want to capture:

```json
{
	"$schema": "./jshutter.schema.json",
	"global": {
		"baseOutputDir": "./screenshots",
		"viewport": ["mobile", "desktop-hd"]
	},
	"tasks": [
		{
			"id": "home",
			"url": "https://example.com",
			"output": "home.png"
		},
		{
			"id": "contact",
			"url": "https://example.com/contact",
			"output": "contact.png"
		}
	]
}
```

And trigger the capture of all pages (full-screen and at multiple resolutions in parallel) with a single command:

```bash
npx jshutter run
```

## CLI Commands & Option Flags

Below is the complete list of commands and console flags supported by the **jshutter** CLI via the `npx jshutter` command:

### Main Commands

| Command | Description |
| :--- | :--- |
| [`run / r [config.json]`](#1-run-config) | Processes and executes the capture flow declared in the configuration. Looks for `jshutter.json` by default if the argument is omitted. |
| [`init / i`](#2-init) | Creates a `jshutter/` folder and writes a basic template `jshutter.json` configuration inside it. |
| [`validate / v [config.json]`](#3-validate-config) | Validates the JSON syntax and correctness of declared actions. |
| [`install-skill / is`](#4-install-skill) | Installs the jshutter skill to assist workflows with AI agents. |
| [`open-report / open / o [config.json]`](#5-open-report) | Opens the generated interactive HTML report in your default browser. |
| `--help` | Shows the general CLI help with all available commands and flags. |
| `--version` | Shows the currently installed **jshutter** version (alternative: `-V`). |

### Flags for the `run` Command

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--headed` | `false` | Starts the browser in visible mode on screen. |
| `--verbose` or `-v` | `false` | Enables detailed logs describing the start and end of each action in real time. |
| `--silent` | `false` | Hides all console output (ideal for silent or CI/CD environments). |
| `--report <type>` | `none` | Format of the results report generated upon completion: `json`, `html`, `all`, or `none`. |
| `--dry-run` | `false` | Simulates the flow showing an associated tasks table without launching browsers. |
| `--task <id>` | `null` | Filters execution to process only the task matching the provided ID. |
| `--tag <tag>` | `null` | Filters execution to process only tasks containing the specified tag. |
| `--browser <type>` | `"chromium"` | Playwright browser engine to use: `chromium`, `firefox`, or `webkit`. |
| `--parallel <number>` | `1` | Maximum number of browsers running simultaneously. |
| `--force` | `false` | Skips interactive confirmation prompts for bulk executions. |

> [!NOTE]
> The `--headed`, `--report`, and `--parallel` options can also be defined within the `"global"` block of the `jshutter.json` configuration. Flags specified on the CLI have absolute precedence and override any configuration value.

### Command Details

#### 1. `run [config]`

**Alias**: `r`

Executes the capture of all pages declared in the configuration file.

- **Automatic resolution**: If you run `npx jshutter run` without arguments, it will look for `./jshutter.json` at the root. If not found, it will automatically search in `./jshutter/jshutter.json`.
- **Alias usage (`jshutter/` folder)**: If you have multiple configurations organized in the `./jshutter/` folder, you can run them by typing only their name, omitting the path and `.json` extension.
  - _Example_: `npx jshutter run ayari` will search for and run `./jshutter/ayari.json` directly.
- **Direct path**: You can specify the exact path of any configuration JSON file on disk.
  - _Example_: `npx jshutter run ./configurations/testing.json`.
- **Common command examples**:

  ```bash
  # Runs the default basic flow
  npx jshutter run

  # Runs jshutter/ayari.json configuration in headed (visible) mode
  npx jshutter run ayari --headed

  # Filters and runs only the task with ID "contact" and generates the HTML report
  npx jshutter run ayari --task contact --report html
  ```

#### 2. `validate [config]`

**Alias**: `v`

Validates JSON syntax and checks file consistency (selectors, viewports, macros) before opening the browser. It's a quick execution.

- **Resolution**: Use the same smart search rules as the `run` command (supports aliases without path or extension, or direct local files).
- **Examples**:

  ```bash
  # Validates the default config
  npx jshutter validate

  # Validates jshutter/ayari.json using alias
  npx jshutter validate ayari
  ```

#### 3. `init`

**Alias**: `i`

Initializes the base **jshutter** structure in your workspace.

- **Behavior**: Creates the `jshutter/` folder and writes a basic template `jshutter.json` configuration inside it.
- **Template Content**:
  - **Schema Link (`$schema`)**: Configures the `$schema` property pointing to the official JSON Schema on GitHub to instantly enable validation and autocomplete in your IDE.
  - **Global Configuration**: Defines recommended default values like the output folder (`baseOutputDir: "./output"`), responsive viewports, delays, and timeouts.
  - **Sample Task**: Creates a basic task (`example-home`) targeting `https://example.com` with the `desktop-hd` preset.
- **Safety**: If it detects that the `./jshutter/jshutter.json` file already exists, it will request interactive confirmation in the console (`y/N`) before making any changes to prevent overwriting your previous configurations.
- **Example**:
  ```bash
  npx jshutter init
  ```

#### 4. `install-skill`

**Alias**: `is`

Installs the schema specification and configuration grammar (`SKILL.md`) at your local workspace root (`.agents/skills/jshutter/`). This allows AI agents like Cursor or Copilot to know jshutter's rules and help you generate configurations.

- **Example**:
  ```bash
  npx jshutter install-skill
  ```

#### 5. `open-report`

**Alias**: `open`, `o`

Searches for and opens the interactive HTML report (`jshutter-report.html`) in your default web browser.

- **Path resolution**: If a configuration file is provided, the command extracts the report path from its `baseOutputDir` property. If no configuration is provided or the file is not found, it automatically searches common paths: `./output/jshutter-report.html`, `./jshutter/output/jshutter-report.html`, and `./jshutter-report.html`.
- **Error**: If no report is found in the searched paths, the command terminates with an error message.
- **Platform**: Uses the native operating system command to open files (`open` on macOS, `start` on Windows, `xdg-open` on Linux).
- **Examples**:

  ```bash
  # Opens the report from the default configuration
  npx jshutter open-report

  # Opens the report using a specific configuration
  npx jshutter open-report ayari
  ```

## Configuration & Advanced Usage

For complex applications, **jshutter** allows you to automate complete interactive flows (such as logins, shopping cart manipulation, variable injection, responsive screen emulation, and automatic reports) through a modular system structured in key blocks.

### Engine Lifecycle: setupTasks vs. tasks

Execution is divided into two dynamic phases designed to synchronize state without losing parallelism:

1. **Preparation Phase (`setupTasks`)**: The engine runs this list of tasks **sequentially** (one after another) before starting the main phase. It is ideal for any preparation that must occur before captures: fetching data from the server, generating temporary files, configuring state, or performing a login. If any of these tasks fail, the entire execution is aborted. Use the `saveStorageState` property to save cookies and `localStorage` to a JSON file (e.g., `auth-session.json`) and reuse that session in the main captures.
2. **Concurrent Capture Phase (`tasks`)**: Once setup is complete, the engine runs the main tasks in parallel. If you configure `storageState` at the `global` level, all tasks will inherit the saved session and start pre-authenticated in independent browser contexts, preventing data collisions.

> **Note**: Since each task runs in an independent browser context, runtime state (e.g., `localStorage`, `window` variables) set in a `setupTask` is not available in `tasks`. Use `saveStorageState`/`storageState` for session persistence, and inline any preparation actions directly into the tasks that need them.

---

### Configuration Blocks

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

#### 1. `global` Block (Inheritable Values)

Define default values applied to all tasks if not overridden at the task level. Allows resolving the base URL (`baseUrl`), output folder (`baseOutputDir`), viewports, formats, delay, maximum capture height (`maxPageHeight`), parallelism level, default actions (`actions`), and report type (`report`).

#### 2. `presets` Block (Reusable Resolutions)

Dictionary for declaring custom resolution names (e.g., `"custom-screen": {"width": 1440, "height": 900}`). **jshutter** includes ready-to-use presets like `mobile`, `tablet`, `desktop-hd`, and `desktop-2k`. If a task or global specifies a viewport array (e.g., `["mobile", "desktop-hd"]`), the task will automatically expand into individual executions for each resolution without overwriting their outputs.

#### 3. `macros` Block (Code Modularization)

Allows registering external JavaScript scripts under an alias. Instead of writing extensive inline logic in your JSON, you create `.js` files and invoke them within a task's action flow with `{ "type": "macro", "name": "my-macro" }`.

#### 4. `tasks` Block (Main Captures)

List of capture tasks that run in parallel after setup. Each task declares a URL, an identifier (`id`), an output, and optionally its own `actions`, viewports, and format.

#### 5. `setupTasks` Block (Sequential Preparation)

List of tasks that run sequentially before the main captures. Same structure as `tasks`, but with guaranteed ordered execution and abort on failure.

> [!IMPORTANT]
> **Security best practices**: The generated session file (`auth-session.json` in this example) contains active cookies and tokens from your account. **You must add this file to your `.gitignore`** to ensure it is never uploaded to the repository.

For a detailed reference on configuration, the CLI, and complete practical automation examples, see the following secondary guides:

- [Practical Capture Examples](./docs/english/examples/README.md)
- [Complete Configuration Guide](./docs/english/configuration.md)
- [CLI Commands Guide](./docs/english/commands.md)
- [Sequential Actions Catalog](./docs/english/actions.md)

## Installation

You can install **jshutter** globally on your system to have the binary ready in your terminal:

```bash
npm install -g jshutter
```

Or run it without prior installation in any project using `npx`:

```bash
npx jshutter run
```

> [!NOTE]
> During the first installation or run, Playwright will automatically download the minimum Chromium binaries needed to take screenshots.

### Authors

Developed and maintained by [Bruno Arias](https://github.com/ariasbruno). Any contribution, issue, or PR is welcome!

## License

This project is under the MIT license. See the [LICENSE](./LICENSE) file for more details.

---

<p align="center">
  <h1 align="center">📷️ jshutter</h1>
  <p align="center">
    <em>Automatizá capturas de páginas web con un solo archivo JSON</em>
  </p>
</p>
<p align="center">
  <a href="#english">English</a> · <b id="español">Español</b>
</p>

## Overview

**jshutter** es una CLI que estandariza la captura de pantallas web mediante un archivo de configuración JSON. En lugar de escribir scripts de automatización para cada sitio, declarás las páginas, resoluciones e interacciones necesarias en un solo archivo y ejecutás todo con `npx jshutter run`.

### Índice

- [Destacados](#destacados)
- [Inicio Rápido](#inicio-rápido)
- [Comandos del CLI y Flags](#comandos-del-cli-y-flags)
- [Configuración y Uso Avanzado](#configuración-y-uso-avanzado)
- [Instalación](#instalación)
- [Autor](#autor)
- [Licencia](#licencia)

## Destacados

- **Cero Código**: Definí todas tus capturas y flujos de interacción en un sencillo archivo `jshutter.json`.
- **IDE Autocomplete**: Validación de tipos e IntelliSense en tiempo real en tu IDE mediante **JSON Schema** integrado.
- **Preparación Secuencial**: Definí tareas previas ([`setupTasks`](docs/español/configuration.md#8-bloque-setuptasks-opcional)) de forma secuencial para cualquier preparación (autenticación, generación de datos, configuración de estado) antes de las capturas.
- **Persistencia de Sesión**: Guardá y cargá el estado de cookies/localStorage ([`storageState`](docs/español/configuration.md#opcionales-sobrescriben-los-valores-globales)) automáticamente para ejecutar capturas protegidas en paralelo sin repetir logins.
- **Aislamiento por Tarea**: Cada captura se ejecuta en un contexto de navegador (`BrowserContext`) independiente, libre de colisiones de cookies o sesiones.
- **Acciones Secuenciales**: Simulá interacciones reales (clics, formularios, scroll, espera de red o inyección de código) antes de capturar.
- **Macros Reutilizables**: Definí scripts de JS en archivos independientes y llamalos para evitar duplicación (ej. flujos de login comunes).
- **Reporte HTML Autónomo**: Generá un reporte HTML interactivo con las capturas y metadatos de ejecución.
- **AI-Friendly**: Descargá la skill oficial (`jshutter install-skill`) para que agentes de IA como Cursor o Copilot conozcan la gramática de jshutter y te ayuden a generar configuraciones.

## Inicio Rápido

Estandarizar tus capturas es tan simple como definir un archivo `./jshutter.json` en la raíz de tu proyecto para declarar las páginas que querés capturar:

```json
{
	"$schema": "./jshutter.schema.json",
	"global": {
		"baseOutputDir": "./screenshots",
		"viewport": ["mobile", "desktop-hd"]
	},
	"tasks": [
		{
			"id": "home",
			"url": "https://example.com",
			"output": "home.png"
		},
		{
			"id": "contact",
			"url": "https://example.com/contact",
			"output": "contact.png"
		}
	]
}
```

Y disparar la captura de todas las páginas (a pantalla completa y en múltiples resoluciones en paralelo) con un único comando:

```bash
npx jshutter run
```

## Comandos del CLI y Flags

A continuación se detalla la lista completa de comandos y banderas de consola admitidos por el CLI de **jshutter** a través del comando `npx jshutter`:

### Comandos Principales

| Comando                                                  | Descripción                                                                                                                       |
| :------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| [`run / r [config.json]`](#1-run-config)                 | Procesa y ejecuta el flujo de capturas declarado en la configuración. Busca `jshutter.json` por defecto si se omite el argumento. |
| [`init / i`](#2-init)                                    | Crea una carpeta `jshutter/` y escribe en ella una plantilla de configuración básica `jshutter.json`.                             |
| [`validate / v [config.json]`](#3-validate-config)       | Valida la sintaxis del JSON y la correctitud de las acciones declaradas.                                                          |
| [`install-skill / is`](#4-install-skill)                 | Instala la skill de jshutter para asistir el flujo con agentes de IA.                                                             |
| [`open-report / open / o [config.json]`](#5-open-report) | Abre el reporte interactivo HTML generado en tu navegador predeterminado.                                                         |
| `--help`                                                 | Muestra la ayuda general del CLI con todos los comandos y banderas disponibles.                                                   |
| `--version`                                              | Muestra la versión actual de **jshutter** instalada (alternativa: `-V`).                                                          |

### Banderas para el comando `run`

| Flag                  | Valor por Defecto | Descripción                                                                                     |
| :-------------------- | :---------------- | :---------------------------------------------------------------------------------------------- |
| `--headed`            | `false`           | Inicia el navegador de forma visible en la pantalla.                                            |
| `--verbose` o `-v`    | `false`           | Activa logs detallados que describen el inicio y fin de cada acción en tiempo real.             |
| `--silent`            | `false`           | Oculta toda la salida por consola (ideal para entornos silenciosos o CI/CD).                    |
| `--report <type>`     | `none`            | Formato del informe de resultados generado al terminar: `json`, `html`, `all` o `none`.         |
| `--dry-run`           | `false`           | Simula el recorrido mostrando una tabla de tareas asociadas sin lanzar navegadores.             |
| `--task <id>`         | `null`            | Filtra la ejecución para procesar únicamente la tarea que coincida con el ID provisto.          |
| `--tag <tag>`         | `null`            | Filtra la ejecución para procesar únicamente las tareas que contengan la etiqueta especificada. |
| `--browser <type>`    | `"chromium"`      | Motor de navegación de Playwright a utilizar: `chromium`, `firefox` o `webkit`.                 |
| `--parallel <number>` | `1`               | Límite máximo de navegadores ejecutándose de forma simultánea.                                  |
| `--force`             | `false`           | Omite advertencias de confirmación interactiva para ejecuciones masivas.                        |

> [!NOTE]
> Las opciones `--headed`, `--report` y `--parallel` también pueden definirse dentro del bloque `"global"` de la configuración `jshutter.json`. Los flags especificados en la CLI tienen precedencia absoluta y sobrescriben cualquier valor de la configuración.

### Detalle de los Comandos

#### 1. `run [config]`

**Alias**: `r`

Ejecuta la captura de todas las páginas declaradas en el archivo de configuración.

- **Resolución automática**: Si ejecutás `npx jshutter run` sin argumentos, buscará `./jshutter.json` en la raíz. Si no lo encuentra, buscará automáticamente en `./jshutter/jshutter.json`.
- **Uso de Alias (carpeta `jshutter/`)**: Si tenés múltiples configuraciones organizadas en la carpeta `./jshutter/`, podés ejecutarlas escribiendo únicamente su nombre, omitiendo la ruta y la extensión `.json`.
  - _Ejemplo_: `npx jshutter run ayari` buscará y ejecutará directamente `./jshutter/ayari.json`.
- **Ruta directa**: Podés indicar la ruta exacta de cualquier archivo JSON de configuración en tu disco.
  - _Ejemplo_: `npx jshutter run ./configuraciones/testing.json`.
- **Ejemplos de comandos comunes**:

  ```bash
  # Ejecuta el flujo básico por defecto
  npx jshutter run

  # Ejecuta la configuración jshutter/ayari.json en modo headed (visible)
  npx jshutter run ayari --headed

  # Filtra y corre solo la tarea con ID "contact" y genera el reporte HTML
  npx jshutter run ayari --task contact --report html
  ```

#### 2. `validate [config]`

**Alias**: `v`

Valida la sintaxis del JSON y comprueba la coherencia del archivo (selectores, viewports, macros) antes de abrir el navegador. Es una ejecución rápida.

- **Resolución**: Utilizá las mismas reglas de búsqueda inteligente que el comando `run` (admite alias sin ruta ni extensión, o archivos locales directos).
- **Ejemplos**:

  ```bash
  # Valida el config por defecto
  npx jshutter validate

  # Valida jshutter/ayari.json mediante alias
  npx jshutter validate ayari
  ```

#### 3. `init`

**Alias**: `i`

Inicializa la estructura base de **jshutter** en tu espacio de trabajo.

- **Comportamiento**: Creá la carpeta `jshutter/` y escribí dentro de ella una plantilla de configuración básica `jshutter.json`.
- **Contenido de la Plantilla**:
  - **Enlace de Esquema (`$schema`)**: Configurá la propiedad `$schema` apuntando al JSON Schema oficial en GitHub para habilitar instantáneamente la validación y autocompletado en tu IDE.
  - **Configuración Global**: Definí valores por defecto recomendados como la carpeta de salida (`baseOutputDir: "./output"`), viewports responsivos, retrasos y límites de tiempo.
  - **Tarea de Ejemplo**: Creá una tarea básica (`example-home`) dirigida a `https://example.com` con el preset `desktop-hd`.
- **Seguridad**: Si detecta que el archivo `./jshutter/jshutter.json` ya existe, solicitará confirmación interactiva en la consola (`y/N`) antes de realizar cualquier cambio para evitar que se sobrescriban tus configuraciones previas.
- **Ejemplo**:
  ```bash
  npx jshutter init
  ```

#### 4. `install-skill`

**Alias**: `is`

Instala la especificación del schema y la gramática de configuración (`SKILL.md`) a la raíz de tu workspace local (`.agents/skills/jshutter/`). Esto permite que agentes de IA como Cursor o Copilot conozcan las reglas de jshutter y te ayuden a generar configuraciones.

- **Ejemplo**:
  ```bash
  npx jshutter install-skill
  ```

#### 5. `open-report`

**Alias**: `open`, `o`

Buscá y abrí el reporte HTML interactivo (`jshutter-report.html`) en tu navegador de internet predeterminado.

- **Resolución de ruta**: Si se provee un archivo de configuración, el comando extrae la ruta del reporte de su propiedad `baseOutputDir`. Si no se provee configuración o no se encuentra el archivo, busca automáticamente en rutas comunes: `./output/jshutter-report.html`, `./jshutter/output/jshutter-report.html` y `./jshutter-report.html`.
- **Error**: Si no se encuentra ningún reporte en las rutas buscadas, el comando termina con un mensaje de error.
- **Plataforma**: Utiliza el comando nativo del sistema operativo para abrir archivos (`open` en macOS, `start` en Windows, `xdg-open` en Linux).
- **Ejemplos**:

  ```bash
  # Abre el reporte desde la configuración por defecto
  npx jshutter open-report

  # Abre el reporte usando una configuración específica
  npx jshutter open-report ayari
  ```

## Configuración y Uso Avanzado

Para aplicaciones complejas, **jshutter** te permite automatizar flujos interactivos completos (como inicios de sesión, manipulación de carrito de compras, inyección de variables, emulación de pantallas responsivas y reportes automáticos) mediante un sistema modular estructurado en bloques clave.

### Ciclo de Vida del Motor: setupTasks vs. tasks

La ejecución se divide en dos fases dinámicas diseñadas para sincronizar el estado sin perder paralelismo:

1. **Fase de Preparación (`setupTasks`)**: El motor ejecuta esta lista de tareas de forma **secuencial** (una tras otra) antes de iniciar la fase principal. Es ideal para cualquier preparación que deba ocurrir antes de las capturas: obtener datos del servidor, generar archivos temporales, configurar un estado, o realizar un inicio de sesión. Si cualquiera de estas tareas falla, se aborta toda la ejecución. Utilizá la propiedad `saveStorageState` para guardar cookies y `localStorage` en un archivo JSON (ej. `auth-session.json`) y reutilizar esa sesión en las capturas principales.
2. **Fase de Captura Concurrente (`tasks`)**: Una vez completado el setup, el motor ejecuta las tareas principales en paralelo. Si configurás `storageState` a nivel `global`, todas las tareas heredarán la sesión guardada y comenzarán pre-autenticadas en contextos de navegador independientes, previniendo colisiones de datos.

> **Nota**: Dado que cada tarea corre en un contexto de navegador independiente, el estado en tiempo de ejecución (ej: `localStorage`, variables de `window`) seteado en un `setupTask` no está disponible en `tasks`. Usá `saveStorageState`/`storageState` para persistencia de sesiones, e inliná las acciones de preparación directamente en las tareas que las necesiten.

---

### Bloques de Configuración

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

#### 1. Bloque `global` (Valores Heredables)

Definí los valores por defecto aplicados a todas las tareas si no se sobrescriben a nivel de tarea. Permite resolver la URL base (`baseUrl`), la carpeta de salida (`baseOutputDir`), viewports, formatos, delay, altura máxima de captura (`maxPageHeight`), nivel de paralelismo, acciones por defecto (`actions`) y tipo de reporte (`report`).

#### 2. Bloque `presets` (Resoluciones Reutilizables)

Diccionario para declarar nombres de resoluciones personalizadas (ej. `"custom-screen": {"width": 1440, "height": 900}`). **jshutter** incluye presets listos para usar como `mobile`, `tablet`, `desktop-hd` y `desktop-2k`. Si una tarea o global especifica un array de viewports (ej: `["mobile", "desktop-hd"]`), la tarea se expandirá automáticamente en ejecuciones individuales para cada resolución sin que sobrescriban sus salidas.

#### 3. Bloque `macros` (Modularización de Código)

Permite registrar scripts de JavaScript externos bajo un alias. En lugar de escribir lógica extensa inline en tu JSON, creás archivos `.js` y los invocás dentro del flujo de acciones de una tarea con `{ "type": "macro", "name": "mi-macro" }`.

#### 4. Bloque `tasks` (Capturas Principales)

Lista de tareas de captura que se ejecutan en paralelo después del setup. Cada tarea declara una URL, un identificador (`id`), una salida y opcionalmente sus propios `actions`, viewports y formato.

#### 5. Bloque `setupTasks` (Preparación Secuencial)

Lista de tareas que se ejecutan secuencialmente antes de las capturas principales. Misma estructura que `tasks`, pero con garantía de ejecución ordenada y aborto ante fallos.

> [!IMPORTANT]
> **Buenas prácticas de seguridad**: Si el archivo de sesión generado (`auth-session.json` en este ejemplo) contiene cookies y tokens activos de tu cuenta. **Debés añadir este archivo a tu `.gitignore`** para asegurar que nunca se suba al repositorio.

Para una referencia detallada sobre la configuración, el CLI y ver ejemplos prácticos completos de automatización, consulta las siguientes guías secundarias:

- [Ejemplos Prácticos de Capturas](./docs/español/examples/README.md)
- [Guía de Configuración Completa](./docs/español/configuration.md)
- [Guía de Comandos del CLI](./docs/español/commands.md)
- [Catálogo de Acciones Secuenciales](./docs/español/actions.md)

## Instalación

Podés instalar **jshutter** de forma global en tu sistema para tener el binario listo en tu terminal:

```bash
npm install -g jshutter
```

O ejecutarlo sin instalación previa en cualquier proyecto utilizando `npx`:

```bash
npx jshutter run
```

> [!NOTE]
> Durante la primera instalación o ejecución, Playwright descargará automáticamente los binarios mínimos de Chromium necesarios para capturar las pantallas.

### Autor

Desarrollado y mantenido por [Bruno Arias](https://github.com/ariasbruno). ¡Cualquier contribución, issue o PR es bienvenido!

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](./LICENSE) para más detalles.
