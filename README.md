# EMR Appointment System – Backend

## Overview
This is the backend service for the **EMR Appointment System** built using the **MERN stack**.  
The system provides secure authentication, role-based access control (RBAC), doctor slot scheduling, and appointment booking.

The backend is developed using **Node.js, Express, MongoDB, and JWT authentication**.

---

## Features

- Secure authentication using **JWT (Access Token & Refresh Token)**
- Password hashing using **bcrypt**
- Role-Based Access Control (RBAC)
- Doctor and Receptionist management
- Appointment slot generation based on doctor schedules
- Appointment booking system
- Prevention of double booking
- Appointment status workflow
- Logging and audit system
- RESTful API architecture

---

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt
- dotenv


---

## Environment Variables

Create a `.env` file inside the backend folder.

---

## Installation

Clone the repository

```
git clone https://github.com/Arshia9995/EMR-Appointment-System-backend.git
```

Navigate to backend folder

```
cd backend
```

Install dependencies

```
npm install
```

---

## Running the Server

Start the development server

```
npm run dev
```


Server will run on

```
http://localhost:5000
```

---


## Security

- Password hashing using **bcrypt**
- JWT authentication
- Protected API routes
- Role-based authorization


## API Documentation

Detailed API documentation is available in the API.md file in this repository.