const Subscription = require('../models/Subscription');

const buildPages = (totalPages, currentPage) =>
  Array.from({ length: totalPages }, (_, i) => ({
    number: i + 1,
    active: i + 1 === currentPage,
  }));

const chunkBy = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

exports.subscriptions = async (req, res) => {
  try {
    const desktopLimit = 40;
    const mobileLimit = 10;
    const pageDesktop = Math.max(1, Number(req.query.pageDesktop) || 1);
    const pageMobile = Math.max(1, Number(req.query.pageMobile) || 1);
    const skipDesktop = (pageDesktop - 1) * desktopLimit;
    const skipMobile = (pageMobile - 1) * mobileLimit;

    const [total, desktopSubs, mobileSubs] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.find()
        .sort({ createdAt: -1 })
        .select('email createdAt')
        .skip(skipDesktop)
        .limit(desktopLimit)
        .lean(),
      Subscription.find()
        .sort({ createdAt: -1 })
        .select('email createdAt')
        .skip(skipMobile)
        .limit(mobileLimit)
        .lean(),
    ]);

    const desktopTotalPages = Math.max(1, Math.ceil(total / desktopLimit));
    const mobileTotalPages = Math.max(1, Math.ceil(total / mobileLimit));

    const desktopColumns = chunkBy(desktopSubs, 10);
    while (desktopColumns.length < 4) {
      desktopColumns.push([]);
    }

    return res.render('subscriptions', {
      desktopColumns,
      mobileSubscriptions: mobileSubs,
      desktopPagination: {
        page: pageDesktop,
        total,
        totalPages: desktopTotalPages,
        hasPrev: pageDesktop > 1,
        hasNext: pageDesktop < desktopTotalPages,
        prevPage: pageDesktop > 1 ? pageDesktop - 1 : null,
        nextPage: pageDesktop < desktopTotalPages ? pageDesktop + 1 : null,
        pages: buildPages(desktopTotalPages, pageDesktop),
      },
      mobilePagination: {
        page: pageMobile,
        total,
        totalPages: mobileTotalPages,
        hasPrev: pageMobile > 1,
        hasNext: pageMobile < mobileTotalPages,
        prevPage: pageMobile > 1 ? pageMobile - 1 : null,
        nextPage: pageMobile < mobileTotalPages ? pageMobile + 1 : null,
        pages: buildPages(mobileTotalPages, pageMobile),
      },
      currentPages: {
        pageDesktop,
        pageMobile,
      },
      desktopMeta: {
        showing: desktopSubs.length,
      },
      mobileMeta: {
        showing: mobileSubs.length,
      },
      limits: {
        desktop: desktopLimit,
        mobile: mobileLimit,
      },
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
