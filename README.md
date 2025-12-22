# MediCare HMS Backend

Node.js + Express API backed by PostgreSQL for Hospital Management System (HMS) with comprehensive patient, appointment, admission, and resource management capabilities.

## Tech Stack

- **Runtime:** Node.js / Express.js
- **Database:** PostgreSQL (`pg` driver)
- **File Upload:** Multer
- **Testing:** Jest + Supertest
- **Environment:** dotenv, cors

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env` at project root:

```env
# Server Configuration
PORT=4000

# Database Configuration
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=medicarehms
# OR use DATABASE_URL=postgres://user:pass@host:5432/medicarehms

# Upload Configuration
UPLOADS_DIR=uploads
# Base URL for file access (used in file upload responses)
# Use UPLOADS_BASE_URL or BASE_URL (UPLOADS_BASE_URL takes precedence)
UPLOADS_BASE_URL=http://localhost:4000
# OR BASE_URL=http://localhost:4000
# For production: https://yourdomain.com
# If not set, will be auto-constructed from request (protocol + host)

# Auto Schema Management (optional)
AUTO_CREATE_MISSING_TABLES=true
```

### 3. Database Setup

The server automatically initializes the database and tables on startup:

- **Auto-creation:** Missing tables and columns are automatically created based on API usage
- **Manual initialization:** Run `node run_init_tables.js` to initialize manually
- **Disable auto-creation:** Set `AUTO_CREATE_MISSING_TABLES=false` in `.env`

### 4. Run the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:4000` (or your configured PORT).

### 5. Health Check

```bash
curl http://localhost:4000/health
```

## Automatic Database Schema Management

The server automatically detects and creates missing tables and columns on startup:

- **Scans all controllers** to identify tables and columns used by APIs
- **Detects missing tables** and creates them with appropriate structure
- **Detects missing columns** and adds them to existing tables
- **Infers column types** from naming patterns (e.g., `*Id` → INTEGER, `*Date` → TIMESTAMP)

### Disabling Auto-Creation

Add to your `.env` file:
```env
AUTO_CREATE_MISSING_TABLES=false
```

## API Endpoints

### Base URL
- **Development:** `http://localhost:4000`
- **Health Check:** `GET /health`

---

## Core APIs

### Authentication & Authorization

#### `/api/auth`
- `POST /login` - User login
- `POST /verify-token` - Verify JWT token
- `POST /reset-password` - Password reset

#### `/api/roles`
- `GET /` - List all roles
- `GET /:id` - Get role by ID
- `POST /` - Create role
- `PUT /:id` - Update role
- `DELETE /:id` - Delete role

#### `/api/users`
- `GET /` - List all users
- `GET /:id` - Get user by ID
- `GET /:id/doctor-details` - Get comprehensive doctor data
- `POST /` - Create user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

---

### Patient Management

#### `/api/patients`
- `GET /` - List all patients (optional filters: `?status=Active`)
- `GET /:id` - Get patient by PatientId (UUID)
- `POST /` - Register new patient
- `PUT /:id` - Update patient details
- `DELETE /:id` - Delete patient record

**Example - Create Patient:**
```bash
curl -X POST http://localhost:4000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "PatientName": "John",
    "LastName": "Doe",
    "PhoneNo": "999-888-7777",
    "Gender": "Male",
    "Age": 45,
    "Address": "123 Main St",
    "Status": "Active",
    "RegisteredBy": 1
  }'
```

---

### File Upload

#### `/api/upload`
- `POST /` - Upload file
- `DELETE /:folder/:patientNo/:filename` - Delete file

**Upload File:**
```bash
curl -X POST http://localhost:4000/api/upload \
  -F "file=@document.pdf" \
  -F "folder=ot-documents" \
  -F "PatientId=a7f88a65-68d1-419e-a8e8-64e079f863e0"
```

**Or using query parameters:**
```bash
curl -X POST "http://localhost:4000/api/upload?folder=ot-documents&PatientId=a7f88a65-68d1-419e-a8e8-64e079f863e0" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "success": true,
  "url": "http://localhost:4000/uploads/ot-documents/P2025_12_0001/document_1234567890_987654321.pdf"
}
```

