# ProdManager: UX Operating Guidelines & Lean Manufacturing UX Rules
> [!IMPORTANT]
> **Este documento es de carácter obligatorio y fundacional.**
> Cualquier nueva pantalla, cambio en los flujos operativos o evolución de la interfaz en ProdManager debe ser validado formalmente contra las reglas y restricciones aquí expuestas antes de ser aprobado para producción o fusionado en una Pull Request (PR).

---

## 1. Misión de ProdManager
**ProdManager no es un ERP tradicional de oficina ni un MES industrial complejo y pesado.**
Es un **"Sistema Operativo Táctico y Liviano para Talleres Modernos"**. 
Su interfaz se comporta como una herramienta industrial física: rápida, predecible, inmune a fallos de entorno y diseñada para optimizar los segundos del operario que tiene las manos ocupadas con herramientas reales.

---

## 2. La Regla Inquebrantable de los 3 Clics (Mobile Constraint)
> [!CAUTION]
> **¿La nueva funcionalidad requiere más de 3 clics del operador en mobile para completar un flujo frecuente?**
> * Si la respuesta es **SÍ**, el diseño es **INACEPTABLE** y debe ser rechazado.
> * Si la respuesta es **NO**, la integración es viable.

* **Fundamento**: En el taller, el operador móvil sostiene el celular con una mano y manipula piezas físicas con la otra. Obligarlo a navegar por menús desplegables extensos, múltiples ventanas emergentes o modales anidados incrementa la tasa de errores de asignación, genera frustración física y ralentiza el despacho final.

---

## 3. Patrones de Diseño UX por Perfil de Operador

### ⚡ A. El Operador Rápido (Mobile-First Extremo)
* **Paddings Interactivos**: Toda zona interactiva móvil debe tener dimensiones mínimas de **`44px x 44px`** (idealmente **`48px`**) de área útil para mitigar los toques accidentales de dedos mojados, cansados o con guantes.
* **Prohibición de Drag & Drop Táctil**: El arrastre de tarjetas en pantallas pequeñas es errático y engorroso. El cambio de estado debe realizarse exclusivamente a través de botones rápidos contextuales de **1-Tap** (ej. *"Mover a Proceso"*).
* **Acción sin Diálogos**: Las transiciones exitosas no deben requerir popups de confirmación intrusivos. Las operaciones rápidas deben disparar animaciones sutiles y confirmaciones discretas no-bloqueantes.
* **Memoria Contextual Persistente**: Usar `localStorage` para recordar la última máquina, el último material y el último peso configurados con éxito. El siguiente flujo idéntico debe auto-completar estas variables para lograr una operación de **cero selecciones redundantes**.

### 🔍 B. El Operador Detallista (Tablet / PC / Puesto de Control)
* **Alta Densidad y Fluidéz**: En pantallas mayores a 10 pulgadas, habilitar el Drag & Drop interactivo con físicas fluidas de transición (CSS duration `700ms` a `1000ms`).
* **Visualización de Progreso**: Presentar barras de progreso porcentuales en tiempo real para las piezas, control de mermas y tiempos estimados de entrega para agilizar el despacho de presupuestos y control de calidad.
* **Acceso Directo**: Proveer atajos rápidos de edición sobre la tarjeta para evitar que el operario tenga que saltar de página en página perdiendo el contexto de la matriz de operaciones general.

---

## 4. Estándares de Ergonomía Visual y Scanning Óptico
* **Scanning Cromático Automático**: Para evitar que el operador tenga que leer texto fino de IDs o clientes, las tarjetas deben poseer un borde visual de color dinámico derivado de un hash matemático de su código de pedido original. Ítems del mismo pedido comparten el mismo color, facilitando la agrupación cognitiva instantánea.
* **Preservación de Densidad Contextual**:
  * **Vista Compacta**: Oculta texto descriptivo redundante y comprime la información al código de pedido, impresora y proporción de piezas listas. Diseñada para paneles con alta concurrencia diaria.
  * **Vista Detallada**: Muestra el material exacto, mermas registradas, y barras de progreso activas.

---

## 5. Resiliencia y Observabilidad Silenciosa ante Fallos del Entorno
* **Pill de Conectividad Estético**:
  * `ONLINE`: Pill verde estático y de baja luminosidad.
  * `OFFLINE`: Pill rojo con animación de pulso lento (`animate-pulse`). No bloquea el uso del Kanban; advierte al operario con respeto visual.
* **Reconexión Silenciosa (Silent-Sync)**: Al recuperar red (`window:online`), gatillar refrescos en segundo plano para restaurar el estado más fresco sin recargar la página ni congelar el cursor físico del usuario.
* **Auditoría de Frustración Humana**: Recolectar de forma silenciosa métricas de telemetría ante comportamientos erráticos (ej. `EXCESSIVE_SCROLL_DETECTED` ante scroll horizontal excesivo en menos de 300ms, sugiriendo sobrecarga visual en pantallas móviles).

---

## 6. Onboarding y Revisiones de Código (PR Checklist)
Antes de aprobar cualquier cambio al repositorio de ProdManager, el revisor debe verificar:
1. [ ] ¿Respeta el límite estricto de **3 clics** para flujos táctiles móviles frecuentes?
2. [ ] ¿Las áreas táctiles interactuables móviles tienen al menos **44px**?
3. [ ] ¿Se previene el Drag & Drop táctil secundario en móviles usando botones de 1-Tap?
4. [ ] ¿El diseño es limpio, con tipografía editorial legible y libre de modales anidados?
5. [ ] ¿Se utiliza la persistencia contextual de LocalStorage para evitar selecciones repetitivas?
6. [ ] ¿La interfaz sigue siendo responsiva y no bloquea al operador en situaciones offline?
