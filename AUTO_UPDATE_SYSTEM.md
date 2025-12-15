# Auto-Updating Database Initialization System

## Overview

The `dbInit.js` system has been enhanced to **automatically detect new tables and columns** when new APIs are added to the project. This means you no longer need to manually update `dbInit.js` when adding new routes or controllers.

## How It Works

### 1. Dynamic Controller Scanning

On every initialization, the system:

1. **Scans all controller files** in `/controllers` directory
2. **Extracts table names** from SQL queries (FROM, INTO, UPDATE, JOIN clauses)
3. **Extracts column names** from map functions (e.g., `mapPatientRow`, `mapBillRow`)
4. **Infers column types** from column name patterns

### 2. Automatic Table Detection

The system combines:
- **Base tables** (28 tables from `init_tables.sql`) - ensures all defined tables exist
- **Scanned tables** (from controller SQL queries) - detects new tables automatically

### 3. Automatic Column Detection

The system combines:
- **Static column checks** (known columns that might be missing) - for legacy support
- **Dynamic column checks** (from controller map functions) - detects new columns automatically

### 4. Column Type Inference

When a new column is detected, the system infers its type from naming patterns:

- `*Id` (except PatientId, BillId) → `INTEGER`
- `*Date`, `*DateTime`, `*At` → `TIMESTAMP`
- `*Amount`, `*Charge`, `*Rate`, `*Price` → `DECIMAL(10, 2)`
- `*Status` → `VARCHAR(50)`
- `*Remarks`, `*Details`, `*Description` → `TEXT`
- `*Phone`, `*No` → `VARCHAR(50)`
- `*Email` → `VARCHAR(255)`
- Default → `VARCHAR(255)`

## Example: Adding a New API

### Scenario: Adding a new "PatientMedication" API

1. **Create Controller** (`controllers/patientMedicationController.js`):
```javascript
const mapPatientMedicationRow = (row) => ({
  PatientMedicationId: row.PatientMedicationId,
  PatientId: row.PatientId,
  MedicationName: row.MedicationName,
  Dosage: row.Dosage,
  PrescribedDate: row.PrescribedDate,
  Status: row.Status,
});

exports.getAllPatientMedications = async (req, res) => {
  const query = 'SELECT * FROM "PatientMedication"';
  // ...
};
```

2. **Create Route** (`routes/patientMedicationRoutes.js`):
```javascript
router.get('/', patientMedicationController.getAllPatientMedications);
```

3. **On Next Startup**:
   - ✅ System automatically detects `PatientMedication` table from SQL query
   - ✅ System automatically detects columns: `PatientMedicationId`, `PatientId`, `MedicationName`, `Dosage`, `PrescribedDate`, `Status`
   - ✅ System infers types: `INTEGER`, `UUID`, `VARCHAR(255)`, `VARCHAR(255)`, `TIMESTAMP`, `VARCHAR(50)`
   - ✅ System reports missing table/columns (you still need to add them to `init_tables.sql` or they'll be created automatically if possible)

## What You Still Need to Do

### Required: Add Table Definition to `init_tables.sql`

While the system detects new tables, you should still add the full table definition to `init_tables.sql` for:
- Proper column types and constraints
- Foreign key relationships
- Indexes
- CHECK constraints
- Default values

### Optional: Add to Static Column Checks

If you want to ensure specific columns are always checked (with exact types), you can add them to the `staticColumnChecks` array in `dbInit.js`. However, this is **optional** - the dynamic scanning will handle it.

## Benefits

1. **Self-Updating**: No need to manually update `dbInit.js` when adding new APIs
2. **Early Detection**: Missing tables/columns are detected immediately
3. **Type Inference**: Reasonable defaults for column types
4. **Backward Compatible**: Still checks all base tables and static columns

## Logging

The system logs:
- Number of tables found in controllers
- Number of columns found from map functions
- Missing tables/columns detected
- Columns automatically added

Example output:
```
📊 Scanning controllers for tables and columns...
  ✓ Found 27 tables in controllers: AuditLog, Users, Roles, DoctorDepartment, BillEntity...
  ✓ Found 45 columns from controller map functions
✓ All 28 required tables exist
✓ All required columns exist
```

## Limitations

1. **Type Inference is Best-Effort**: Complex types may need manual adjustment
2. **Constraints Not Auto-Added**: CHECK constraints, foreign keys need to be in `init_tables.sql`
3. **Map Function Required**: Columns are only detected if they appear in map functions

## Best Practices

1. **Always use map functions** in controllers for consistent column detection
2. **Add table definitions** to `init_tables.sql` for proper schema
3. **Review logs** on startup to catch any issues early
4. **Test after adding new APIs** to ensure tables/columns are created correctly

## Files Modified

- `dbInit.js` - Enhanced with `scanControllersForTablesAndColumns()` function
- Dynamic scanning runs automatically on every initialization

## Summary

The system is now **self-updating** - when you add new APIs with controllers and routes, the initialization system will automatically detect the required tables and columns, making database schema management much easier!

