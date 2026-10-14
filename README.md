# BalanceU 🌿
> **Multi-Tenant Institutional Mental Health & Clinical Coordination Platform**

BalanceU is an end-to-end multi-tenant platform designed to connect **Students**, **Counselors**, and **Institutional Administrators**. It pairs an AI-powered Student mobile app with clinical management and administrative web dashboards to automate risk triaging, facilitate care delivery, and provide campus-wide health oversight.

---

## 🌟 Key Features

### 🏢 Multi-Tenant Architecture & RBAC
- **Strict Role-Based Access Control (RBAC):** Distinct interfaces, permissions, and routing for Admins, Counselors, and Students.
- **Multi-Institution Affiliation:** Counselors can be affiliated with multiple universities and switch active institutional contexts on the fly without logging out.
- **Institutional Scoping:** Data isolation ensures campus administrators can only view data, analytics, and caseloads tied to their registered institution.

### 📋 Dynamic Form Schema Builder
- **Admin Configuration:** Administrators can dynamically create, edit, and organize custom registration form fields (text, number, dropdown, radio).
- **Flexible Document Storage:** Custom schemas are stored in **MongoDB**, allowing schema agility without database migrations.
- **Dynamic Client Generation:** The Student registration pipeline parses the dynamic schema to render fields dynamically on the client.

### 📱 Student Mobile Application (React Native / Expo)
- **Interactive Daily Quizzes:** Comprehensive assessment flows measuring mental health indicators.
- **AI-Powered Risk Analysis (Gemini API):** Student responses are processed via Google's Gemini API to produce automated summaries, pattern detections, and clinical risk flags.
- **Mood Tracker & Calendar:** Daily emotional logging, visual calendar summaries, and backend calculations of monthly average mood trends.
- **Prescribed Resources & Medication:** Secure view where students can directly access clinical resources, self-care guides, and medication recommendations assigned by their counselors.

### 🩺 Counselor & Admin Dashboards (React / Vite)
- **Counselor Suite:** Daily clinical summaries, caseload management, detailed student quiz/mood audit histories, and prescription management (resources & medication).
- **Admin Oversight:** Campus-wide student and counselor directories, high-risk alert flags based on dual-factor (Gemini + Counselor) evaluation, and institution-level metrics.
- **Dedicated Profiles:** Tailored profile management with credential verification, institutional identity cards, and granular security controls.

### 🧪 Automated E2E Testing Bed (Playwright)
- **50+ End-to-End Test Cases:** Structured across 4 modules (Authentication & Schema, Student Hub, Admin Oversight, Counselor Suite).
- **Headless Mobile Emulation:** Emulates mobile viewports (Pixel 5) on Expo Web alongside standard desktop browser environments.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Web Frontend (Admin & Counselor)** | React (Vite), TailwindCSS, Lucide Icons |
| **Mobile App (Student)** | React Native, Expo |
| **Backend API** | Node.js, Express.js |
| **Databases** | **Supabase (PostgreSQL)** (Auth, RBAC, Core Entities)<br>**MongoDB** (Dynamic Form Schemas, AI Insights, Quiz Logs) |
| **AI / NLP** | Google Gemini API |
| **Testing & Automation** | Playwright |

---

## 📁 Repository Structure

```text
balanceu/
├── backend/                # Express & Node.js API server
│   ├── config/             # Database connection setups (MongoDB & Supabase)
│   ├── controllers/        # Request handlers (Auth, Forms, Clinical, AI)
│   ├── models/             # MongoDB schemas & Mongoose models
│   ├── routes/             # REST API endpoint definitions
│   └── server.js           # Server entry point
├── frontend/               # React (Vite) Web Application (Admin & Counselor)
│   ├── src/
│   │   ├── components/     # UI widgets, form builders, identity flash cards
│   │   ├── context/        # Auth & Tenant context state management
│   │   ├── pages/          # Admin & Counselor dashboard views
│   │   └── App.jsx
│   └── tests/              # Playwright E2E test suites
│       ├── auth.spec.js
│       ├── student.spec.js
│       ├── admin.spec.js
│       └── counselor.spec.js
├── mobile-app/             # React Native (Expo) Mobile App (Student)
│   ├── src/
│   │   ├── screens/        # Quiz, Mood Calendar, Support Hub, Resources
│   │   ├── components/     # Dynamic form renderer, navigation tabs
│   │   └── services/       # API integration client
│   └── App.js
├── playwright.config.js    # Playwright runner configuration
└── README.md
```

---

## ⚙️ Prerequisites

Ensure you have the following installed locally:
- [Node.js](https://nodejs.org/) (`v18.x` or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)
- Active accounts & credentials for:
  - **MongoDB** (Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
  - **Supabase** ([supabase.com](https://supabase.com))
  - **Google AI Studio** ([Gemini API Key](https://aistudio.google.com/))

---

## 🔐 Environment Variables

Create `.env` files in their respective directories following these examples:

### 1. `backend/.env`
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/balanceu?retryWrites=true&w=majority

# Supabase Credentials
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Client URLs (for CORS whitelist)
CLIENT_URL_WEB=http://localhost:5173
CLIENT_URL_MOBILE=http://localhost:8081
```

### 2. `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. `mobile-app/.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note on Mobile Testing:** When testing on a physical mobile device via Expo Go, replace `localhost` with your machine's local network IP address (e.g., `http://192.168.1.50:5000/api`).

---

## 🚀 Installation & Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/BalanceU.git
cd BalanceU
```

### Step 2: Set Up Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Step 3: Set Up Web Frontend (Admin & Counselor)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:5173
```

### Step 4: Set Up Student Mobile App (Expo)
Open a third terminal window:
```bash
cd mobile-app
npm install
npx expo start --web
# Expo Web runs on http://localhost:8081
```
*(To run on an Android emulator or device, run `npx expo run:android` or scan the QR code with the Expo Go app).*

---

## 🧪 Running Automated Tests (Playwright)

BalanceU includes a suite of **50+ end-to-end tests** validating critical authentication flows, schema builders, cross-dashboard clinical prescriptions, and role isolation.

### 1. Install Playwright Browsers
From the project root or the `frontend/` directory (where `playwright.config.js` is set):
```bash
npx playwright install
```

### 2. Run All Tests Headless
Make sure your backend, frontend web app, and Expo web server are running, then run:
```bash
npx playwright test
```

### 3. Run with Interactive UI Mode
To inspect step-by-step DOM snapshots and network logs:
```bash
npx playwright test --ui
```

### 4. Run a Specific Test Module
```bash
npx playwright test tests/auth.spec.js
npx playwright test tests/counselor.spec.js
```

---

## 🛡️ Security & Defensive Design Considerations
- **CORS Filtering:** Explicit cross-origin handling between Express, Vite (`:5173`), and Expo Web (`:8081`).
- **Session Durability:** React Context and token hydration mechanisms protect active sessions from unmounting during hard browser refreshes.
- **Immutable State Safeguards:** Controlled inputs and array updates protect dynamic form builders from mutation bugs during runtime option additions.
- **Password Enforcement:** Password updates and registrations enforce length (8+ characters), casing, numerical, and symbol rules.

---

## 👥 Contributors & Acknowledgements
- **Developer:** [Harshal](https://github.com/<your-username>) — *Indian Institute of Information Technology (IIIT), Nagpur*
- Developed as a comprehensive institutional healthcare management system.
