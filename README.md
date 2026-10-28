<p align="center"><img src="docs/readme/banner.svg" width="100%" alt="Conciencia Financiera: pixel-art header with the project name over a night sky"></p>

<p align="center"><b>English</b> · <a href="README.es.md">Español</a></p>

<p align="center">
  <b>A personal finance app built for zero friction: log an expense in seconds, keep cash, debit and credit cards in one place, and see where your money actually goes.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK%2056-20394a?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 56">
  <img src="https://img.shields.io/badge/React%20Native-0.85-20394a?style=for-the-badge&logo=react&logoColor=white" alt="React Native 0.85">
  <img src="https://img.shields.io/badge/TypeScript-6.0-20394a?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/SQLite-offline-20394a?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <br>
  <img src="https://img.shields.io/badge/Django-5-20394a?style=for-the-badge&logo=django&logoColor=white" alt="Django 5">
  <img src="https://img.shields.io/badge/DRF-JWT-20394a?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="Django REST Framework + JWT">
  <img src="https://img.shields.io/badge/PostgreSQL-15-20394a?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 15">
  <img src="https://img.shields.io/badge/nginx-proxy-20394a?style=for-the-badge&logo=nginx&logoColor=white" alt="nginx">
  <img src="https://img.shields.io/badge/Docker-Compose-20394a?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose">
</p>

<p align="center">
  <img src="docs/readme/screen-entry.jpg" width="23%" alt="Quick expense entry screen">
  <img src="docs/readme/screen-wallets.jpg" width="23%" alt="Payment methods: cash, debit and credit cards with available credit">
  <img src="docs/readme/screen-dashboard.jpg" width="23%" alt="Dashboard: spending by category and month-over-month comparison">
  <img src="docs/readme/screen-transfer.jpg" width="23%" alt="Transfer screen paying off a credit card">
</p>
<p align="center"><sub>Quick entry · Payment methods · Spending dashboard · Credit card payment</sub></p>

---

## Two editions, one product

| Edition | Runs on | Stack | Best for |
| --- | --- | --- | --- |
| **Android app (local-first)** | The phone itself | Expo + React Native + TypeScript + **SQLite** | Offline use, data stays 100% on the device |
| **Server edition** | Any Linux host with Docker | **Django REST Framework** API (JWT, PostgreSQL) + the Expo app exported as a web build, served by nginx | REST API + PostgreSQL backend, browser access |

The current app code is local-first: every screen talks to a TypeScript service layer that stores data in SQLite on the device, so the APK works with no backend and no internet. The server edition is a Docker Compose stack: nginx serves that same app as a web build (still local-first, running in the browser) and proxies `/api/` to a Django REST API with JWT authentication and PostgreSQL. The API models the same domain (wallets, categories, transactions, savings goals) and runs on its own, but it is not yet wired into the app's screens.

## Features

- **Zero-friction entry.** One screen to log an expense or income: amount, description, payment method, category, save.
- **All your payment methods.** Cash, debit accounts and credit cards, each with its own balance; credit cards track limit, debt and available credit.
- **Realistic balance rules.** Expenses lower cash and debit balances and raise credit card debt; deleting a transaction reverses its effect.
- **Transfers and card payments.** Move money between accounts or pay off a credit card and watch the available credit come back.
- **Installment-ready data model.** Transactions store installments and compute the per-installment amount and remaining count; choosing installments from the UI is not built yet.
- **Spending dashboard.** Income vs. expenses, spending by category and a month-over-month comparison per category.
- **Savings goals.** Create goals, add or withdraw funds and follow progress bars right on the dashboard.
- **Guided onboarding.** A question-by-question first run that sets up your name, balance, debit accounts and credit cards.
- **Default categories.** A ready-made set (fixed costs, food, transport, health, entertainment, shopping, "ant" expenses, unexpected) that you can edit or extend.

## Tech stack

| Layer | Android app (local-first) | Server edition |
| --- | --- | --- |
| UI | Expo Router, NativeWind (Tailwind), Reanimated, lucide icons | Same Expo app exported as a web build |
| Logic | TypeScript services + business rules (`src/db/businessLogic.ts`) | Django REST Framework ViewSets and serializers |
| Data | `expo-sqlite` on the device | PostgreSQL 15 |
| Auth | Local profile, no remote login | SimpleJWT in the API (access + refresh tokens), not yet used by the app |
| Delivery | EAS Build (APK) | Docker Compose, nginx reverse proxy |

## Architecture

