const Subscription = require('../models/Subscription');

exports.subscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find().sort({ createdAt: -1 }).lean();
    return res.render('subscriptions', {
      subscriptions: subs,
      activeMenu: 'subscriptions',
      userId: req.session.userId,
      userName: req.session.name,
      sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
    });
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    return res.status(500).render('error', {
      message: 'Failed to load subscriptions',
      activeMenu: 'subscriptions',
      userId: req.session.userId,
      userName: req.session.name,
      sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
    });
  }
};

exports.download = async (req, res) => {
  try {
    const subs = await Subscription.find().sort({ createdAt: -1 }).lean();

    // Build CSV
    const headers = ['Email', 'Name', 'Source', 'Created At'];
    const rows = subs.map(s => [s.email || '', s.name || '', s.source || '', s.createdAt ? s.createdAt.toISOString() : '']);
    const csvLines = [headers.join(','), ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))];
    const csv = csvLines.join('\n');

    res.setHeader('Content-disposition', 'attachment; filename=subscriptions.csv');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  } catch (error) {
    console.error('Failed to generate download:', error);
    return res.status(500).json({ error: 'Failed to generate download' });
  }
};
