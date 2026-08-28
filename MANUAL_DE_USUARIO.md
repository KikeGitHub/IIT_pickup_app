# 📘 Manual de Usuario y Guía de Pruebas — IIT Pickup
**Instituto Inglés de Toluca**  
*Plataforma de Logística y Seguridad en la Entrega de Alumnos*  
**Versión:** 1.0 (Fase de Pruebas Piloto)  
**Enlace de Acceso:** [https://pickup.institutoingles.edu.mx](https://pickup.institutoingles.edu.mx)

---

## 🌟 1. Introducción
**IIT Pickup** es una solución tecnológica diseñada para agilizar y hacer 100% segura la logística de salida y entrega de alumnos en el Instituto Inglés de Toluca. Mediante alertas en tiempo real, sincronización WebSocket y notificaciones instantáneas, conecta a los **Padres de Familia**, **Docentes en aula** y **Personal de Puerta / Guardia**.

---

## 📱 2. Instalación de la App en tu Celular (PWA)
No es necesario descargarla desde App Store o Play Store. La aplicación web se instala directamente en la pantalla de inicio de cualquier teléfono móvil:

### 🤖 En Android (Google Chrome):
1. Abre [https://pickup.institutoingles.edu.mx](https://pickup.institutoingles.edu.mx) en Chrome.
2. Toca el botón azul **`📲 Instalar App IIT Pickup`** que aparece en el banner superior.
3. Confirma la instalación. El icono del colegio se creará en tu pantalla de inicio y se abrirá a pantalla completa.

### 🍏 En iPhone / iPad (Safari):
1. Abre [https://pickup.institutoingles.edu.mx](https://pickup.institutoingles.edu.mx) en Safari.
2. Toca el botón **Compartir** de Safari (icono **`⎋`** o **`⬆`** en la barra inferior).
3. Desliza hacia abajo y selecciona **`➕ Agregar a la pantalla de inicio`**.
4. Toca **`Agregar`** en la esquina superior derecha.

---

## 🔑 3. Cuentas de Acceso para Pruebas

| Perfil | URL de Acceso | Formato de Usuario | Contraseña por Defecto |
| :--- | :--- | :--- | :--- |
| **👨‍👩‍👧 Padre de Familia** | `/auth/login` | Inicial Nombre + Apellido Paterno *(ej. `SCEJA`, `IDELACRUZ`, `YMATEO`)* | `IIT2026` |
| **🧑‍🏫 Docente / Monitor** | `/auth/maestros` | Inicial Nombre + Apellido Paterno *(ej. `EALVA`, `OANGELES`, `ZALVA`)* | `IIT2026` |
| **🛡️ Administrador** | `/auth/maestros` | `admin@iit.edu.mx` | `admin2026` |

> [!NOTE]
> Todos los usuarios ya están precargados en la base de datos con la matrícula real del colegio.

---

## 👨‍👩‍👧 4. Guía del Portal de Padres de Familia

### Paso 1: Inicio de Sesión
1. Ingresa a [https://pickup.institutoingles.edu.mx](https://pickup.institutoingles.edu.mx) (o abre la App instalada).
2. Escribe tu usuario (ej. `SCEJA`) y tu contraseña `IIT2026`.
3. Haz clic en **Ingresar al Portal**.

### Paso 2: Selección del Hijo
* Si tienes más de un hijo inscrito en el colegio, verás las pestañas superiores con el nombre de cada uno (ej. `[ L ] Leonardo` y `[ J ] Juan Pablo`). Toca la pestaña del alumno al que deseas recoger.

### Paso 3: Modo de Recogida
* Selecciona cómo vas a recoger a tu hijo:
  - 🚗 **En Automóvil (Fila de autos)**
  - 🚶‍♂️ **A pie (Peatonal / Puerta principal)**

### Paso 4: Enviar Alerta de Proximidad
A medida que te acerques al colegio, presiona el botón correspondiente:
* 🕐 **`10 MIN` (A 10 minutos):** Notifica al maestro para que el alumno empiece a guardar sus útiles.
* ⏱ **`5 MIN` (A 5 minutos):** El alumno es enviado a la zona de espera de entrega.
* 🚗 **`¡YA ESTOY EN FILA!`:** Se activa en color azul prioritario para que el guardia localice al alumno de inmediato en puerta.
* 🚨 **`LLEGADA URGENTE`:** Caso especial de emergencia o salida justificada.

### Paso 5: Confirmación de Entrega
* Cuando el maestro entregue al alumno en la puerta, tu pantalla se actualizará automáticamente a **"Alumno Entregado en Puerta"** y recibirás una notificación de audio y vibración.
* Presiona **`Confirmar Recepción`** para validar que tu hijo ya está contigo.

---

## 🧑‍🏫 5. Guía del Portal de Docentes y Monitores de Salida

### Vista 1: 🔔 Monitor en Vivo de Entregas
Diseñado para proyectarse en pantallas de salones, tablets de guardia o celulares de maestros:

1. **Recepción Automática de Alertas:**
   - La pantalla se actualiza en tiempo real vía WebSocket con sonido institucional al recibir avisos de padres.
   - Las tarjetas se ordenan por urgencia:
     - 🚨 **URGENTE** (Rojo)
     - 🚗 **EN FILA** (Azul)
     - ⏱ **5 MIN** (Ámbar)
     - 🕐 **10 MIN** (Gris azulado)
2. **Filtro por Nivel:**
   - Puedes filtrar las alertas por **Kinder**, **Primaria**, **Secundaria** o ver **Todos los Niveles**.
3. **Despachar Alumno (Entrega en Puerta):**
   - Cuando el alumno sale hacia el auto/tutor, el maestro o guardia presiona **`🚗 Despachar Alumno`**.
   - La tarjeta desaparece instantáneamente de todos los monitores del colegio y el padre es notificado al segundo.

### Vista 2: 👥 Mis Grupos & Alumnos Asignados
Permite a cada maestro consultar a sus alumnos y verificar quiénes tienen autorización para recogerlos:

1. **Panel de Filtros en Cascada:**
   - Selecciona el Nivel (`Kinder`, `Primaria`, `Secundaria`).
   - Selecciona el Grado (`1o. de Primaria`, `2o. de Primaria`, etc.).
   - Selecciona el Salón activo en el menú desplegable o usa las flechas **`◀ Anterior`** y **`Siguiente ▶`**.
2. **Buscador Rápido:**
   - Escribe el nombre o CURP en la barra de búsqueda para filtrar la lista al instante.
3. **Verificación de Tutores Autorizados:**
   - Cada alumno muestra sus tutores registrados (Madre, Padre, Abuelos) con sus números de contacto.
4. **Editar Alumno y Fotografía:**
   - Toca el botón **`✏️ Editar`**.
   - Puedes corregir el nombre, fecha de nacimiento, sexo, CURP y **cargar una fotografía real del alumno** desde la cámara o galería de tu teléfono.

---

## 🛡️ 6. Guía del Módulo de Administración

Acceso exclusivo para directores, coordinadores y personal administrativo:

1. **📊 Dashboard de Indicadores (KPIs):**
   - Tiempos promedio de entrega (desde que el padre avisa hasta que el alumno sube al auto).
   - Volumen de entregas completadas en el día.
   - Gráfica de horas pico de salida.
2. **🎓 Gestión de Alumnos y Tutores (`Alumnos & Tutores`):**
   - Búsqueda general por nombre, CURP, nivel o grupo con filtros en cascada.
   - Alta de nuevos alumnos, asignación de salón y vinculación de familiares autorizados con teléfono.
3. **🧑‍🏫 Gestión de Maestros (`Docentes`):**
   - Alta de maestros, asignación de salones/grados a su cargo y reseteo de contraseñas.
4. **🏫 Configuración de Salones y Grupos (`Grupos Escolares`):**
   - Creación y activación de grupos por ciclo escolar.

---

## 🧪 7. Guía de Pruebas Recomendadas (Casos de Uso)

Para el equipo de pruebas del colegio, se recomienda ejecutar los siguientes escenarios:

### Escenarios Clave a Validar:
- [ ] **Caso 1:** El Padre manda alerta de `5 MIN` y luego cambia a `EN FILA` → La tarjeta del monitor debe cambiar de color y estado en tiempo real.
- [ ] **Caso 2:** Dos maestros o un administrador tienen abierto el monitor al mismo tiempo → Al despachar un alumno, la tarjeta debe eliminarse en todas las pantallas sin recargar.
- [ ] **Caso 3:** Maestro entra a *Mis Grupos* → Cambia de salón usando el selector o las flechas `◀` `▶` y sube la foto de un alumno desde su celular.
- [ ] **Caso 4:** Instalar la aplicación como PWA en un teléfono Android e iPhone y verificar el icono en pantalla de inicio.

---

## 📞 8. Soporte y Retroalimentación
Cualquier duda, observación o sugerencia durante la prueba piloto puede ser reportada directamente al área de sistemas del Instituto Inglés de Toluca.
