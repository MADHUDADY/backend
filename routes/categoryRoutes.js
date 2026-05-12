const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════════════════════
//  PUBLIC — Kiosk use chestundi (no JWT needed)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/categories — public
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT CATEGORYID, CATEGORYE, CATEGORYA, CENTERID
       FROM category WHERE ACTIVE = 'Y' AND DISPLAY = 'Y'
       ORDER BY CATEGORYE ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/categories/byclinic/:centerId — public
router.get('/byclinic/:centerId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT CATEGORYID, CATEGORYE, CATEGORYA, CENTERID
       FROM category WHERE ACTIVE = 'Y' AND DISPLAY = 'Y' AND CENTERID = ?
       ORDER BY CATEGORYE ASC`,
      [req.params.centerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PROTECTED — JWT required from here
// ══════════════════════════════════════════════════════════════════════════════
router.use(verifyToken);

// POST — Admin only
router.post('/', requireRole('Admin'), async (req, res) => {
  try {
    const { CATEGORYE, CATEGORYA, CENTERID } = req.body;
    if (!CATEGORYE) return res.status(400).json({ success:false, message:'Category name required' });
    const [result] = await db.query(
      `INSERT INTO category (CATEGORYE, CATEGORYA, CENTERID, ACTIVE, DISPLAY, CREATEDDATE)
       VALUES (?, ?, ?, 'Y', 'Y', NOW())`,
      [CATEGORYE, CATEGORYA||null, CENTERID||'101']
    );
    res.status(201).json({ success:true, message:'Category created', id:result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT — Admin only
router.put('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const { CATEGORYE, CATEGORYA, ACTIVE } = req.body;
    const [result] = await db.query(
      `UPDATE category SET CATEGORYE=?, CATEGORYA=?, ACTIVE=? WHERE CATEGORYID=?`,
      [CATEGORYE, CATEGORYA||null, ACTIVE||'Y', req.params.id]
    );
    if (result.affectedRows===0) return res.status(404).json({ success:false, message:'Category not found' });
    res.json({ success:true, message:'Category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE — Admin only
router.delete('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const [result] = await db.query("UPDATE category SET ACTIVE='N' WHERE CATEGORYID=?", [req.params.id]);
    if (result.affectedRows===0) return res.status(404).json({ success:false, message:'Category not found' });
    res.json({ success:true, message:'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;