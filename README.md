# 🚗 Abe GarageHub – Smart Garage Management System

[![CI](https://github.com/kalkidanzabreham/abeGarageMainApp/actions/workflows/ci.yml/badge.svg?branch=phase-1-security)](https://github.com/kalkidanzabreham/abeGarageMainApp/actions/workflows/ci.yml?query=branch%3Aphase-1-security)

GarageHub is a full-stack Garage Management System built to simplify and automate day-to-day garage operations.
It enables garage owners to efficiently manage customers, vehicles, employees, and billing — all through an intuitive web interface.

✨ Key Features
🏢 Garage & Service Management
  - Add, update, and manage vehicle service records.
  - Track service history with automated logging.
  - Assign mechanics and monitor job progress.

👨‍🔧 Customer & Employee Management

  - Secure authentication with JWT.

  - Role-based access control (Admin, Mechanic, Customer).

  - Manage employees, assign roles, and track working hours.


## 🛠️ Tech Stack
💻 Frontend

  - React.js – Modern, responsive UI components.

  - React Router DOM – Efficient client-side navigation.

  - Bootstrap & Framer Motion – Sleek, animated, responsive design.

  - React Hot Toast & SweetAlert2 – Interactive notifications and alerts.

⚙️ Backend

  - Node.js & Express.js – Scalable REST API.

  - MySQL with Sequelize ORM – Structured and secure database management.

  - JWT Authentication – Token-based security.

  - bcrypt.js – Secure password hashing.

🧰 Utilities

   - dotenv – Manage environment variables safely.

  - CORS – Secure frontend-backend communication.

  - Nodemon – Development automation and live reloading.

🚀 Getting Started
1. Clone the repository
```bash
git clone https://github.com/kalkidanzabreham/abeGarageMainApp.git
cd abeGarageMainApp
```

2. Install dependencies
```bash
npm install
cd client && npm install
```
3. Setup environment variables

Create a .env file in the root directory:
```bash
PORT=5000  
DB_HOST=localhost  
DB_USER=root  
DB_PASS=yourpassword  
DB_NAME=garagehub  
JWT_SECRET=your_jwt_secret
```

4. Run the project

Start both frontend and backend:
```bash
npm run dev
```

