# Ejemplos de Configuración de jshutter

A continuación se presentan plantillas de configuración optimizadas para diferentes escenarios de automatización.

---

## 1. Landing Page Simple
Toma una captura de una página estática o landing page a una resolución por defecto.

```jsonc
{
	// Configuración global (heredada por todas las tareas)
	"global": {
		"baseOutputDir": "./screenshots", // Directorio raíz donde se guardarán los resultados
		"viewport": { // Resolución por defecto para las capturas
			"width": 1920,
			"height": 1080
		},
		"fullPage": true // Habilita la captura de página completa (alto total scrollable)
	},
	// Lista de páginas individuales que se van a capturar
	"tasks": [
		{
			"id": "landing-home", // Identificador único de la tarea
			"url": "https://example.com/", // URL de destino de la captura
			"output": "landing/home.png" // Nombre del archivo de salida (guardado en screenshots/landing/home.png)
		}
	]
}
```

### Resultado devuelto:
*	**`screenshots/landing/home.png`**: Una captura a pantalla completa (`fullPage: true` heredado) de la página de inicio con resolución `1920x1080` (desktop-hd).

---

## 2. Captura Responsiva (Multi-Viewport)
Ejecuta la captura de una misma página en diferentes resoluciones.

```jsonc
{
	"global": {
		"baseOutputDir": "./screenshots/responsive" // Directorio de salida global
	},
	"tasks": [
		{
			"id": "home-capture",
			"url": "https://example.com/",
			// Lista de viewports en formato array. 
			// El motor expandirá esta tarea automáticamente generando una captura por cada resolución.
			"viewport": ["desktop-hd", "tablet", "mobile"],
			"output": "home.png" // Los nombres resultantes tendrán sufijos (ej: home-mobile.png)
		}
	]
}
```

### Resultado devuelto:
El motor expande automáticamente la tarea por cada viewport provisto y genera:
*	**`screenshots/responsive/home-desktop-hd.png`**: Captura a resolución `1920x1080`.
*	**`screenshots/responsive/home-tablet.png`**: Captura a resolución `768x1024`.
*	**`screenshots/responsive/home-mobile.png`**: Captura a resolución `375x812`.

---

## 3. Inicio de Sesión y Dashboard (Autenticación Avanzada)
Ejecuta una tarea inicial secuencial de inicio de sesión, guarda las cookies y localStorage en un archivo JSON, y luego reutiliza dicho estado para capturar múltiples páginas protegidas en paralelo sin repetir los pasos de autenticación.

```jsonc
{
	"global": {
		"baseOutputDir": "./screenshots", // Directorio de salida
		"viewport": "desktop", // Resolución heredada (1280x720)
		"storageState": "auth-session.json", // Archivo del cual las tareas heredarán el estado de sesión
		"baseUrl": "https://example.com" // URL base para resolver URLs relativas
	},
	// setupTasks se ejecutan secuencialmente (una tras otra) antes que las tareas principales
	"setupTasks": [
		{
			"id": "initial-login",
			"url": "/login", // Resuelto contra baseUrl como https://example.com/login
			"output": "secure/login-success.png",
			"saveStorageState": "auth-session.json", // Guarda las cookies/localstorage resultantes tras terminar
			"actions": [
				{
					"type": "fill_form", // Rellena el formulario de autenticación
					"fields": [
						{ "selector": "#email", "value": "$env.JSHUTTER_USER", "clear": true }, // Resoluciones dinámicas de entorno
						{ "selector": "#password", "value": "$env.JSHUTTER_PASSWORD" }
					]
				},
				{
					"type": "click", // Envía el formulario haciendo clic en el botón de submit
					"selector": "button[type='submit']"
				},
				{
					"type": "wait_navigation" // Espera a que la navegación de redirección concluya
				}
			]
		}
	],
	// tasks principales se ejecutan en paralelo compartiendo la sesión cargada
	"tasks": [
		{
			"id": "dashboard-privado",
			"url": "/dashboard", // Se ejecuta pre-autenticado con cookies de auth-session.json
			"output": "secure/dashboard.png"
		},
		{
			"id": "user-profile",
			"url": "/profile", // Se ejecuta pre-autenticado con cookies de auth-session.json
			"output": "secure/profile.png"
		}
	]
}
```

### Resultado devuelto:
*	**`auth-session.json`**: Archivo serializado en la raíz conteniendo las cookies de sesión y el almacenamiento local generados en el login de preparación.
*	**`screenshots/secure/login-success.png`**: Captura secuencial de éxito tras rellenar y enviar el formulario de login.
*	**`screenshots/secure/dashboard.png`**: Captura del panel principal de usuario (cargada con el estado de sesión `auth-session.json`).
*	**`screenshots/secure/profile.png`**: Captura del perfil privado de usuario (cargada con el estado de sesión `auth-session.json`).

