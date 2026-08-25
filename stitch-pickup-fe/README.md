# StitchPickupFe

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
# o npm run start
```

Once the server is running, open your browser:

### 🌐 Rutas de Acceso (URLs)

* **Padres:** 👉 [http://localhost:4200/auth/login](http://localhost:4200/auth/login) (o [http://localhost:4200/](http://localhost:4200/))
  * *Credenciales Demo:* `padre1@iit.edu.mx` / `demo1234`
* **Maestros / Admin:** 👉 [http://localhost:4200/auth/maestros](http://localhost:4200/auth/maestros)
  * *Admin Demo:* `admin@iit.edu.mx` / `admin2026`
  * *Maestro Demo:* `maestro1@iit.edu.mx` / `demo1234`

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 📜 Decisiones de Arquitectura (ADR)

### ADR-001: JWT Stateless & Role Separation
El Frontend almacena tokens en `localStorage` con interceptor HTTP centralizado y redirección según rol (`/portal`, `/monitor`, `/admin`).

### ADR-002: Offline-First con IndexedDB
Las alertas generadas se almacenan en IndexedDB localmente si se pierde conexión y se procesan automáticamente al restablecer conectividad.

### ADR-003: WebSocket STOMP sobre SockJS
Recepción en tiempo real de proximidad y cambios de estado con reconexión automática de 5 segundos.

### ADR-004: Paginación en Tablas de Administración & Loading Overlay Bloqueante
- **Paginación Dinámica:** Las vistas de administración (`Alumnos`, `Padres`, `Maestros`) cuentan con paginador reactivo con selección de **15, 30 y 100** elementos por página, navegación por páginas y salto directo a extremos. El buscador y filtros de nivel resetean automáticamente a la página 1.
- **Bloqueo de Pantalla (Screen Blocker):** Durante operaciones asíncronas de guardado, edición, borrado o importación CSV, se activa un componente overlay modal con `backdrop-filter: blur` y animación de spinner que bloquea la interacción en pantalla para evitar dobles envíos y garantizar idempotencia.
- **Loading en Grids:** Barra de carga superior (`.table-loading-bar`) dentro de cada tarjeta de tabla mientras se reciben datos del backend.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
