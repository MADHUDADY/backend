// backend/routes/categoryRoutes.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

const { verifyToken, requireRole } = require('../middleware/auth');

// ── అన్ని routes కి login అవసరం ──────────────────────────────────────────────
router.use(verifyToken);

// GET /api/categories — అందరూ చూడవచ్చు
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

// GET /api/categories/byclinic/:centerId — అందరూ చూడవచ్చు
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

// POST — Admin మాత్రమే కొత్త department add చేయవచ్చు
router.post('/', requireRole('Admin'), async (req, res) => {
  try {
    const { CATEGORYE, CATEGORYA, CENTERID } = req.body;
    if (!CATEGORYE)
      return res.status(400).json({ success: false, message: 'Category name required' });

    const [result] = await db.query(
      `INSERT INTO category (CATEGORYE, CATEGORYA, CENTERID, ACTIVE, DISPLAY, CREATEDDATE)
       VALUES (?, ?, ?, 'Y', 'Y', NOW())`,
      [CATEGORYE, CATEGORYA || null, CENTERID || '101']
    );
    res.status(201).json({ success: true, message: 'Category created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT — Admin మాత్రమే
router.put('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const { CATEGORYE, CATEGORYA, ACTIVE } = req.body;
    const [result] = await db.query(
      `UPDATE category SET CATEGORYE=?, CATEGORYA=?, ACTIVE=? WHERE CATEGORYID=?`,
      [CATEGORYE, CATEGORYA || null, ACTIVE || 'Y', req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE — Admin మాత్రమే (soft delete)
router.delete('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE category SET ACTIVE='N' WHERE CATEGORYID=?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;