**Features:**
- Supports: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`, `.xls`, `.xlsx`
- Max file size: 20MB
- Files organized by patient number: `uploads/{folder}/{patientNo}/`
- Automatically fetches PatientNo from PatientId
- Base URL configured via `UPLOADS_BASE_URL` or `BASE_URL` in `.env`
- If not configured, automatically uses request protocol and host

**Delete File:**
```bash
curl -X DELETE "http://localhost:4000/api/upload/ot-documents/P2025_12_0001/document_1234567890_987654321.pdf"
```

---

### Appointments

#### `/api/patient-appointments`

**List All Appointments**
- `GET /` - List all appointments with optional filters
  - Query parameters:
    - `status` - Filter by status (`Active`, `Inactive`)
    - `appointmentStatus` - Filter by appointment status (`Waiting`, `Consulting`, `Completed`)
    - `patientId` - Filter by patient UUID
    - `doctorId` - Filter by doctor ID
    - `appointmentDate` - Filter by date (YYYY-MM-DD)

**Example:**
```bash
# Get all active appointments
curl "http://localhost:4000/api/patient-appointments?status=Active"

# Get waiting appointments for a doctor
curl "http://localhost:4000/api/patient-appointments?doctorId=2&appointmentStatus=Waiting"

# Get appointments for a specific date
curl "http://localhost:4000/api/patient-appointments?appointmentDate=2024-12-15"
```

**Get Appointment by ID**
- `GET /:id` - Get single appointment by PatientAppointmentId

**Example:**
```bash
curl http://localhost:4000/api/patient-appointments/123
```

**Get Appointments by Patient**
- `GET /patient/:patientId` - Get all appointments for a specific patient
  - Query parameters: `?status`, `?appointmentStatus`

**Example:**
```bash
curl "http://localhost:4000/api/patient-appointments/patient/a7f88a65-68d1-419e-a8e8-64e079f863e0?status=Active"
```

**Create Appointment**
- `POST /` - Create new appointment
  - **Required fields:**
    - `PatientId` - UUID string
    - `DoctorId` - Number
    - `AppointmentDate` - String (YYYY-MM-DD format)
    - `AppointmentTime` - String (HH:MM or HH:MM:SS format)
  - **Optional fields:**
    - `AppointmentStatus` - `Waiting` (default), `Consulting`, `Completed`
    - `ConsultationCharge` - Number
    - `Diagnosis` - String
    - `FollowUpDetails` - String
    - `PrescriptionsUrl` - String
    - `ToBeAdmitted` - `Yes` or `No` (default: `No`)
    - `ReferToAnotherDoctor` - `Yes` or `No` (default: `No`)
    - `ReferredDoctorId` - Number (required if `ReferToAnotherDoctor` is `Yes`)
    - `TransferToIPDOTICU` - `Yes` or `No` (default: `No`)
    - `TransferTo` - `IPD Room Admission`, `ICU`, or `OT`
    - `TransferDetails` - String
    - `BillId` - Number
    - `Status` - `Active` (default) or `Inactive`
    - `CreatedBy` - Number

**Example - Create Appointment:**
```bash
curl -X POST http://localhost:4000/api/patient-appointments \
  -H "Content-Type: application/json" \
  -d '{
    "PatientId": "a7f88a65-68d1-419e-a8e8-64e079f863e0",
    "DoctorId": 2,
    "AppointmentDate": "2024-12-15",
    "AppointmentTime": "10:00:00",
    "AppointmentStatus": "Waiting",
    "ConsultationCharge": 500,
    "Status": "Active"
  }'
```

**Note:** `TokenNo` is automatically generated in format `T-0001`, `T-0002`, etc.

**Update Appointment**
- `PUT /:id` - Update appointment (all fields optional except ID)

**Example:**
```bash
curl -X PUT http://localhost:4000/api/patient-appointments/123 \
  -H "Content-Type: application/json" \
  -d '{
    "AppointmentStatus": "Consulting",
    "Diagnosis": "Fever and cold",
    "PrescriptionsUrl": "http://example.com/prescription.pdf"
  }'
