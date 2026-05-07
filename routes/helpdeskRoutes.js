// backend/routes/helpdeskRoutes.js
const express = require('express');
const router  = express.Router();

const {
  getCategories,
  getStats,
  getAllTickets,
  getTicketById,
  createTicket,
  updateStatus,
  assignTicket,
  resolveTicket,
  addComment,
  cancelTicket,
} = require('../controllers/helpdeskController');

// ── Categories ────────────────────────────────────────────────────────────────
router.get('/categories',             getCategories);

// ── Tickets ───────────────────────────────────────────────────────────────────
// ⚠️ ORDER MATTERS: /stats before /:id — otherwise 'stats' is treated as an id

router.get('/tickets/stats',          getStats);
router.get('/tickets',                getAllTickets);
router.get('/tickets/:id',            getTicketById);
router.post('/tickets',               createTicket);

// ── Ticket actions ────────────────────────────────────────────────────────────
router.patch('/tickets/:id/status',   updateStatus);
router.patch('/tickets/:id/assign',   assignTicket);
router.patch('/tickets/:id/resolve',  resolveTicket);
router.post('/tickets/:id/comment',   addComment);
router.delete('/tickets/:id',         cancelTicket);

module.exports = router;