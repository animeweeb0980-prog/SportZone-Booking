# SportZone Court Booking System 🏟️

SportZone is a modern, high-performance web application designed for seamless sports court discovery, booking, and event registration. It features a robust automated email notification system with Google Calendar integration.

## ✨ Key Features
- **Smart Discovery**: Browse available sports courts (Tennis, Badminton, etc.) with real-time availability.
- **Seamless Booking**: Simple, fast interface for reserving slots.
- **Event Registration**: Register for tournaments and local leagues.
- **Automated Notifications**: Instant email confirmations via Nodemailer.
- **Calendar Integration**: One-click "Add to Google Calendar" buttons in confirmation emails.
- **Leaderboard**: Track top athletes and session counts in real-time.
- **Secure Auth**: JWT-based authentication with Bcrypt password hashing.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide React, React Router 7 |
| **Backend** | Node.js, Express 5 |
| **Database** | SQLite (via `better-sqlite3`) |
| **Styling** | Vanilla CSS (Modern CSS Variables) |
| **Utilities** | Nodemailer, JWT, BcryptJS, Dotenv, Concurrently |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher

### 2. Environment Setup
Create a `.env` file in the root directory and add your email credentials (used for sending booking confirmations):

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```
*(Note: Use a [Google App Password](https://support.google.com/accounts/answer/185833?hl=en) if using Gmail).*

### 3. Installation
Clone the repository and install dependencies:

```bash
# Install all dependencies
npm install
```

### 4. Running the Project
You can run both the frontend and backend simultaneously with a single command:

```bash
# Start Frontend (5173) and Backend (3001)
npm start
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 📁 Project Structure
- `/src`: React frontend components and pages.
- `/server`: Node.js/Express backend logic and SQLite database.
- `/public`: Static assets and icons.
- `test_flow.mjs`: Automated script to test core API flows.

## 🔒 Security
- Passwords are never stored in plain text (Salted & Hashed with Bcrypt).
- API routes are protected using JWT (JSON Web Tokens).
- Environment variables are managed via `.env` (ensure this is in your `.gitignore`).

## ⚖️ License
MIT License - Developed for the SportZone Sports Management Platform.