```

**Delete Appointment**
- `DELETE /:id` - Delete appointment

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/patient-appointments/123
```

#### Appointment Statistics

**Get Today's Active Appointments Count**
- `GET /count/today-active` - Get count of active appointments for today

**Example:**
```bash
curl http://localhost:4000/api/patient-appointments/count/today-active
```

**Response:**
```json
{
  "success": true,
  "date": "2024-12-15",
  "count": 25,
  "message": "Today's active appointments count retrieved successfully"
}
```

**Get Active Appointments Count by Date**
- `GET /count/active?date=YYYY-MM-DD` - Get count of active appointments for a specific date (defaults to today if date not provided)

**Example:**
```bash
curl "http://localhost:4000/api/patient-appointments/count/active?date=2024-12-15"
```

**Get Doctor-Wise Patient Count**
- `GET /count/doctor-wise` - Get patient count grouped by doctor
  - Query parameters:
    - `status` - Filter by appointment status (optional)
    - `appointmentDate` - Filter by date (YYYY-MM-DD, optional)

**Example:**
```bash
curl "http://localhost:4000/api/patient-appointments/count/doctor-wise?appointmentDate=2024-12-15"
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "totalPatients": 25,
  "totalAppointments": 30,
  "filters": {
    "status": null,
    "appointmentDate": "2024-12-15"
  },
  "data": [
    {
      "DoctorId": 2,
      "DoctorName": "Dr. John Doe",
      "DoctorEmail": "john@example.com",
      "PatientCount": 10,
      "TotalAppointments": 12
    }
  ]
}
```

**Get Appointment Counts by Status**
- `GET /count/status` - Get counts grouped by appointment status
  - Query parameters:
    - `appointmentDate` - Filter by date (YYYY-MM-DD, optional)
    - `doctorId` - Filter by doctor ID (optional)

**Example:**
```bash
curl "http://localhost:4000/api/patient-appointments/count/status?appointmentDate=2024-12-15&doctorId=2"
```

**Response:**
```json
{
  "success": true,
  "filters": {
    "appointmentDate": "2024-12-15",
    "doctorId": 2
  },
  "counts": {
    "TotalActiveAppointments": 25,
    "WaitingCount": 10,
    "ConsultingCount": 5,
    "CompletedCount": 10
  }
}
```

**Get Active Waiting or Consulting Count**
- `GET /count/active-waiting-consulting` - Get count of active appointments with status `Waiting` or `Consulting`

**Example:**
```bash
curl http://localhost:4000/api/patient-appointments/count/active-waiting-consulting
```

**Response:**
```json
{
  "success": true,
  "message": "Active waiting or consulting appointments count retrieved successfully",
  "count": 15,
  "data": {
    "count": 15,
    "status": "Active",
    "appointmentStatus": ["Waiting", "Consulting"]
  }
}
```

#### Appointment Status Values

- **AppointmentStatus:** `Waiting`, `Consulting`, `Completed`
- **Status:** `Active`, `Inactive`
- **ToBeAdmitted:** `Yes`, `No`
- **ReferToAnotherDoctor:** `Yes`, `No`
- **TransferToIPDOTICU:** `Yes`, `No`
- **TransferTo:** `IPD Room Admission`, `ICU`, `OT`

---

### Emergency Management

#### `/api/emergency-beds`
- `GET /` - List emergency beds
- `GET /:id` - Get bed by ID
- `POST /` - Create bed
- `PUT /:id` - Update bed (blocks if occupied)
- `DELETE /:id` - Delete bed

**Status values:** `Active`, `Inactive`, `Occupied`, `Unoccupied`

