# Database Initialization Summary

## Overview
The database initialization system has been enhanced to automatically ensure all required tables and columns exist when the project starts up.

## Tables Created (28 Total)

All tables are defined in `init_tables.sql` and are automatically created on initialization:

1. **Roles** - User roles and permissions
2. **DoctorDepartment** - Medical departments
3. **Users** - System users (doctors, nurses, staff)
4. **PatientRegistration** - Patient information
5. **RoomBeds** - Room and bed management
6. **LabTest** - Laboratory test definitions
7. **ICU** - ICU bed management
8. **BillEntity** - Billing entity types
9. **Bills** - Patient bills
10. **EmergencyBed** - Emergency room beds
11. **EmergencyBedSlot** - Emergency bed time slots
12. **OT** - Operation theater definitions
13. **OTSlot** - Operation theater time slots
14. **PatientAppointment** - Patient appointments
15. **PatientICUAdmission** - ICU patient admissions
16. **RoomAdmission** - Room patient admissions
17. **PatientLabTest** - Patient lab test orders
18. **SurgeryProcedure** - Surgery procedure definitions
19. **PatientOTAllocation** - OT patient allocations
20. **PatientOTAllocationSlots** - Junction table for OT slots
21. **EmergencyAdmission** - Emergency patient admissions
22. **EmergencyAdmissionVitals** - Emergency admission vital signs
23. **PatientAdmitNurseVisits** - Nurse visits for admitted patients
24. **ICUDoctorVisits** - Doctor visits in ICU
25. **ICUVisitVitals** - ICU vital signs
26. **PatientAdmitDoctorVisits** - Doctor visits for admitted patients
27. **PatientAdmitVisitVitals** - Vital signs for admitted patients
28. **AuditLog** - System audit logs

## Automatic Column Addition

The `dbInit.js` file automatically checks for and adds missing columns in the following tables:

### PatientLabTest
- `RoomAdmissionId` (INTEGER)
- `OrderedByDoctorId` (INTEGER)
- `Priority` (VARCHAR(50))

### PatientOTAllocation
- `RoomAdmissionId` (INTEGER)
- `NurseId` (INTEGER)

### PatientAdmitNurseVisits
- `RoomAdmissionId` (INTEGER)

### PatientAdmitDoctorVisits
- `RoomAdmissionId` (INTEGER)

### PatientAdmitVisitVitals
- `RoomAdmissionId` (INTEGER)
- `NurseId` (INTEGER)
- `PatientStatus` (VARCHAR(50))
- `VisitRemarks` (TEXT)
- `VitalsStatus` (VARCHAR(50))

### PatientICUAdmission
- `RoomAdmissionId` (INTEGER)
- `OnVentilator` (VARCHAR(10) with CHECK constraint)
- `ICUAdmissionStatus` (VARCHAR(50) with CHECK constraint)

### ICUVisitVitals
- `VitalsStatus` (VARCHAR(50))
- `NurseId` (INTEGER)

### EmergencyAdmissionVitals
- `NurseId` (INTEGER)
- `VitalsStatus` (VARCHAR(50))

### EmergencyBed
- `EmergencyRoomNameNo` (VARCHAR(100))
- `ChargesPerDay` (DECIMAL(10, 2))

## How It Works

1. **On Startup**: The `dbInit.js` module runs automatically
2. **Table Creation**: Executes `init_tables.sql` which uses `CREATE TABLE IF NOT EXISTS` for all tables
3. **Table Verification**: Checks that all 28 required tables exist
4. **Column Verification**: Checks for missing columns and adds them automatically
5. **Constraint Addition**: Adds CHECK constraints where needed (e.g., OnVentilator, ICUAdmissionStatus)

## Verification Scripts

### check_missing_columns.js
Run this script to check if any expected columns are missing:
```bash
node check_missing_columns.js
```

### analyze_required_tables_and_columns.js
Analyzes routes and controllers to identify required tables:
```bash
node analyze_required_tables_and_columns.js
```

## Error Handling

- Non-critical errors (e.g., "already exists") are logged but don't stop initialization
- Missing columns are automatically added with appropriate data types
- Missing tables are reported but should be created by `init_tables.sql`
- All operations are logged for debugging

## Status

✅ All 28 tables are defined in `init_tables.sql`
✅ All required columns are automatically added if missing
✅ Initialization runs automatically on project startup
✅ No manual migration scripts needed for standard columns

## Files Modified

1. **dbInit.js** - Enhanced with comprehensive table and column verification
2. **check_missing_columns.js** - Diagnostic script for column verification
3. **analyze_required_tables_and_columns.js** - Analysis script for tables/columns

## Next Steps

The initialization system is now comprehensive and handles:
- All 28 required tables
- All columns referenced in controllers
- Automatic addition of missing columns
- Proper constraint handling

No further action needed - the system will automatically ensure all tables and columns exist on every startup.

