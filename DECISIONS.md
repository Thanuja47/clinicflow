# ClinicFlow Architecture & Technical Decisions

**System Name:** ClinicFlow Private Clinic Management System  
**Built By:** Fillex360 Solutions  
**Stack:** Next.js 14 (App Router) + Prisma + Supabase (PostgreSQL) + JWT + SMSGo.lk + Tailwind CSS  

---

## 1. Multi-Tenant Architecture

- **Multi-Tenant from Day 1:** Every data model in `prisma/schema.prisma` (except `Clinic` itself) contains a mandatory `clinicId` field.
- **Data Isolation:** All Prisma queries filter strictly by `session.clinicId` extracted from authenticated JWT tokens.
- **Clinic Onboarding:** `/register-clinic` allows self-serve creation of new clinics with dedicated admin credentials.

---

## 2. Authentication & RBAC

- **Dual-Token System:** 
  - `token` (Access Token, 1-day expiration, HTTP-only cookie).
  - `refreshToken` (Refresh Token, 7-day expiration, HTTP-only cookie).
- **Password Security:** `bcryptjs` with salt round 10.
- **Role Hierarchy:**
  - `SUPER_ADMIN`: Cross-clinic platform oversight.
  - `CLINIC_ADMIN`: Full administrative control over branches, staff accounts, and clinic settings.
  - `DOCTOR`: Access to consultation desk, patient medical records, prescription builder, and templates.
  - `RECEPTIONIST`: Patient registration, appointment booking, live queue management, billing, and lab report uploads.

---

## 3. Patient Flow & Live Queue System

- **Auto Queue Numbering:** Calculated dynamically on booking (`count(doctor_appointments_today) + 1`).
- **Real-Time Queue Board:** 10-second client-side polling on `/reception` for instant receptionist sequence updates.
- **Lifecycle Statuses:** `BOOKED` -> `CHECKED_IN` (Waiting) -> `IN_PROGRESS` (In Consultation) -> `COMPLETED` / `CANCELLED` / `NO_SHOW`.

---

## 4. Clinical Visits & Prescriptions

- **Prescription Builder:** Dynamic medicine row editor with dosage, frequency, and duration.
- **Doctor Templates:** Saved Rx templates (`itemsJson`) for quick 1-click loading.
- **Thermal & Letterhead Print CSS:** Clean `@media print` styling for patient prescriptions and thermal receipt billing slips.

---

## 5. Billing & Invoices

- **Automated Total Calculation:** `totalAmount = consultationFee + labCharges + otherCharges`.
- **Payment Statuses:** `PAID`, `UNPAID`, `PARTIAL`.
- **Receipt Printing:** Thermal receipt layout with clinic branding, patient details, itemized breakdown, and status stamp.

---

## 6. SMS & WhatsApp Integration

- **Provider:** SMSGo.lk API integration (`https://smsgo.lk/api/v1/send`).
- **Automated Triggers:** Automated SMS sent on appointment creation to confirm date, time, doctor, and queue number.
- **Fallback / Mock Mode:** Logs to console & DB if API key is not provisioned in environment.
- **Notification Logs:** Full audit trail recorded in `NotificationLog` table.

---

## 7. Storage & Analytics

- **Lab Reports Storage:** Supabase Storage integration (`lab-reports` bucket) with public URL resolution.
- **Reports Dashboard:** Interactive charts via `Recharts` for daily revenue trends, doctor consultation volume, and status distributions.
- **i18n Support:** Dual English (`en`) and Sinhala (`si`) UI support with instant toggle.

---

*Document finalized by Fillex360 Solutions for ClinicFlow production release.*
