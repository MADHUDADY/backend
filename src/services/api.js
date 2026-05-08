const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();
const { verifyToken } = require('./middleware/auth'); // ← ADD THIS LINE

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
app.use('/api/patients',     verifyToken, require('./routes/patientRoutes'));     // ← protected
app.use('/api/doctors',      verifyToken, require('./routes/doctorRoutes'));      // ← protected
app.use('/api/appointments', verifyToken, require('./routes/appointmentRoutes')); // ← protected
app.use('/api/clinic',       verifyToken, require('./routes/clinicRoutes'));      // ← protected
app.use('/api/employees',    require('./routes/employeeRoutes'));  // ← NOT protected here (login is inside)
app.use('/api/categories',   verifyToken, require('./routes/categoryRoutes'));    // ← protected
app.use('/api/helpdesk',     verifyToken, require('./routes/helpdeskRoutes'));    // ← protected

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '✅ QMS Backend API is running!',
    version: '2.0.0',
    auth: 'JWT',
    endpoints: {
      patients:     '/api/patients',
      doctors:      '/api/doctors',
      appointments: '/api/appointments',
      clinic:       '/api/clinic',
      employees:    '/api/employees',
      categories:   '/api/categories',
      helpdesk:     '/api/helpdesk',
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