# Grace Church Management System

A full MERN stack church management app — member directory, dues tracking, WhatsApp reminders, and reports.

## Tech Stack
- **MongoDB** — database
- **Express.js** — backend API
- **React.js** — frontend
- **Node.js** — runtime

---

## Getting Started

### 1. Backend
```bash
cd backend
cp .env.example .env      # fill in your MONGO_URI and JWT_SECRET
npm install
npm run dev               # runs on http://localhost:5000
```

### 2. Create your first admin account
Use Postman or curl to register:
```
POST http://localhost:5000/api/auth/register
{
  "name": "Your Name",
  "email": "admin@church.org",
  "password": "yourpassword",
  "role": "admin"
}
```

### 3. Frontend
```bash
cd frontend
npm install
npm start                 # runs on http://localhost:3000
```

---

## Features
- **Dashboard** — live stats, monthly chart, recent payments
- **Members** — add/edit/search members, capture WhatsApp numbers
- **Dues & Payments** — record tithes, dues, building fund, welfare, etc.
- **WhatsApp Reminders** — one click opens WhatsApp chat with pre-filled message for overdue members
- **Reports** — bar charts, pie charts, full payment history, print-ready

## WhatsApp Reminder Flow
1. Go to **Reminders** page
2. Select overdue members
3. Choose a template (Gentle / Firm / Final Notice)
4. Click **Send WhatsApp** — opens each member's WhatsApp chat with the message pre-filled
5. You just hit Send in WhatsApp — no extra API needed!

## Member WhatsApp Number Format
Enter numbers in international format without the `+`:
- Ghana: `233244000000` (not `0244000000`)
- Nigeria: `2348012345678`