> [!IMPORTANT]
> **Directiva de IA - Protección de sesión**: Siempre que generes o sugieras configurar el guardado de datos de sesión (`saveStorageState`), debes **agregar automáticamente la ruta del archivo JSON al `.gitignore` del proyecto** (si no está ya presente) y notificar explícitamente al usuario sobre esta acción para garantizar la seguridad de sus credenciales.

---

## 4. Secuencia Multi-Página (E-commerce)
Agrega un artículo al carrito en la primera página de producto, navega a otra sección para agregar otro artículo, y finalmente toma una captura de la sección de checkout. Las cookies y variables de sesión se mantienen activas durante la secuencia de la tarea.

```jsonc
{
	"tasks": [
		{
			"id": "complete-shopping-cart",
			"url": "https://example.com/products/sports-shoes", // Primer producto
			"viewport": "desktop-hd",
			"output": "checkout/final_cart.png",
			// Acciones secuenciales ejecutadas dentro del mismo contexto/sesión de pestaña
			"actions": [
				{
					"type": "click", // Añade el primer producto al carrito
			"selector": ".btn-add-to-cart",
				"optional": true // No detiene la tarea si el botón no está presente
				},
				{
					"type": "navigate", // Navega a la página del segundo producto en la misma pestaña
					"url": "https://example.com/products/cotton-tshirt"
				},
				{
					"type": "click", // Añade el segundo producto
			"selector": ".btn-add-to-cart",
				"optional": true
			},
			{
				"type": "navigate", // Navega a la pasarela final de checkout
				"url": "https://example.com/cart"
				},
				{
					"type": "wait_selector", // Espera a que el total del carrito cargue antes del screenshot final
					"selector": ".cart-summary"
				}
			]
		}
	]
}
```

### Resultado devuelto:
*	**`screenshots/checkout/final_cart.png`**: Captura final tomada al concluir la secuencia de interacciones. La imagen reflejará el estado final acumulado (ambos productos añadidos al carrito gracias a que la sesión persistió a lo largo de las navegaciones secuenciales de la tarea).

---

## 5. Carga Perezosa (Lazy-Loading) y Capturas Intermedias
Desplaza la ventana hacia abajo suavemente para forzar la carga de imágenes, tomando capturas intermedias en distintas posiciones.

```jsonc
{
	"tasks": [
		{
			"id": "lazy-loading-check",
			"url": "https://example.com/products",
			"viewport": "desktop-hd",
			"output": "lazy_load/final_scroll.png", // Captura de pantalla completa resultante final
			"actions": [
				{ "type": "scroll", "value": "down" }, // Desplazamiento inicial
				{ "type": "wait", "value": 500 }, // Espera a que el contenido cargue tras el scroll
				{ "type": "screenshot", "output": "lazy_load/step_1.png" }, // Captura intermedia
				{ "type": "scroll", "value": "down" }, // Segundo desplazamiento
				{ "type": "wait", "value": 500 },
				{ "type": "screenshot", "output": "lazy_load/step_2.png" }, // Segunda captura intermedia
				{ "type": "scroll", "value": "up" }, // Sube al tope de nuevo
				{ "type": "wait", "value": 200 }
			]
		}
	]
}
```

### Resultado devuelto:
*	**`screenshots/lazy_load/step_1.png`**: Captura intermedia tomada tras el primer scroll down (primeras imágenes cargadas).
*	**`screenshots/lazy_load/step_2.png`**: Captura intermedia tomada tras el segundo scroll down (contenido inferior forzado a renderizar).
*	**`screenshots/lazy_load/final_scroll.png`**: Captura final a pantalla completa tras concluir todo el ciclo de scroll y volver hacia arriba.

---

## 6. Uso de Macros Externas e Inyección de localStorage (Avanzado)
Evita inyectar bloques JavaScript inline registrándolos como macros externas reutilizables. Oculta popups y banners de forma limpia y escribe datos en el almacenamiento local del navegador.

```jsonc
{
	"global": {
		"actions": [
			{ "type": "macro", "name": "close_warning" } // Macro global: se ejecuta siempre antes que las acciones de la tarea
		]
	},
	// Mapeo de alias a archivos JavaScript con scripts personalizados
	"macros": {
		"close_warning": "./macros/close-warning.js",
		"inject_favorites": "./macros/add-to-favorites.js"
	},
	"tasks": [
		{
			"id": "product-favorites",
			"url": "https://example.com/products",
			"output": "store/favorites.png",
			"actions": [
				{
					"type": "hide", // Oculta modales, overlays o banners molestos de cookies
					"selector": ".banner-cookies, [role='dialog']"
				},
				{
					"type": "macro", // Llama a la macro asociada al alias registrado
					"name": "inject_favorites"
				},
				{
					"type": "set_storage", // Inyecta variables/claves directamente al localStorage del navegador
					"key": "has_dismissed_offer",
					"value": true
				},
				{
					"type": "wait",
					"value": 500
				}
			]
		}
	]
}
```

