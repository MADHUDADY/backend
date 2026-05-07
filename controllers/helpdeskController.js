// backend/controllers/helpdeskController.js
const db = require('../config/db');

// ── Helper: generate ticket number ────────────────────────────────────────────
async function genTicketNo() {
  const year = new Date().getFullYear();
  const [[{ cnt }]] = await db.query(
    'SELECT COUNT(*) AS cnt FROM helpdesk_tickets WHERE YEAR(created_at) = ?',
    [year]
  );
  return `HD-${year}-${String(cnt + 1).padStart(4, '0')}`;
}

// ── Helper: log activity ──────────────────────────────────────────────────────
async function logActivity(ticketId, actor, action, note = null) {
  await db.query(
    'INSERT INTO helpdesk_activities (ticket_id, actor, action, note) VALUES (?, ?, ?, ?)',
    [ticketId, actor || 'System', action, note]
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/helpdesk/categories
const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM hd_categories WHERE is_active = 1 ORDER BY name'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TICKETS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/helpdesk/tickets/stats
const getStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*)                                                      AS total,
        SUM(status = 'Open')                                          AS open,
        SUM(status = 'In Progress')                                   AS in_progress,
        SUM(status = 'On Hold')                                       AS on_hold,
        SUM(status IN ('Resolved','Closed'))                          AS resolved,
        SUM(status = 'Cancelled')                                     AS cancelled,
        SUM(priority = 'Critical')                                    AS critical,
        SUM(priority = 'High')                                        AS high,
        SUM(DATE(created_at) = CURDATE())                             AS today,
        SUM(
          status NOT IN ('Resolved','Closed','Cancelled')
          AND due_date IS NOT NULL
          AND due_date < CURDATE()
        )                                                             AS overdue
      FROM helpdesk_tickets
    `);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/helpdesk/tickets
const getAllTickets = async (req, res) => {
  try {
    const {
      status, priority, category_id,
      search, page = 1, limit = 20
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where  = ['1=1'];
    const params = [];

    if (status)      { where.push('t.status = ?');      params.push(status); }
    if (priority)    { where.push('t.priority = ?');    params.push(priority); }
    if (category_id) { where.push('t.category_id = ?'); params.push(category_id); }
    if (search) {
      where.push('(t.ticket_no LIKE ? OR t.title LIKE ? OR t.raised_by_name LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const whereStr = where.join(' AND ');

    const [rows] = await db.query(
      `SELECT
         t.*,
         c.name  AS category_name,
         c.icon  AS category_icon,
         c.color AS category_color
       FROM helpdesk_tickets t
       LEFT JOIN hd_categories c ON t.category_id = c.id
       WHERE ${whereStr}
       ORDER BY
         FIELD(t.priority,'Critical','High','Medium','Low'),
         FIELD(t.status,'Open','In Progress','On Hold','Resolved','Closed','Cancelled'),
         t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM helpdesk_tickets t
       WHERE ${whereStr}`,
      params
    );

    res.json({
      success: true,
      data:    rows,
      total,
      page:    Number(page),
      limit:   Number(limit),
    });
  } catch (err) {
    console.error('getAllTickets error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/helpdesk/tickets/:id
const getTicketById = async (req, res) => {
  try {
    const [[ticket]] = await db.query(
      `SELECT
         t.*,
         c.name  AS category_name,
         c.icon  AS category_icon,
         c.color AS category_color
       FROM helpdesk_tickets t
       LEFT JOIN hd_categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (!ticket)
      return res.status(404).json({ success: false, message: 'Ticket not found' });

    const [activities] = await db.query(
      'SELECT * FROM helpdesk_activities WHERE ticket_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ success: true, data: { ...ticket, activities } });
  } catch (err) {
    console.error('getTicketById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/helpdesk/tickets
const createTicket = async (req, res) => {
  try {
    const {
      title, description, category_id, priority,
      raised_by_name, raised_by_dept, raised_by_phone, raised_by_email,
      location, asset_tag, due_date, clinic_id,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ success: false, message: 'Title is required' });

    const ticket_no = await genTicketNo();

    const [result] = await db.query(
      `INSERT INTO helpdesk_tickets
         (ticket_no, title, description, category_id, priority,
          raised_by_name, raised_by_dept, raised_by_phone, raised_by_email,
          location, asset_tag, due_date, clinic_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        ticket_no,
        title.trim(),
        description    || null,
        category_id    || null,
        priority       || 'Medium',
        raised_by_name || null,
        raised_by_dept || null,
        raised_by_phone|| null,
        raised_by_email|| null,
        location       || null,
        asset_tag      || null,
        due_date       || null,
        clinic_id      || 101,
      ]
    );

    await logActivity(
      result.insertId,
      raised_by_name || 'User',
      'Ticket created',
      title.trim()
    );

    res.status(201).json({
      success:   true,
      message:   'Ticket created successfully',
      id:        result.insertId,
      ticket_no,
    });
  } catch (err) {
    console.error('createTicket error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/helpdesk/tickets/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status, note, actor } = req.body;
    const allowed = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Cancelled'];

    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status value' });

    const setClauses = ['status = ?', 'updated_at = NOW()'];
    const params     = [status];

    if (status === 'Resolved') { setClauses.push('resolved_at = NOW()'); }
    if (status === 'Closed')   { setClauses.push('closed_at = NOW()'); }

    params.push(req.params.id);

    const [result] = await db.query(
      `UPDATE helpdesk_tickets SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Ticket not found' });

    await logActivity(
      req.params.id,
      actor || 'Admin',
      `Status changed to ${status}`,
      note || null
    );

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/helpdesk/tickets/:id/assign
const assignTicket = async (req, res) => {
  try {
    const { assigned_to, actor } = req.body;

    if (!assigned_to?.trim())
      return res.status(400).json({ success: false, message: 'assigned_to is required' });

    const [result] = await db.query(
      `UPDATE helpdesk_tickets
       SET
         assigned_to = ?,
         assigned_at = NOW(),
         status      = IF(status = 'Open', 'In Progress', status),
         updated_at  = NOW()
       WHERE id = ?`,
      [assigned_to.trim(), req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Ticket not found' });

    await logActivity(
      req.params.id,
      actor || 'Admin',
      `Assigned to ${assigned_to.trim()}`
    );

    res.json({ success: true, message: 'Ticket assigned successfully' });
  } catch (err) {
    console.error('assignTicket error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/helpdesk/tickets/:id/resolve
const resolveTicket = async (req, res) => {
  try {
    const { resolution_note, actor } = req.body;

    const [result] = await db.query(
      `UPDATE helpdesk_tickets
       SET
         status          = 'Resolved',
         resolution_note = ?,
         resolved_at     = NOW(),
         updated_at      = NOW()
       WHERE id = ?`,
      [resolution_note || null, req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Ticket not found' });

    await logActivity(
      req.params.id,
      actor || 'IT Staff',
      'Ticket resolved',
      resolution_note || null
    );

    res.json({ success: true, message: 'Ticket resolved successfully' });
  } catch (err) {
    console.error('resolveTicket error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/helpdesk/tickets/:id/comment
const addComment = async (req, res) => {
  try {
    const { note, actor } = req.body;

    if (!note?.trim())
      return res.status(400).json({ success: false, message: 'Comment note is required' });

    await logActivity(
      req.params.id,
      actor || 'User',
      'Comment added',
      note.trim()
    );

    await db.query(
      'UPDATE helpdesk_tickets SET updated_at = NOW() WHERE id = ?',
      [req.params.id]
    );

    res.status(201).json({ success: true, message: 'Comment added successfully' });
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/helpdesk/tickets/:id  (soft delete → Cancelled)
const cancelTicket = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE helpdesk_tickets
       SET status = 'Cancelled', updated_at = NOW()
       WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Ticket not found' });

    await logActivity(req.params.id, 'Admin', 'Ticket cancelled');

    res.json({ success: true, message: 'Ticket cancelled successfully' });
  } catch (err) {
    console.error('cancelTicket error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
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
};