#### `/api/emergency-admissions`
- `GET /` - List emergency admissions
- `GET /:id` - Get admission by ID
- `POST /` - Create admission (auto-marks bed as Occupied)
- `PUT /:id` - Update admission (auto-updates bed status)
- `DELETE /:id` - Delete admission

**Features:**
- Automatically marks bed as `Occupied` when patient is admitted
- Automatically marks bed as `Unoccupied` when:
  - Status changes to `Discharged`, `ICU`, `IPD`, or `OT`
  - `TransferTo` field is set
- Prevents assigning multiple patients to the same bed

**Example - Create Emergency Admission:**
```bash
curl -X POST http://localhost:4000/api/emergency-admissions \
  -H "Content-Type: application/json" \
  -d '{
    "DoctorId": 2,
    "PatientId": "a7f88a65-68d1-419e-a8e8-64e079f863e0",
    "EmergencyBedId": 17,
    "EmergencyAdmissionDate": "2025-12-10",
    "EmergencyStatus": "Admitted",
    "Diagnosis": "Fever",
    "PatientCondition": "Stable",
    "Priority": "Medium",
    "Status": "Active"
  }'
```

#### `/api/emergency-admission-vitals`
- `GET /` - List vital signs
- `GET /:id` - Get vitals by ID
- `POST /` - Record vitals
- `PUT /:id` - Update vitals

---

### Room Admissions

#### `/api/room-admissions`
- `GET /` - List room admissions
- `GET /:id` - Get admission by ID
- `POST /` - Create room admission
- `PUT /:id` - Update admission
- `DELETE /:id` - Delete admission

---

### ICU Management

#### `/api/icu`
- `GET /` - List ICU beds
- `GET /:id` - Get ICU bed by ID
- `POST /` - Create ICU bed
- `PUT /:id` - Update ICU bed
- `DELETE /:id` - Delete ICU bed

#### `/api/patient-icu-admissions`
- `GET /` - List ICU admissions
- `GET /:id` - Get admission by ID
- `POST /` - Create ICU admission
- `PUT /:id` - Update admission
- `DELETE /:id` - Delete admission

#### `/api/icu-doctor-visits`
- `GET /` - List doctor visits
- `POST /` - Record doctor visit
- `PUT /:id` - Update visit

#### `/api/icu-visit-vitals`
- `GET /` - List vital signs
- `POST /` - Record vitals
- `PUT /:id` - Update vitals

---

### Operation Theater (OT) Management

#### `/api/ot`
- `GET /` - List operation theaters
- `GET /:id` - Get OT by ID
- `POST /` - Create OT
- `PUT /:id` - Update OT
- `DELETE /:id` - Delete OT

#### `/api/ot-slots`
- `GET /` - List OT slots (filters: `?otId`, `?status`)
- `GET /:id` - Get slot by ID
- `GET /by-ot/:otId` - Get slots for specific OT
- `POST /` - Create slot
- `PUT /:id` - Update slot
- `DELETE /:id` - Delete slot

#### `/api/patient-ot-allocations`
- `GET /` - List OT allocations (filters: `?status`, `?operationStatus`, `?patientId`)
- `GET /:id` - Get allocation by ID
- `POST /` - Create allocation
- `PUT /:id` - Update allocation
- `DELETE /:id` - Delete allocation
- `GET /today-scheduled-count` - Get today's scheduled count
- `GET /date-scheduled-count/:date` - Get scheduled count for date

**Features:**
- Supports multiple slots per allocation (`OTSlotIds` array)
- Automatically releases slots when status is `Cancelled` or `Postponed`
- Automatically deletes files when `OTDocuments` is updated (removed URLs)
- File uploads stored in `uploads/ot-documents/{patientNo}/`

**Example - Create OT Allocation:**
```bash
curl -X POST http://localhost:4000/api/patient-ot-allocations \
  -H "Content-Type: application/json" \
  -d '{
    "PatientId": "a7f88a65-68d1-419e-a8e8-64e079f863e0",
    "OTId": 1,
    "OTSlotIds": [1, 2],
    "LeadSurgeonId": 2,
    "OTAllocationDate": "15-12-2024",
    "OperationStatus": "Scheduled",
    "OTDocuments": "[\"http://localhost:4000/uploads/ot-documents/P2025_12_0001/doc1.pdf\"]"
  }'
```

