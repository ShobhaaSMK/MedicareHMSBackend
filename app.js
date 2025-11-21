const express = require('express');
const cors = require('cors');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorDepartmentRoutes = require('./routes/doctorDepartmentRoutes');
const admissionRoomRoutes = require('./routes/admissionRoomRoutes');
const labTestRoutes = require('./routes/labTestRoutes');
const icuMgmtRoutes = require('./routes/icuMgmtRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const otRoutes = require('./routes/otRoutes');
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

app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctor-departments', doctorDepartmentRoutes);
app.use('/api/admission-rooms', admissionRoomRoutes);
app.use('/api/lab-tests', labTestRoutes);
app.use('/api/icu-management', icuMgmtRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ot', otRoutes);

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

