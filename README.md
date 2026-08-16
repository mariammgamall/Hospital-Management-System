# 🏥 Hospital Management System (HMS)

A complete, production-ready, feature-rich enterprise Hospital Management System built from the ground up using a modern JavaScript/Node stack. The system features a responsive, beautifully styled React frontend, a resilient Express.js REST API backend, and a PostgreSQL database orchestrated by Prisma ORM.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen?style=for-the-badge&logo=vercel)](https://mariam-hms-portal.vercel.app/)
👉 **Live Application URL**: [https://mariam-hms-portal.vercel.app/](https://mariam-hms-portal.vercel.app/)

![CareSync Hospital Management System Dashboard](screenshots/HMS.png)

---

## 🚀 Key Architectural & Operational Highlights

- **8 Role-Based Access Control (RBAC)**: Dedicated tailored workflows for **Admins**, **Doctors**, **Nurses**, **Receptionists**, **Pharmacists**, **Lab Technicians**, **Billing Specialists**, and **Patients**.
- **Pharmacy & Stock Inventory Module**: Real-time medicine stock tracking, low-inventory alerts (<20 units), supplier tracking, and prescription voucher dispensation.
- **Pathology & Lab Diagnostics Module**: Lab diagnostic test ordering, numerical/qualitative result verification with reference ranges, and certified pathology reports.
- **Certified 1-Page Stamped Official Printables**: Built-in circular medical verification seal (`OfficialStampSeal`) with strict CSS single-page `@media print` layout locks to eliminate document cutouts on Prescriptions, Lab Reports, EMR files, and Invoices.
- **Portal-Based Full-Screen Modal System**: All modals render via React `createPortal` to guarantee 100% edge-to-edge backdrop dimming and Gaussian blur (`backdrop-blur-md`) over top sticky navigation bars and sidebars.
- **Temporal Appointment Conflict Engine**: Smart collision checks automatically prevent doctor double-bookings within any overlapping 30-minute time frame.
- **Dynamic Inpatient & Bed Grid Tracker**: Interactive floor plans allowing live bed allocations, inpatient admissions, and real-time discharges wrapped in transactional safety blocks.
- **Robust JWT Lifecycle Management**: Seamless request/response interception via Axios that transparently handles access token expiration and renews them using secure HTTP-only refresh tokens.
- **Rich Analytics & Reporting Engine**: Data visualization dashboard featuring interactive Recharts graphs, demographic distributions, and financial metrics with Excel/CSV extraction capabilities.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, Lucide icons, Zustand (State Management), Recharts, React Portals |
| **Backend** | Node.js, Express.js (REST API), Zod (Request Validation), Bcrypt.js, JsonWebToken |
| **Database** | PostgreSQL, Prisma ORM |
| **Styling** | Custom HSL CSS tokens, Dual Light/Dark Modes, Glassmorphism elements, Single-Page Print Layouts |

---

## 📂 Project Structure

```text
hospital-management-system/
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared components (OfficialStampSeal, modals, forms, metric cards)
│   │   ├── layouts/         # Collapsible Sidebar navigation, Top Navbar, Auth Layouts
│   │   ├── pages/           # 9 Module Pages (Dashboard, Patients, Doctors, Wards, Pharmacy, Lab, Billing, etc.)
│   │   ├── routes/          # Protected and Public Route guards with 8-role RBAC enforcement
│   │   ├── services/        # Axios configurations & API modules with interceptors
│   │   ├── store/           # Zustand state management store for Auth and settings
│   │   └── utils/           # Helper utility functions & date formatters
│   ├── vite.config.js       # Vite build configurations
│   ├── tailwind.config.js   # Tailored theme color variables
│   ├── index.html           # Main HTML mount template
│   └── package.json         # Frontend dependencies and execution scripts
├── backend/
│   ├── src/
│   │   ├── controllers/     # API controller handlers (Auth, Pharmacy, Lab, Billing, Patients, Wards, etc.)
│   │   ├── middleware/      # Auth validation, central error handling, Zod validation schemas
│   │   ├── routes/          # Express API route endpoints
│   │   ├── services/        # Business logic operations
│   │   ├── utils/           # Prisma client, token signing utilities
│   │   └── app.js           # Server application configuration & bootloader
│   ├── prisma/
│   │   ├── schema.prisma    # Extended Prisma schema (8 Roles, Medicines, Lab Tests, Invoices, Beds)
│   │   └── seed.js          # DB seeder (populates mock accounts for all 8 roles)
│   └── package.json         # Backend dependencies and execution scripts
├── start.bat                # 1-Click Launch Script for Windows
└── README.md                # System documentation
```

---

## ⚙️ Environment Configurations

Create `.env` files in both the `backend/` and `frontend/` folders using the templates below.

### 1. Backend Environment Variables (`backend/.env`)

```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/hms_db?schema=public"
JWT_SECRET="hms_super_secret_access_token_key_12345!"
JWT_REFRESH_SECRET="hms_super_secret_refresh_token_key_54321!"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
NODE_ENV="development"
```

### 2. Frontend Environment Variables (`frontend/.env`)

```env
VITE_API_URL="http://localhost:5000/api/v1"
```

---

## 🏃 Setup & Launch Instructions

### Easy 1-Click Launcher (Windows)
Double-click **`start.bat`** in the project root to automatically launch both the backend REST API and Vite frontend servers in separate windows with IP detection for local network testing.

### Manual Launch

#### Step 1: Database & Backend Orchestration

1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Push Prisma schema & seed database:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
4. Boot backend server:
   ```bash
   npm run dev
   ```
   *The REST API listens on `http://localhost:5000`.*

#### Step 2: Frontend Client Deployment

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot Vite dev server:
   ```bash
   npm run dev
   ```
   *The client opens at `http://localhost:3000`.*

---

## 🔐 Pre-seeded Accounts Checklist (8 Roles)

All pre-seeded accounts share the password **`password123`**:

| Name | Operational Role | Email Address | Core Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `ADMIN` | `admin@caresync.com` | Full system access: User CRUD, ward configuration, billing overrides, system logs. |
| **Dr. Ahmed Mostafa** | `DOCTOR` | `doctor.ahmed@caresync.com` | Cardiology Specialist: View assigned patients, issue prescriptions, log EMR clinical notes. |
| **Nurse Fatma Ali** | `NURSE` | `nurse@caresync.com` | ICU Lead Nurse: Real-time bed assignments, inpatient admissions, patient status updates. |
| **Omar Tarek** | `RECEPTIONIST` | `receptionist@caresync.com` | Front Desk: Dynamic patient registrations, appointment scheduling, clash detection. |
| **Sherif Hossam** | `PHARMACIST` | `pharmacist@caresync.com` | Pharmacy Lead: Stock inventory control, medicine restocks, prescription dispensation vouchers. |
| **Tarek Mahmoud** | `LAB_TECHNICIAN`| `labtech@caresync.com` | Pathology Technician: Lab test result entries, reference range validation, certified report prints. |
| **Hala Samir** | `BILLING` | `billing@caresync.com` | Billing Specialist: Manual invoice creation, collection processing, payment settlements. |
| **Mariam Gamal** | `PATIENT` | `mariam@caresync.com` | Patient (Inpatient): View active prescriptions, lab reports, discharge summaries, invoices. |
| **Shehab Eldin Ebied** | `PATIENT` | `shehab@caresync.com` | Patient (Outpatient): View medical history records, upcoming appointments, billing details. |

---

## 🔬 Feature Breakdown & Workflow Overview

### 1. Central Pharmacy & Medication Inventory
- View real-time drug stock counts with visual low-stock warning badges.
- Filter prescriptions by dispensation status (`PENDING` vs `DISPENSED`).
- Generate and print official single-page Pharmacy Dispensation Slips featuring official medical verification seals.

### 2. Clinical Laboratory & Diagnostics
- Dispatch lab test requests across Pathology, Biochemistry, Hematology, and Radiology.
- Record quantitative test results, reference ranges, and technician observations.
- Print certified stamped Laboratory Diagnostic Reports with anti-tamper verification seals.

### 3. Certified Single-Page Stamped Printables
- All printable views (Prescriptions, Lab Diagnostic Reports, EMR Records, and Invoices) render a vector `OfficialStampSeal` component.
- Built-in `@media print` rules enforce `max-height: 270mm`, single-page pagination, and header/footer cleanup for print accuracy.

### 4. Full-Screen Backdrop Blur & Responsive UI
- Modals utilize React `createPortal` to render directly to `document.body` at `z-[9999]`, ensuring 100% full-screen dimming and blur over top navigation bars and sidebars in both Light and Dark modes.
- Collapsible sidebar (`w-64` expanded, `w-20` collapsed) with an icon-driven header bar (Theme toggle, Notifications counter, User Avatar, Log Out symbol button).