**Example - Update OT Allocation (with file cleanup):**
```bash
curl -X PUT http://localhost:4000/api/patient-ot-allocations/123 \
  -H "Content-Type: application/json" \
  -d '{
    "OTDocuments": "[\"http://localhost:4000/uploads/ot-documents/P2025_12_0001/newdoc.pdf\"]"
  }'
```
Files not in the new list are automatically deleted from the filesystem.

---

### Laboratory Tests

#### `/api/lab-tests`
- `GET /` - List lab test definitions
- `GET /:id` - Get test by ID
- `POST /` - Create test definition
- `PUT /:id` - Update test
- `DELETE /:id` - Delete test

#### `/api/patient-lab-tests`
- `GET /` - List patient lab tests
- `GET /:id` - Get test by ID
- `POST /` - Create lab test
- `PUT /:id` - Update test
- `DELETE /:id` - Delete test

---

### Resources

#### `/api/doctor-departments`
- `GET /` - List departments
- `GET /:id` - Get department by ID
- `POST /` - Create department
- `PUT /:id` - Update department
- `DELETE /:id` - Delete department

#### `/api/room-beds`
- `GET /` - List room beds
- `GET /:id` - Get bed by ID
- `GET /available` - Get available beds
- `POST /` - Create bed
- `PUT /:id` - Update bed
- `DELETE /:id` - Delete bed

#### `/api/surgery-procedures`
- `GET /` - List surgery procedures
- `GET /:id` - Get procedure by ID
- `POST /` - Create procedure
- `PUT /:id` - Update procedure
- `DELETE /:id` - Delete procedure

---

### Billing

#### `/api/bill-entities`
- `GET /` - List bill entities
- `GET /:id` - Get entity by ID
- `POST /` - Create entity
- `PUT /:id` - Update entity
- `DELETE /:id` - Delete entity

#### `/api/bills`
- `GET /` - List bills
- `GET /:id` - Get bill by ID
- `POST /` - Create bill
- `PUT /:id` - Update bill
- `DELETE /:id` - Delete bill

---

### Reports & Dashboard

#### `/api/reports`
- Various reporting endpoints for analytics

#### `/api/dashboard`
- Dashboard statistics and metrics

#### `/api/audit-logs`
- `GET /` - List audit logs
- System activity tracking

---

## Common Usage Patterns

### Upload File and Add to OT Documents

```javascript
// 1. Upload file
const formData = new FormData();
formData.append('file', file);
formData.append('folder', 'ot-documents');
formData.append('PatientId', patientId);

const uploadResponse = await fetch('http://localhost:4000/api/upload', {
  method: 'POST',
  body: formData
});

const { url } = await uploadResponse.json();

// 2. Get existing documents
const allocationResponse = await fetch(`http://localhost:4000/api/patient-ot-allocations/${allocationId}`);
const allocation = await allocationResponse.json();

// 3. Add new URL to existing documents
let documents = [];
if (allocation.data.OTDocuments) {
  try {
    documents = JSON.parse(allocation.data.OTDocuments);
  } catch (e) {
    documents = allocation.data.OTDocuments.split(',').map(u => u.trim());
  }
}
documents.push(url);

