// backend/routes/categoryRoutes.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/categories  →  all active departments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT CATEGORYID, CATEGORYE, CATEGORYA, CENTERID
       FROM category
       WHERE ACTIVE = 'Y' AND DISPLAY = 'Y'
       ORDER BY CATEGORYE ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/categories/byclinic/:centerId  →  departments for a specific clinic
router.get('/byclinic/:centerId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT CATEGORYID, CATEGORYE, CATEGORYA, CENTERID
       FROM category
       WHERE ACTIVE = 'Y' AND DISPLAY = 'Y' AND CENTERID = ?
       ORDER BY CATEGORYE ASC`,
      [req.params.centerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;