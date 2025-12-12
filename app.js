const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorDepartmentRoutes = require('./routes/doctorDepartmentRoutes');
const roomBedsRoutes = require('./routes/roomBedsRoutes');
const labTestRoutes = require('./routes/labTestRoutes');
const icuMgmtRoutes = require('./routes/icuMgmtRoutes');
const emergencyBedRoutes = require('./routes/emergencyBedRoutes');
const emergencyBedSlotRoutes = require('./routes/emergencyBedSlotRoutes');
const otRoutes = require('./routes/otRoutes');
const otslotRoutes = require('./routes/otslotRoutes');
const patientAppointmentRoutes = require('./routes/patientAppointmentRoutes');
const patientLabTestRoutes = require('./routes/patientLabTestRoutes');
const roomAdmissionRoutes = require('./routes/roomAdmissionRoutes');
const emergencyAdmissionRoutes = require('./routes/emergencyAdmissionRoutes');
const emergencyAdmissionVitalsRoutes = require('./routes/emergencyAdmissionVitalsRoutes');
const patientICUAdmissionRoutes = require('./routes/patientICUAdmissionRoutes');
const icuDoctorVisitsRoutes = require('./routes/icuDoctorVisitsRoutes');
const icuVisitVitalsRoutes = require('./routes/icuVisitVitalsRoutes');
const patientAdmitVisitVitalsRoutes = require('./routes/patientAdmitVisitVitalsRoutes');
const patientAdmitDoctorVisitsRoutes = require('./routes/patientAdmitDoctorVisitsRoutes');
const patientOTAllocationRoutes = require('./routes/patientOTAllocationRoutes');
const billEntityRoutes = require('./routes/billEntityRoutes');
const billsRoutes = require('./routes/billsRoutes');
const surgeryProcedureRoutes = require('./routes/surgeryProcedureRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'OK', message: 'API is healthy' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctor-departments', doctorDepartmentRoutes);
app.use('/api/room-beds', roomBedsRoutes);
app.use('/api/lab-tests', labTestRoutes);
app.use('/api/icu', icuMgmtRoutes);
app.use('/api/emergency-beds', emergencyBedRoutes);
app.use('/api/emergency-bed-slots', emergencyBedSlotRoutes);
app.use('/api/ot', otRoutes);
app.use('/api/ot-slots', otslotRoutes);
app.use('/api/patient-appointments', patientAppointmentRoutes);
app.use('/api/patient-lab-tests', patientLabTestRoutes);
app.use('/api/room-admissions', roomAdmissionRoutes);
app.use('/api/emergency-admissions', emergencyAdmissionRoutes);
app.use('/api/emergency-admission-vitals', emergencyAdmissionVitalsRoutes);
app.use('/api/patient-icu-admissions', patientICUAdmissionRoutes);
app.use('/api/icu-doctor-visits', icuDoctorVisitsRoutes);
app.use('/api/icu-visit-vitals', icuVisitVitalsRoutes);
app.use('/api/patient-admit-visit-vitals', patientAdmitVisitVitalsRoutes);
app.use('/api/patient-admit-doctor-visits', patientAdmitDoctorVisitsRoutes);
app.use('/api/patient-ot-allocations', patientOTAllocationRoutes);
app.use('/api/bill-entities', billEntityRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/surgery-procedures', surgeryProcedureRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;