// 4. Update allocation
await fetch(`http://localhost:4000/api/patient-ot-allocations/${allocationId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    OTDocuments: JSON.stringify(documents)
  })
});
```

### Cancel OT Allocation (Auto-releases slots)

```bash
curl -X PUT http://localhost:4000/api/patient-ot-allocations/123 \
  -H "Content-Type: application/json" \
  -d '{
    "OperationStatus": "Cancelled"
  }'
```

Slots are automatically released and available for other allocations.

### Update Emergency Admission (Auto-updates bed status)

```bash
curl -X PUT http://localhost:4000/api/emergency-admissions/456 \
  -H "Content-Type: application/json" \
  -d '{
    "EmergencyStatus": "Discharged"
  }'
```

Bed is automatically marked as `Unoccupied`.

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### List Response
```json
{
  "success": true,
  "count": 10,
  "data": [ ... ]
}
```

---

## Project Structure

```
├── app.js                          # Express app configuration
├── server.js                       # Server entry point
├── db.js                          # Database connection
├── dbInit.js                      # Auto schema management
├── init_tables.sql                # Database schema
├── controllers/                   # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── patientController.js
│   ├── uploadController.js
│   ├── emergencyAdmissionController.js
│   ├── patientOTAllocationController.js
│   └── ...
├── routes/                        # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── patientRoutes.js
│   ├── uploadRoutes.js
│   └── ...
├── middleware/                    # Express middleware
│   └── authMiddleware.js
├── utils/                         # Utility functions
│   └── emailService.js
└── uploads/                       # File uploads directory
    └── ot-documents/
        └── {patientNo}/
```

---

## Testing

### Automated Tests

1. Create test database: `medicarehms_test`
2. Create `.env.test` with test database credentials
3. Run tests:
   ```bash
   npm test
   ```

### Manual Testing

Use tools like:
- **cURL** - Command line
- **Postman** - API testing tool
- **Insomnia** - API client
- **Browser** - For GET requests

---

## Important Notes

### Base URL Configuration

The base URL is used to construct file URLs returned by the upload API. It can be configured in several ways:

**Priority Order:**
1. `UPLOADS_BASE_URL` environment variable (highest priority)
2. `BASE_URL` environment variable
3. Auto-constructed from request (protocol + host) - default fallback

**Examples:**

**Development:**
```env
UPLOADS_BASE_URL=http://localhost:4000
```

**Production:**
```env
UPLOADS_BASE_URL=https://api.yourdomain.com
```

**With Port:**
```env
UPLOADS_BASE_URL=http://localhost:4000
```

**Without Port (default 80/443):**
```env
UPLOADS_BASE_URL=https://yourdomain.com
```

**Auto-construction (if not set):**
- Uses `req.protocol` (http/https) + `req.get('host')` (hostname:port)
- Example: If request comes to `https://api.example.com:443`, base URL will be `https://api.example.com:443`

**Note:** The base URL in the response will always match the actual server URL, ensuring file links work correctly.

### File Uploads
- Files are stored in `uploads/{folder}/{patientNo}/`
- Patient number is automatically fetched from PatientId
- Files are accessible via: `{BASE_URL}/uploads/{folder}/{patientNo}/{filename}`
- When updating `OTDocuments`, files not in the new list are automatically deleted
- File URLs in responses use the configured `UPLOADS_BASE_URL` or auto-constructed base URL

### Bed Management
- Emergency beds automatically update status based on admissions
- Cannot update occupied beds via PUT request
- Bed status: `Unoccupied` (available), `Occupied` (in use), `Active`, `Inactive`

### OT Slot Management
- Multiple slots can be assigned per allocation
- Slots are automatically released when allocation is cancelled/postponed
- Slot changes are logged with detailed information

### Date Formats
- **Database:** `YYYY-MM-DD` (e.g., `2024-12-15`)
- **API Input:** `DD-MM-YYYY` (e.g., `15-12-2024`)
- **API Output:** `DD-MM-YYYY` (e.g., `15-12-2024`)

---

## Troubleshooting

### File Upload Issues
- Check `UPLOADS_DIR` in `.env`
- Ensure directory permissions
- Verify PatientId is valid UUID
- Check file size (max 20MB)
- Verify file type is allowed

### Database Connection Issues
- Verify PostgreSQL is running
- Check `.env` database credentials
- Ensure database exists
- Check network connectivity

### Auto Schema Issues
- Check `AUTO_CREATE_MISSING_TABLES` in `.env`
- Review server logs for errors
- Run manual initialization: `node run_init_tables.js`

---

## License

[Your License Here]

## Support

For issues and questions, please contact the development team.
