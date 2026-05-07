const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://frontend-mwv9.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/patients',     require('./routes/patientRoutes'));
app.use('/api/doctors',      require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/clinic',       require('./routes/clinicRoutes'));
app.use('/api/employees',    require('./routes/employeeRoutes'));
app.use('/api/categories',   require('./routes/categoryRoutes'));
app.use('/api/helpdesk',     require('./routes/helpdeskRoutes'));   // ← NEW

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '✅ QMS Backend API is running!',
    version: '1.0.0',
    endpoints: {
      patients:     '/api/patients',
      doctors:      '/api/doctors',
      appointments: '/api/appointments',
      clinic:       '/api/clinic',
      employees:    '/api/employees',
      categories:   '/api/categories',
      helpdesk:     '/api/helpdesk',                               // ← NEW
      login:        '/api/employees/login'
    }
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});