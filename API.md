# EMR Appointment System – API Documentation

Base URL

http://localhost:5000

Authentication: JWT Bearer Token

Protected routes require header:

Authorization: Bearer <access_token>

---

# Authentication

## Login

POST /api/auth/login

Description: Login for Super Admin or Receptionist.

Request Body

{
  "email": "admin@example.com",
  "password": "password123"
}

Response

{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "Admin",
    "role": "super_admin"
  }
}

---

## Refresh Access Token

POST /api/auth/refresh-token

Description: Generate new access token using refresh token.

---

## Logout

POST /api/auth/logout

Description: Logout current user.

---

# Doctor Management (Admin)

## Create Doctor

POST /api/admin/doctor

Role: Super Admin

Request Body

{
  "name": "Dr John",
  "email": "doctor@example.com",
  "password": "password123",
  "department": "Cardiology",
  "specialization": "Heart Specialist",
  "workingHours": {
    "start": "2025-03-12T09:00:00.000Z",
    "end": "2025-03-12T17:00:00.000Z"
  },
  "breakTimes": [
    {
      "start": "2025-03-12T13:00:00.000Z",
      "end": "2025-03-12T14:00:00.000Z"
    }
  ],
  "slotDuration": 15
}

---

## Get All Doctors

GET /api/admin/doctors

Roles:
- Super Admin
- Receptionist

Response

[
  {
    "_id": "doctor_id",
    "name": "Dr John",
    "department": "Cardiology",
    "specialization": "Heart Specialist"
  }
]

---

## Get Doctor By ID

GET /api/admin/doctors/:id

Role: Super Admin

---

## Update Doctor

PUT /api/admin/doctors/:id

Role: Super Admin

Request Body (Example)

{
  "name": "Dr John Updated",
  "department": "Cardiology",
  "specialization": "Cardiac Surgeon"
}

---

## Block Doctor

PUT /api/admin/doctors/:id/block

Role: Super Admin

Description: Block or unblock a doctor.

---

# Receptionist Management

## Create Receptionist

POST /api/admin/receptionist

Role: Super Admin

Request Body

{
  "name": "Receptionist 1",
  "email": "reception@example.com",
  "password": "password123"
}

---

## Get All Receptionists

GET /api/admin/receptionists

Role: Super Admin

---

## Get Receptionist By ID

GET /api/admin/receptionists/:id

Role: Super Admin

---

## Update Receptionist

PUT /api/admin/receptionists/:id

Role: Super Admin

---

## Block Receptionist

PUT /api/admin/receptionists/:id/block

Role: Super Admin

---

# Appointment Management

## Book Appointment

POST /api/admin/appointments/book

Roles:
- Super Admin
- Receptionist

Request Body

{
  "doctor": "doctor_id",
  "startTime": "2025-03-12T09:00:00.000Z",
  "endTime": "2025-03-12T09:15:00.000Z",
  "patientType": "new",
  "patientName": "Rahul",
  "mobile": "9876543210",
  "age": 35,
  "purpose": "General Checkup"
}

Fields Explanation

doctor → Doctor ID  
startTime → Appointment start time  
endTime → Appointment end time  
patientType → new or existing  
patientName → Required for new patients  
mobile → Patient phone number  
age → Optional  
purpose → Visit reason  

---

## Get Appointments By Doctor

GET /api/admin/appointments/doctor/:doctorId

Roles:
- Super Admin
- Receptionist

---

## Get Appointments By Date

GET /api/admin/appointments

Roles:
- Super Admin
- Receptionist

---

## Update Appointment Status

PATCH /api/admin/appointments/:id/status

Roles:
- Super Admin
- Receptionist

Request Body

{
  "status": "Arrived"
}

Possible Status Values

Booked  
Arrived  
Done  

---

## Update Appointment

PUT /api/admin/appointments/:id

Roles:
- Super Admin
- Receptionist

Request Body (Example)

{
  "purpose": "Follow-up Visit",
  "notes": "Patient reports improvement"
}

---

## Delete Appointment

DELETE /api/admin/appointments/:id

Roles:
- Super Admin
- Receptionist

---

# Doctor APIs

## Doctor Login

POST /api/doctor/login

Request Body

{
  "email": "doctor@example.com",
  "password": "password123"
}

---

## Get Doctor Profile

GET /api/doctor/me

Role: Doctor

---

## Get Doctor Appointments

GET /api/doctor/appointments

Role: Doctor

---

## Update Appointment Notes

PATCH /api/doctor/appointments/:id/notes

Role: Doctor

Request Body

{
  "notes": "Patient needs blood test"
}

---

# Patient Search

GET /api/admin/patients/search?q=rahul

Roles:
- Super Admin
- Receptionist

Description: Search patient by name or mobile number.

---

# Admin Dashboard

## Get Dashboard Statistics

GET /api/admin/dashboard/stats

Role: Super Admin

Returns:

- total doctors
- total appointments
- today's appointments
- other system stats

---

# Audit Logs

## Get System Logs

GET /api/admin/audit-logs

Role: Super Admin

Response includes

- userId
- role
- action
- entityType
- entityId
- timestamp