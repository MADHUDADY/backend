// src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD  →  /api/dashboard
// ─────────────────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats:              () => api.get('/dashboard/stats'),
  getAppointmentsChart:  () => api.get('/dashboard/appointments-chart'),
  getRecentAppointments: () => api.get('/dashboard/recent-appointments'),
};

// ─────────────────────────────────────────────────────────────────────────────
// PATIENTS  →  /api/patients
// ─────────────────────────────────────────────────────────────────────────────
export const patientAPI = {
  getAll:      ()       => api.get('/patients'),
  getById:     (id)     => api.get(`/patients/${id}`),
  getByRegNo:  (regNo)  => api.get(`/patients/reg/${regNo}`),
  create:      (data)   => api.post('/patients', data),
  update:      (id, d)  => api.put(`/patients/${id}`, d),
  delete:      (id)     => api.delete(`/patients/${id}`),
  checkMobile: (mobile) => api.get(`/patients/check/mobile/${mobile}`),
  checkName:   (name)   => api.get(`/patients/check/name/${encodeURIComponent(name)}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCTORS  →  /api/doctors
// ─────────────────────────────────────────────────────────────────────────────
export const doctorAPI = {
  getAll:       ()                           => api.get('/doctors'),
  getById:      (id)                         => api.get(`/doctors/${id}`),
  getByCategory:(categoryId)                 => api.get(`/doctors/category/${categoryId}`),

  // ── NEW: fetch doctors filtered by both clinic and department ──────────────
  getByClinicAndCategory: (clinicId, categoryId) =>
    api.get(`/doctors/byclinic/${clinicId}/category/${categoryId}`),

  delete: (id) => api.delete(`/doctors/${id}`),

  // multipart/form-data for photo upload
  createFormData: (formData) =>
    api.post('/doctors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateFormData: (id, formData) =>
    api.put(`/doctors/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS  →  /api/appointments
// ─────────────────────────────────────────────────────────────────────────────
export const appointmentAPI = {
  getAll:       ()         => api.get('/appointments'),
  getToday:     ()         => api.get('/appointments/today'),
  getById:      (id)       => api.get(`/appointments/${id}`),
  getByTicket:  (ticketNo) => api.get(`/appointments/ticket/${ticketNo}`),
  create:       (data)     => api.post('/appointments', data),
  updateStatus: (id, data) => api.put(`/appointments/${id}`, data),
  update:       (id, data) => api.put(`/appointments/${id}`, data),
  delete:       (id)       => api.delete(`/appointments/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES  →  /api/employees
// ─────────────────────────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll:  ()         => api.get('/employees'),
  getById: (id)       => api.get(`/employees/${id}`),
  login:   (creds)    => api.post('/employees/login', creds),
  create:  (data)     => api.post('/employees', data),
  update:  (id, data) => api.put(`/employees/${id}`, data),
  delete:  (id)       => api.delete(`/employees/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// CLINIC  →  /api/clinic
// ─────────────────────────────────────────────────────────────────────────────
export const clinicAPI = {
  getDetails:    ()         => api.get('/clinic'),
  getCategories: ()         => api.get('/clinic/categories'),
  getServices:   ()         => api.get('/clinic/services'),
  getCounters:   ()         => api.get('/clinic/counters'),
  getEmployees:  ()         => api.get('/clinic/employees'),
  updateDetails: (id, data) => api.put(`/clinic/${id}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES (DEPARTMENTS)  →  /api/categories          ← NEW
// ─────────────────────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll:       ()           => api.get('/categories'),
  getByClinic:  (centerId)   => api.get(`/categories/byclinic/${centerId}`),
};

export default api;