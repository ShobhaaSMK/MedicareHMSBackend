# Hospital Management System (HMS) - Current System State

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Project Name:** MediCare HMS Backend

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Structure](#api-structure)
6. [Authentication & Authorization](#authentication--authorization)
7. [Key Features & Modules](#key-features--modules)
8. [Environment Configuration](#environment-configuration)
9. [System Assumptions](#system-assumptions)
10. [Database Initialization System](#database-initialization-system)
11. [Project Structure](#project-structure)
12. [Dependencies](#dependencies)
13. [Development Workflow](#development-workflow)

---

## System Overview

This is a comprehensive Hospital Management System (HMS) backend built with Node.js and Express.js, designed to manage all aspects of hospital operations including:

- Patient registration and management
- Doctor and staff management
- Room and bed management
- ICU management
- Emergency department operations
- Operation Theater (OT) scheduling
- Laboratory test management
- Patient appointments
- Billing and invoicing
- Audit logging
- Reporting and dashboards

The system uses PostgreSQL as the primary database and implements a RESTful API architecture with JWT-based authentication.

---

## Technology Stack

### Core Technologies
- **Runtime:** Node.js
- **Framework:** Express.js 4.18.2
- **Database:** PostgreSQL (using `pg` driver 8.11.3)
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Password Hashing:** bcrypt 5.1.1
- **Email Service:** nodemailer 7.0.11

### Development Tools
- **Testing:** Jest 29.7.0, Supertest 6.3.3
- **Development Server:** nodemon 3.0.1
- **Environment Variables:** dotenv 16.6.1
- **CORS:** cors 2.8.5

---

## Architecture

### Application Structure
```
Express App (app.js)
├── Middleware
│   ├── CORS
│   ├── JSON Parser
│   └── Error Handler
├── Routes (29 route modules)
│   └── Controllers (29 controller modules)
└── Database Layer
    ├── Connection Pool (db.js)
    └── Initialization (dbInit.js)
```

### Request Flow
1. Client Request → Express App
2. Route Handler → Controller
3. Controller → Database Query
4. Database Response → Controller
5. Controller → JSON Response → Client

### Server Entry Point
- **File:** `server.js`
- **Port:** 4000 (default, configurable via `PORT` env variable)
- **Initialization:** Automatically initializes database and tables on startup

---

## Database Schema

### Database Name
- **Default:** `medicarehms` (configurable via `PGDATABASE` or `DATABASE_URL`)

### Total Tables: 28

#### Core Tables
1. **Roles** - User roles and permissions (UUID primary key)
2. **Users** - System users (doctors, nurses, staff)
3. **DoctorDepartment** - Medical departments
4. **PatientRegistration** - Patient information (UUID primary key)

#### Resource Management Tables
5. **RoomBeds** - Room and bed management
6. **ICU** - ICU bed management
7. **EmergencyBed** - Emergency room beds
8. **EmergencyBedSlot** - Emergency bed time slots
9. **OT** - Operation theater definitions
10. **OTSlot** - Operation theater time slots
11. **LabTest** - Laboratory test definitions

#### Patient Care Tables
12. **PatientAppointment** - Patient appointments
13. **RoomAdmission** - Room patient admissions
14. **PatientICUAdmission** - ICU patient admissions
15. **EmergencyAdmission** - Emergency patient admissions
16. **PatientLabTest** - Patient lab test orders
17. **PatientOTAllocation** - OT patient allocations
18. **PatientOTAllocationSlots** - Junction table for OT slots

#### Clinical Documentation Tables
19. **EmergencyAdmissionVitals** - Emergency admission vital signs
20. **ICUDoctorVisits** - Doctor visits in ICU
21. **ICUVisitVitals** - ICU vital signs
22. **PatientAdmitNurseVisits** - Nurse visits for admitted patients
23. **PatientAdmitDoctorVisits** - Doctor visits for admitted patients
24. **PatientAdmitVisitVitals** - Vital signs for admitted patients

#### Billing & Procedures
25. **BillEntity** - Billing entity types
26. **Bills** - Patient bills
27. **SurgeryProcedure** - Surgery procedure definitions

#### System Tables
28. **AuditLog** - System audit logs

### Key Database Features
- **UUID Extension:** Uses `uuid-ossp` extension for UUID generation
- **Foreign Keys:** Extensive referential integrity constraints
- **Indexes:** Performance indexes on frequently queried columns
- **CHECK Constraints:** Data validation constraints (e.g., Status values, Yes/No fields)
- **Timestamps:** Automatic `CreatedAt` and `UpdatedAt` tracking

---

## API Structure

### Base URL
- **Development:** `http://localhost:4000`
- **Health Check:** `GET /health`

### API Endpoints (29 Route Modules)

#### Authentication & Authorization
- `/api/auth` - Login, token verification, password reset
- `/api/roles` - Role management
- `/api/users` - User management

#### Patient Management
- `/api/patients` - Patient registration and management

#### Resource Management
- `/api/doctor-departments` - Department management
- `/api/room-beds` - Room and bed management
- `/api/lab-tests` - Laboratory test definitions
- `/api/icu` - ICU bed management
- `/api/emergency-beds` - Emergency bed management
- `/api/emergency-bed-slots` - Emergency bed slot management
- `/api/ot` - Operation theater management
- `/api/ot-slots` - OT slot management

#### Patient Care Operations
- `/api/patient-appointments` - Appointment scheduling
- `/api/room-admissions` - Room admission management
- `/api/emergency-admissions` - Emergency admission management
- `/api/emergency-admission-vitals` - Emergency vital signs
- `/api/patient-icu-admissions` - ICU admission management
- `/api/icu-doctor-visits` - ICU doctor visit records
- `/api/icu-visit-vitals` - ICU vital signs
- `/api/patient-admit-visit-vitals` - Admitted patient vital signs
- `/api/patient-admit-doctor-visits` - Admitted patient doctor visits
- `/api/patient-lab-tests` - Lab test orders
- `/api/patient-ot-allocations` - OT allocation management

#### Billing & Procedures
- `/api/bill-entities` - Billing entity management
- `/api/bills` - Bill generation and management
- `/api/surgery-procedures` - Surgery procedure definitions

#### System & Reporting
- `/api/audit-logs` - Audit log access
- `/api/reports` - System reports
- `/api/dashboard` - Dashboard data

### API Response Format
```json
{
  "success": true|false,
  "message": "Response message",
  "data": { ... }
}
```

---

## Authentication & Authorization

### Authentication Method
- **JWT (JSON Web Tokens)**
- Token-based stateless authentication
- Token expiration: 24 hours (configurable via `JWT_EXPIRES_IN`)

### Authentication Flow
1. User logs in via `/api/auth/login` with `UserName` and `Password`
2. System validates credentials (bcrypt password comparison)
3. System generates JWT token containing:
   - `userId`
   - `userName`
   - `roleId`
4. Client includes token in subsequent requests:
   - `Authorization: Bearer <token>` header, OR
   - `x-access-token: <token>` header

### Authorization Middleware
- **File:** `middleware/authMiddleware.js`
- **Function:** `authenticateToken`
- **Validation:**
  - Verifies JWT token signature
  - Checks token expiration
  - Validates user exists and is active
  - Adds user info to `req.user`

### Password Reset Flow
1. User requests password reset via `/api/auth/forgot-password`
2. System generates reset token (1 hour expiration)
3. System sends email with reset link (if email configured)
4. User clicks link and submits new password via `/api/auth/reset-password`
5. System validates token and updates password

### Security Features
- Passwords hashed with bcrypt (10 salt rounds)
- JWT secret key (should be in environment variable)
- Token expiration enforcement
- User status validation (Active/Inactive)
- Email enumeration protection in password reset

---

## Key Features & Modules

### 1. Patient Management
- Patient registration with unique PatientNo
- Patient type classification (OPD, Emergency, etc.)
- Patient search and retrieval
- Patient status management

### 2. Appointment System
- OPD appointment scheduling
- Doctor availability management
- Appointment status tracking

### 3. Admission Management
- **Room Admissions:** Regular ward admissions
- **ICU Admissions:** Critical care admissions with ventilator tracking
- **Emergency Admissions:** Emergency department admissions

### 4. Clinical Documentation
- **Vital Signs:** Blood pressure, temperature, pulse, etc.
- **Doctor Visits:** Visit records with remarks
- **Nurse Visits:** Nursing care documentation
- **Status Tracking:** Patient status updates

### 5. Laboratory Management
- Lab test catalog management
- Patient lab test orders
- Test priority assignment
- Test result tracking

### 6. Operation Theater (OT) Management
- OT room management
- OT slot scheduling
- Surgery procedure definitions
- Patient OT allocations

### 7. Emergency Department
- Emergency bed management
- Emergency bed slot scheduling
- Emergency admission tracking
- Emergency vital signs monitoring

### 8. Billing System
- Multiple bill entity types (OPD, Lab, IPD, OT, ICU, Pharmacy)
- Bill generation and tracking
- Payment status management
- Insurance and scheme support

### 9. Reporting & Analytics
- Dashboard data aggregation
- System reports
- Audit log access

### 10. Audit Logging
- System-wide audit trail
- User action tracking
- Data change history

---

## Environment Configuration

### Required Environment Variables

#### Database Configuration
```env
# Option 1: Individual variables
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=medicarehms

# Option 2: Connection string
DATABASE_URL=postgres://user:pass@host:5432/medicarehms

# SSL Configuration (optional)
PGSSLMODE=require  # If SSL is required
```

#### Server Configuration
```env
PORT=4000  # Server port (default: 4000)
NODE_ENV=development  # Environment mode
```

#### Authentication Configuration
```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
RESET_TOKEN_EXPIRES_IN=1h
```

#### Email Configuration (Optional)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

### Environment Variable Assumptions
1. **Database:** PostgreSQL must be installed and running
2. **Database Name:** Defaults to `medicarehms` if not specified
3. **Database User:** Must have CREATE DATABASE privileges for auto-initialization
4. **JWT Secret:** Should be changed in production (default is insecure)
5. **Email Service:** Optional - system works without email configuration
6. **Port:** Defaults to 4000 if not specified

---

## System Assumptions

### Database Assumptions
1. **PostgreSQL Version:** Compatible with PostgreSQL 9.5+ (uses UUID extension, SERIAL types)
2. **Database Creation:** System can auto-create database if user has privileges
3. **Table Creation:** All tables are created automatically via `init_tables.sql`
4. **Column Addition:** Missing columns are automatically added on startup
5. **Schema Evolution:** System supports dynamic schema updates via `dbInit.js`
6. **Naming Convention:** Table and column names use PascalCase (e.g., `PatientId`, `RoomBedsId`)

### Application Assumptions
1. **Node.js Version:** Compatible with Node.js 14+ (uses modern JavaScript features)
2. **Single Database:** One database instance per deployment
3. **Stateless API:** No server-side session storage (JWT-based)
4. **UTC Timestamps:** All timestamps stored in UTC
5. **Status Fields:** Most entities have `Status` field (typically 'Active'/'Inactive')
6. **Soft Deletes:** Deletion may be soft (status change) rather than hard delete
7. **Audit Trail:** All significant operations should be logged in AuditLog table

### Business Logic Assumptions
1. **Patient Numbers:** Auto-generated unique patient numbers
2. **Bill Numbers:** Auto-generated unique bill numbers
3. **User Roles:** Role-based access control (RBAC) system
4. **Doctor Types:** INHOUSE or VISITING doctors
5. **Room Categories:** AC or Non-AC rooms
6. **Room Types:** Special, Special Shared, or Regular
7. **ICU Ventilator:** ICU beds can have ventilator attached (Yes/No)
8. **Payment Modes:** Cash, Card, Insurance, or Scheme
9. **Bill Status:** Paid or NotPaid
10. **Ventilator Status:** OnVentilator field (Yes/No) for ICU admissions

### Data Integrity Assumptions
1. **Foreign Keys:** Extensive foreign key relationships enforce referential integrity
2. **CHECK Constraints:** Data validation via CHECK constraints (e.g., Status values)
3. **Unique Constraints:** Critical fields have UNIQUE constraints (PatientNo, BillNo, etc.)
4. **Required Fields:** NOT NULL constraints on critical fields
5. **Default Values:** Sensible defaults for Status, CreatedAt, etc.

### Security Assumptions
1. **Password Security:** All passwords must be hashed (bcrypt)
2. **Token Security:** JWT tokens must be kept secure (HTTPS in production)
3. **Input Validation:** Input validation should be performed (assumed in controllers)
4. **SQL Injection:** Parameterized queries prevent SQL injection
5. **CORS:** CORS enabled for cross-origin requests (configure appropriately)

### Development Assumptions
1. **Auto-Initialization:** Database and tables auto-initialize on server start
2. **Dynamic Scanning:** System scans controllers to detect new tables/columns
3. **Migration Support:** Migration scripts available for schema changes
4. **Test Database:** Separate test database for automated tests
5. **Development Mode:** Email service can be disabled in development

---

## Database Initialization System

### Auto-Initialization Features

#### 1. Database Creation
- **File:** `dbInit.js` → `initializeDatabase()`
- **Behavior:** Automatically creates database if it doesn't exist
- **Requirement:** User must have CREATE DATABASE privilege

#### 2. Table Creation
- **File:** `init_tables.sql`
- **Execution:** Runs automatically on server startup
- **Method:** Uses `CREATE TABLE IF NOT EXISTS` for idempotency
- **Total Tables:** 28 tables created

#### 3. Column Verification & Addition
- **File:** `dbInit.js` → `ensureAllTablesAndColumns()`
- **Behavior:** 
  - Scans controllers dynamically to detect required columns
  - Checks for missing columns
  - Automatically adds missing columns with inferred types
- **Static Column Checks:** Known columns that might be missing (legacy support)
- **Dynamic Column Detection:** Scans controller map functions for column usage

#### 4. Dynamic Controller Scanning
- **Function:** `scanControllersForTablesAndColumns()`
- **Process:**
  1. Scans all `*Controller.js` files in `/controllers`
  2. Extracts table names from SQL queries (FROM, INTO, UPDATE, JOIN)
  3. Extracts column names from map functions (e.g., `mapPatientRow`)
  4. Infers column types from naming patterns
- **Type Inference Rules:**
  - `*Id` → `INTEGER` (except PatientId, BillId)
  - `*Date`, `*DateTime`, `*At` → `TIMESTAMP`
  - `*Amount`, `*Charge`, `*Rate`, `*Price` → `DECIMAL(10, 2)`
  - `*Status` → `VARCHAR(50)`
  - `*Remarks`, `*Details`, `*Description` → `TEXT`
  - `*Phone`, `*No` → `VARCHAR(50)`
  - `*Email` → `VARCHAR(255)`
  - Default → `VARCHAR(255)`

### Initialization Flow
1. Server starts (`server.js`)
2. `initializeDatabase()` - Creates database if needed
3. `initializeTables()` - Executes `init_tables.sql`
4. `ensureAllTablesAndColumns()` - Verifies and adds missing columns
5. Server ready to accept requests

### Known Auto-Added Columns
The system automatically adds these columns if missing:
- `PatientLabTest.RoomAdmissionId`, `OrderedByDoctorId`, `Priority`
- `PatientOTAllocation.RoomAdmissionId`, `NurseId`
- `PatientAdmitNurseVisits.RoomAdmissionId`
- `PatientAdmitDoctorVisits.RoomAdmissionId`
- `PatientAdmitVisitVitals.RoomAdmissionId`, `NurseId`, `PatientStatus`, `VisitRemarks`, `VitalsStatus`
- `PatientICUAdmission.RoomAdmissionId`, `OnVentilator`, `ICUAdmissionStatus`
- `ICUVisitVitals.VitalsStatus`, `NurseId`
- `EmergencyAdmissionVitals.NurseId`, `VitalsStatus`
- `EmergencyBed.EmergencyRoomNameNo`, `ChargesPerDay`

### Initialization Logging
The system logs:
- Database creation status
- Table creation status
- Missing tables detected
- Missing columns detected
- Columns automatically added
- Verification results

---

## Project Structure

```
backend/
├── app.js                          # Express application setup
├── server.js                       # Server entry point
├── db.js                           # Database connection pool
├── dbInit.js                       # Database initialization logic
├── init_tables.sql                 # Database schema definition
│
├── controllers/                    # Business logic (29 files)
│   ├── authController.js
│   ├── roleController.js
│   ├── userController.js
│   ├── patientController.js
│   ├── doctorDepartmentController.js
│   ├── roomBedsController.js
│   ├── labTestController.js
│   ├── icuController.js
│   ├── emergencyBedController.js
│   ├── emergencyBedSlotController.js
│   ├── otController.js
│   ├── otslotController.js
│   ├── patientAppointmentController.js
│   ├── patientLabTestController.js
│   ├── roomAdmissionController.js
│   ├── emergencyAdmissionController.js
│   ├── emergencyAdmissionVitalsController.js
│   ├── patientICUAdmissionController.js
│   ├── icuDoctorVisitsController.js
│   ├── icuVisitVitalsController.js
│   ├── patientAdmitVisitVitalsController.js
│   ├── patientAdmitDoctorVisitsController.js
│   ├── patientOTAllocationController.js
│   ├── billEntityController.js
│   ├── billsController.js
│   ├── surgeryProcedureController.js
│   ├── auditLogController.js
│   ├── reportsController.js
│   └── dashboardController.js
│
├── routes/                         # API routes (29 files)
│   ├── authRoutes.js
│   ├── roleRoutes.js
│   ├── userRoutes.js
│   ├── patientRoutes.js
│   ├── doctorDepartmentRoutes.js
│   ├── roomBedsRoutes.js
│   ├── labTestRoutes.js
│   ├── icuMgmtRoutes.js
│   ├── emergencyBedRoutes.js
│   ├── emergencyBedSlotRoutes.js
│   ├── otRoutes.js
│   ├── otslotRoutes.js
│   ├── patientAppointmentRoutes.js
│   ├── patientLabTestRoutes.js
│   ├── roomAdmissionRoutes.js
│   ├── emergencyAdmissionRoutes.js
│   ├── emergencyAdmissionVitalsRoutes.js
│   ├── patientICUAdmissionRoutes.js
│   ├── icuDoctorVisitsRoutes.js
│   ├── icuVisitVitalsRoutes.js
│   ├── patientAdmitVisitVitalsRoutes.js
│   ├── patientAdmitDoctorVisitsRoutes.js
│   ├── patientOTAllocationRoutes.js
│   ├── billEntityRoutes.js
│   ├── billsRoutes.js
│   ├── surgeryProcedureRoutes.js
│   ├── auditLogRoutes.js
│   ├── reportsRoutes.js
│   └── dashboardRoutes.js
│
├── middleware/
│   └── authMiddleware.js           # JWT authentication middleware
│
├── utils/
│   └── emailService.js             # Email service for password reset
│
├── migrations/                     # Database migration scripts
│   ├── *.sql                       # SQL migration files
│   └── *.js                        # JavaScript migration files
│
├── package.json                    # Dependencies and scripts
├── jest.config.js                  # Jest test configuration
├── .env                            # Environment variables (not committed)
├── .gitignore                      # Git ignore rules
│
├── Documentation/
│   ├── README.md                   # Basic setup guide
│   ├── INITIALIZATION_SUMMARY.md   # Database initialization details
│   ├── AUTO_UPDATE_SYSTEM.md       # Auto-update system documentation
│   └── SYSTEM_STATE.md             # This file
│
└── Scripts/                        # Utility scripts
    ├── create_*.js                 # Data creation scripts
    ├── run_*.js                    # Migration execution scripts
    ├── check_*.js                  # Diagnostic scripts
    └── analyze_*.js                # Analysis scripts
```

---

## Dependencies

### Production Dependencies
```json
{
  "bcrypt": "^5.1.1",              // Password hashing
  "cors": "^2.8.5",                // Cross-origin resource sharing
  "dotenv": "^16.6.1",             // Environment variable management
  "express": "^4.18.2",            // Web framework
  "jsonwebtoken": "^9.0.2",        // JWT authentication
  "nodemailer": "^7.0.11",        // Email service
  "pg": "^8.11.3"                  // PostgreSQL driver
}
```

### Development Dependencies
```json
{
  "cross-env": "^7.0.3",           // Cross-platform environment variables
  "jest": "^29.7.0",              // Testing framework
  "nodemon": "^3.0.1",            // Development server with auto-reload
  "supertest": "^6.3.3"           // HTTP assertion library for testing
}
```

### NPM Scripts
```json
{
  "start": "node server.js",      // Production start
  "dev": "nodemon server.js",     // Development start with auto-reload
  "test": "cross-env NODE_ENV=test jest --runInBand"  // Run tests
}
```

---

## Development Workflow

### Starting the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Database Setup
1. Ensure PostgreSQL is running
2. Set environment variables in `.env`
3. Start server - database and tables auto-initialize

### Adding New Features
1. **Create Controller:** Add business logic in `controllers/`
2. **Create Route:** Define API endpoints in `routes/`
3. **Register Route:** Add route to `app.js`
4. **Database Schema:** Add table definition to `init_tables.sql`
5. **Restart Server:** System auto-detects new tables/columns

### Testing
```bash
# Run all tests
npm test

# Test database required
# Set up .env.test with test database credentials
```

### Migration Scripts
- Migration scripts available in `/migrations`
- Run manually or integrate into deployment process
- Some migrations have been automated via `dbInit.js`

---

## Known Limitations & Future Considerations

### Current Limitations
1. **Type Inference:** Column type inference is best-effort; complex types may need manual adjustment
2. **Constraints:** CHECK constraints and foreign keys need to be in `init_tables.sql` (not auto-added)
3. **Map Functions:** Columns are only auto-detected if they appear in controller map functions
4. **Email Service:** Optional - password reset may not work without email configuration
5. **Authentication:** JWT secret defaults to insecure value (must be changed in production)

### Recommended Improvements
1. **Input Validation:** Add comprehensive input validation middleware
2. **Rate Limiting:** Implement rate limiting for API endpoints
3. **Logging:** Enhanced logging system (e.g., Winston, Morgan)
4. **API Documentation:** Swagger/OpenAPI documentation
5. **Error Handling:** Standardized error response format
6. **Testing:** Increase test coverage
7. **Security:** Implement role-based route protection
8. **Performance:** Add database query optimization and caching
9. **Backup:** Automated database backup system
10. **Monitoring:** Health checks and monitoring integration

---

## Support & Maintenance

### Key Files for Maintenance
- **Database Schema:** `init_tables.sql`
- **Initialization Logic:** `dbInit.js`
- **Connection Pool:** `db.js`
- **Application Setup:** `app.js`
- **Server Entry:** `server.js`

### Diagnostic Tools
- `check_missing_columns.js` - Check for missing columns
- `analyze_required_tables_and_columns.js` - Analyze required tables/columns
- `extract_all_columns.js` - Extract all columns from schema

### Migration Tools
- Various `run_migration_*.js` scripts for specific migrations
- Migration SQL files in `/migrations`

---

## Conclusion

This Hospital Management System backend provides a comprehensive foundation for managing hospital operations. The system is designed with:

- **Automatic database initialization** for easy setup
- **Dynamic schema detection** for easier maintenance
- **RESTful API architecture** for frontend integration
- **JWT-based authentication** for security
- **Comprehensive feature set** covering all major hospital operations

The system is production-ready but requires proper environment configuration, especially for security (JWT secret) and email services.

---

**Document Version:** 1.0  
**Last Reviewed:** December 2024  
**Maintained By:** Development Team
