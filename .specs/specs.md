# Spec: Aplicación de Finanzas Personales

## 1. Visión General
Aplicación orientada a la gestión y conciencia financiera personal. Su objetivo es permitir a los usuarios registrar ingresos y gastos de manera rápida (fricción cero), gestionar múltiples medios de pago (incluyendo el cálculo complejo de tarjetas de crédito) y visualizar KPIs claros sobre sus hábitos de consumo y metas de ahorro. 

## 2. Experiencia de Usuario (UX) e Interfaz (UI)
* **Onboarding (OOBE):** Experiencia de primer uso inmersiva "estilo Apple". Configuración paso a paso con animaciones fluidas para definir sueldo (opcional), gastos fijos, medios de pago iniciales y meta de ahorro.
* **Fricción Cero:** Tras el onboarding, la vista principal por defecto al abrir la PWA será siempre "Registrar Gasto" para agilizar la captura de datos en el día a día.
* **Navegación:** *Bottom Navigation Bar* para cambiar entre Registro, Dashboard, Cuentas y Configuración.
* **Paleta de Colores Estricta:**
    * NOIR: `#030706` (Texto principal, fondos oscuros)
    * DENIM: `#20394a` (Elementos secundarios, tarjetas)
    * BONE: `#f9f5ed` (Fondo principal, texto en modo oscuro)
    * STEEL: `#6196aa` (Acentos, botones secundarios)
    * CONCRETE: `#c9ccc3` (Bordes, placeholders, elementos deshabilitados)

## 3. Arquitectura y Stack Tecnológico
* **Frontend:** React Native administrado a través de Expo.
    * **Despliegue:** Configurado principalmente como PWA (Progressive Web App) responsiva para uso en navegadores web móviles/desktop, con soporte *offline-first*.
* **Backend:** Python con el framework Django (Arquitectura Modular/Django REST Framework).
* **Base de Datos:** PostgreSQL.
* **Infraestructura Local:** Orquestado mediante `docker-compose.yml` (Postgres + Django + Redis/Celery si aplica).
* **Autenticación:** Correo electrónico y contraseña (estándar JWT).

## 4. Reglas de Negocio Clave
### 4.1. Sincronización Offline (PWA)
* Si el usuario registra un gasto sin conexión, la PWA debe guardar el `payload` localmente (usando `AsyncStorage` o IndexedDB vía PWA).
* Se implementará un *Service Worker* (o lógica de cola en el estado global) que reintente el envío de los datos al backend de Django una vez se recupere la conexión de red.

### 4.2. Gestión de Medios de Pago
* **Tipos Soportados:** Efectivo, Cuenta Bancaria, Tarjeta de Crédito.
* **Lógica de Tarjeta de Crédito:** Un gasto con tarjeta de crédito no solo resta saldo disponible, sino que genera una "Deuda". 
    * Debe soportar el ingreso de compras a **cuotas** (meses).
    * El backend debe calcular la deuda total y la cuota mensual proyectada para el mes actual, separándolo del gasto líquido.
    * Debe existir un flujo para registrar un "Pago de Tarjeta" (transferencia de una Cuenta Bancaria a la Tarjeta de Crédito).

### 4.3. Ingresos Flexibles
* El sueldo inicial es opcional (pensado para *freelancers*).
* Se pueden registrar "Ingresos Extra" en cualquier momento, los cuales sumarán al saldo del medio de pago seleccionado.

## 5. Modelado de Datos (Entidades Principales)
1.  **User:** `id`, `email`, `password_hash`, `created_at`.
2.  **Account/Wallet:** `id`, `user_id`, `name` (ej. RappiCard), `type` (cash, debit, credit), `balance`, `credit_limit` (nullable), `billing_cycle_date` (nullable).
3.  **Category:** `id`, `user_id`, `name` (ej. Hormiga, Imprevisto, Fijo), `color_hex`.
4.  **Transaction:** `id`, `account_id`, `category_id`, `amount`, `type` (income, expense, transfer), `installments` (default 1), `date`, `is_synced` (boolean local).
5.  **SavingsGoal:** `id`, `user_id`, `target_amount`, `current_amount`, `deadline` (nullable).

## 6. Dashboard y KPIs
El sistema debe calcular y exponer los siguientes indicadores (con capacidad de filtrar por mes natural o ciclo de facturación personalizado):
1.  **Progreso de Meta de Ahorro:** Porcentaje completado vs. meta establecida.
2.  **Gasto por Categoría vs. Mes Anterior:** Gráfico comparativo para identificar aumentos en rubros específicos.
3.  **Distribución por Medio de Pago:** Cuánto se ha gastado con cada cuenta/tarjeta en el periodo actual.
4.  **Proyección de Deuda:** Sumatoria de cuotas de tarjeta de crédito a pagar en el corte actual. 