```mermaid
flowchart LR
  subgraph Phone["Android app (local-first)"]
    UI["Screens<br/>Expo Router + NativeWind"] --> SVC["Services<br/>finance.ts"]
    SVC --> BL["Business rules<br/>balances, credit, transfers"]
    BL --> DB[("SQLite<br/>on device")]
  end

  subgraph Server["Server edition (Docker Compose)"]
    NGX["nginx"] -->|"/"| WEB["Expo web build<br/>same local-first app"]
    NGX -->|"/api/"| API["Django REST API<br/>JWT auth"]
    API --> PG[("PostgreSQL 15")]
    WEB -.->|"available, not yet consumed by the app"| API
  end
```

## Getting started

### Android app (local development)

Requirements: Node.js 20.19+ (LTS), and an Android device with Expo Go or an emulator.

```bash
git clone https://github.com/waldooCreator/Conciencia_financiera.git
cd Conciencia_financiera/frontend
npm install
npm run android        # expo start --android
```

To build an installable APK with EAS Build (requires an Expo account):

```bash
npx eas-cli build --platform android --profile preview
```

### Server edition (Docker)

Requirements: Docker and Docker Compose.

```bash
git clone https://github.com/waldooCreator/Conciencia_financiera.git
cd Conciencia_financiera
cp .env.example .env   # fill in your own values
make up-build          # docker-compose up -d --build
```

The stack starts PostgreSQL, the Django API, the nginx frontend and a Redis container. The backend waits for PostgreSQL and applies migrations on startup. Then open `http://localhost:3020` for the web build; the API answers under `/api/` (for example `/api/health/`). Run `make help` to list every shortcut (logs, shell, tests, superuser, clean).

> The frontend container binds ports **80** and **3020**; free port 80 or edit `docker-compose.yml` before running `make up-build`.

For a bare-metal Linux deployment with Gunicorn, nginx and systemd, see [`docs/deploy-linux.md`](docs/deploy-linux.md).

<details>
<summary><b>REST API overview (server edition)</b></summary>

| Resource | Endpoints | Extra actions |
| --- | --- | --- |
| Auth | `POST /api/users/register/` · `POST /api/token/` · `POST /api/token/refresh/` | `GET/PATCH /api/users/profile/` |
| Wallets | `/api/wallets/` · `/api/wallets/{id}/` | — |
| Categories | `/api/categories/` · `/api/categories/{id}/` | `POST seed_defaults/` |
| Transactions | `/api/transactions/` · `/api/transactions/{id}/` | `GET summary/` · `GET comparison/` |
| Goals | `/api/goals/` · `/api/goals/{id}/` | `POST {id}/add_funds/` · `POST {id}/withdraw_funds/` |
| Health | `GET /api/health/` | — |

Protected routes expect `Authorization: Bearer <access_token>`.

</details>

## Project structure

```
Conciencia_financiera/
├── frontend/              # Expo + React Native app (APK and PWA)
│   ├── app/               # Screens (expo-router): tabs, onboarding, goals, transfer...
│   ├── src/
│   │   ├── db/            # SQLite client, schema and business rules
│   │   ├── services/      # Finance, auth and app-state services
│   │   └── components/    # Reusable UI: charts, inputs, cards, toasts
│   ├── public/            # Screenshots
│   ├── Dockerfile         # Expo web export served by nginx
│   └── nginx.conf         # Static PWA + /api reverse proxy
├── backend/               # Django REST Framework API
│   ├── apps/              # users, wallets, categories, transactions, goals, health
│   └── config/            # Settings and URL routing
├── infrastructure/db/     # PostgreSQL init script
├── docs/                  # Linux deployment guide and README assets
├── .specs/ .design/ .tasks/   # Spec-Driven Development: specs, design, task plan
├── docker-compose.yml
└── Makefile
```

## How it was built

The project followed **Spec-Driven Development**: requirements in [`.specs/specs.md`](.specs/specs.md), technical and UI/UX design (including the color palette) in [`.design/design.md`](.design/design.md), and a phased task plan in [`.tasks/tasks.md`](.tasks/tasks.md), implemented through a history of conventional commits.

| Color | Hex | Role |
| --- | --- | --- |
| Noir | `#030706` | Primary text, dark surfaces |
| Denim | `#20394a` | Cards and containers |
| Bone | `#f9f5ed` | Main background |
| Steel | `#6196aa` | Accents and secondary buttons |
| Concrete | `#c9ccc3` | Borders and placeholders |

## Author

**Walter Velasco** · [@waldooCreator](https://github.com/waldooCreator)

Built as a university mobile development project together with Juan Sebastián Gallego Carrillo.
