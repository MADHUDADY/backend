// backend/routes/helpdeskRoutes.js
const express = require('express');
const router  = express.Router();

const { verifyToken, requireRole } = require('../middleware/auth');

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

// ── అన్ని routes కి login అవసరం ──────────────────────────────────────────────
router.use(verifyToken);

// ── Categories — అందరూ చూడవచ్చు ─────────────────────────────────────────────
router.get('/categories', getCategories);

// ── Stats — Admin మాత్రమే ────────────────────────────────────────────────────
router.get('/tickets/stats', requireRole('Admin'), getStats);

// ── GET tickets — అందరూ చూడవచ్చు ────────────────────────────────────────────
router.get('/tickets',      getAllTickets);
router.get('/tickets/:id',  getTicketById);

// ── CREATE ticket — అందరూ చేయవచ్చు ──────────────────────────────────────────
router.post('/tickets', createTicket);

// ── Ticket actions — Admin + Staff చేయవచ్చు ──────────────────────────────────
router.patch('/tickets/:id/status',  requireRole('Admin', 'Staff'), updateStatus);
router.patch('/tickets/:id/assign',  requireRole('Admin', 'Staff'), assignTicket);
router.patch('/tickets/:id/resolve', requireRole('Admin', 'Staff'), resolveTicket);
router.post('/tickets/:id/comment',  addComment);

// ── Cancel — Admin మాత్రమే ───────────────────────────────────────────────────
router.delete('/tickets/:id', requireRole('Admin'), cancelTicket);

module.exports = router;