### Código de ejemplo de las Macros:

#### 1. Macro `close_warning` (`./macros/close-warning.js`)
```javascript
// Oculta modales molestos y banners de cookies para tomar la captura limpia
const banners = document.querySelectorAll(".banner-cookies, [role='dialog']");
banners.forEach(el => {
	el.style.display = "none";
});
```

#### 2. Macro `inject_favorites` (`./macros/add-to-favorites.js`)
```javascript
// Simula agregar productos a favoritos marcando los corazones en el DOM
const heartIcons = document.querySelectorAll(".heart-icon");
heartIcons.forEach((btn, index) => {
	if (index < 2) {
		btn.classList.add("active");
		btn.setAttribute("aria-checked", "true");
	}
});
```

### Resultado devuelto:
*	**`screenshots/store/favorites.png`**: Captura limpia de la sección de productos, libre de banners de cookies o popups de diálogos gracias al selector `hide` y con los favoritos activos inyectados a nivel de localStorage.

---

## 7. Personalización Visual y del Contexto (Modo Oscuro, Formato JPEG y User-Agent)
Ajusta de forma granular el entorno de ejecución del navegador emulando un esquema de color oscuro, exportando la captura en formato JPEG comprimido para optimizar almacenamiento y modificando la cabecera `User-Agent` junto con límites de tiempo personalizados.

```jsonc
{
	"tasks": [
		{
			"id": "landing-dark-mode",
			"url": "https://example.com",
			"viewport": "desktop-hd",
			"output": "store/dark_home.jpg",
			"colorScheme": "dark", // Emula preferencia de esquema de color de tema oscuro
			"format": "jpeg", // Formato alternativo JPEG comprimido
			"quality": 75, // Ajusta la calidad de compresión (0-100)
			"timeout": 15000, // Ajusta el timeout máximo de ejecución para esta tarea (15 segundos)
			"userAgent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" // Emula User-Agent personalizado
		}
	]
}
```

### Resultado devuelto:
*	**`screenshots/store/dark_home.jpg`**: Captura de la página principal emulando un esquema de color oscuro, guardada en formato JPEG con calidad del 75% (ideal para archivos ligeros), ejecutada bajo un User-Agent de Googlebot y con un límite de tiempo máximo de 15 segundos.

---

## 8. Inyección de Datos en localStorage / sessionStorage
Utiliza `set_storage` con `storageType` para inyectar datos que el JavaScript del sitio lee para renderizar la UI. Nota: como las acciones se ejecutan **después** de que la página carga, es necesario re-navegar después de `set_storage` para que la página lea los datos inyectados durante su render inicial.

```jsonc
{
	"global": {
		"baseOutputDir": "./screenshots"
	},
	"setupTasks": [
		{
			"id": "login",
			"url": "https://example.com/login",
			"actions": [
				{ "type": "fill_form", "fields": [
					{ "selector": "#email", "value": "$env.USER_EMAIL" },
					{ "selector": "#password", "value": "$env.USER_PASSWORD" }
				]},
				{ "type": "click", "selector": "button[type=submit]" },
				{ "type": "wait_navigation" }
			],
			"saveStorageState": "./auth.json" // Guarda cookies + localStorage tras login exitoso
		}
	],
	"tasks": [
		{
			"id": "dark-dashboard",
			"url": "https://example.com/dashboard",
			"output": "dashboard/custom.png",
			"storageState": "./auth.json", // ← Carga cookies + localStorage del login previo
			"actions": [
				{
					"type": "set_storage",
					"key": "ui_theme",
					"value": "dark",
					"storageType": "local" // ← El sitio lee ui_theme de localStorage
				},
				{
					"type": "set_storage",
					"key": "sidebar_collapsed",
					"value": "true",
					"storageType": "session" // ← El sitio lee sidebar_collapsed de sessionStorage
				},
				{
					"type": "navigate",
					"url": "https://example.com/dashboard" // ← Re-navega para que el JS lea los datos inyectados
				},
				{ "type": "wait", "value": 500 }
			]
		}
	]
}
```

### Resultado devuelto:
*	**`screenshots/dashboard/custom.png`**: Captura del dashboard autenticado (cookies del login) con tema oscuro y sidebar colapsado, inyectados directamente en el almacenamiento del navegador.
