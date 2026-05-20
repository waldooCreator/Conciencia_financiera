# Design Spec: Finanzas Personales

## 1. Arquitectura del Sistema
* **Frontend:** React Native (Expo, PWA responsiva offline-first).
* **Backend:** Python con Django REST Framework (Arquitectura modular).
* **Base de Datos:** PostgreSQL.
* **Infraestructura:** Contenedores aislados en Docker Compose.

## 2. Modelado de Datos (Django ORM)
* **User:** Modelo estándar de autenticación.
* **Wallet:** Almacena `id`, `user_id`, `name`, `type` (efectivo, débito, crédito), `balance`, `credit_limit` y `billing_cycle`.
* **Transaction:** Registra `id`, `wallet_id`, `amount`, `type` (ingreso, gasto), `date` y `installments` para manejo de cuotas.
* **SavingsGoal:** Controla `id`, `user_id`, `target_amount` y `current_amount`.

## 3. UI/UX y Design Tokens (Fricción Cero)
Las clases utilitarias (NativeWind/Tailwind) deben respetar estrictamente esta paleta:
* **NOIR (`#030706`):** Para textos principales y fondos oscuros (`bg-noir`, `text-noir`).
* **DENIM (`#20394a`):** Para tarjetas y contenedores secundarios (`bg-denim`).
* **BONE (`#f9f5ed`):** Fondo raíz de la PWA y `SafeAreaView` (`bg-bone`).
* **STEEL (`#6196aa`):** Acentos y botones secundarios (`bg-steel`).
* **CONCRETE (`#c9ccc3`):** Bordes y placeholders (`border-concrete`, `text-concrete`).

## 4. Estructura de Componentes Atómicos
* **PrimaryButton:** Usa `Pressable` con `bg-noir`, `text-bone` y animación de escala (`scale-95`) al presionar.
* **TransactionCard:** Contenedor `bg-denim` con bordes muy redondeados (`rounded-2xl`).
* **FormInput:** Fondo translúcido sobre `bg-bone` con borde activo en `border-steel`.

## 5. Estrategia Offline (Sincronización)
* **Almacenamiento Local:** Uso de `AsyncStorage` para persistencia temporal de transacciones en la PWA.
* **Cola de Red:** Lógica de reintento para enviar peticiones `POST` a Django cuando retorne la conexión.
