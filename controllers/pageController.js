const Page = require('../models/Page');

const renderPageView = async (req, res, page) => {
    const record = await Page.findOneAndUpdate(
        { key: page.key, type: page.type },
        { $setOnInsert: { title: page.title, content: '' } },
        { new: true, upsert: true }
    ).lean();

    res.render('page-view', {
        pagePretitle: page.pretitle,
        pageTitle: page.title,
        pageKey: page.key,
        pageType: page.type,
        pageContent: record?.content || '',
        backUrl: page.backUrl,
        activeMenu: page.activeMenu,
        userId: req.session.userId,
        userName: req.session.name,
        sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
    });
};

exports.pagesIndex = (req, res) => {
    const pages = [
        {
            title: 'About',
            description: 'Manage the About page content.',
            viewUrl: '/pages/about',
            editUrl: '/pages/about?edit=1',
            typeLabel: 'Page',
        },
        {
            title: 'Contact',
            description: 'Manage the Contact page content.',
            viewUrl: '/pages/contact',
            editUrl: '/pages/contact?edit=1',
            typeLabel: 'Page',
        },
        {
            title: 'FAQ',
            description: 'Manage the FAQ page content.',
            viewUrl: '/pages/faq',
            editUrl: '/pages/faq?edit=1',
            typeLabel: 'Page',
        },
        {
            title: 'Terms',
            description: 'Manage the Terms and Conditions content.',
            viewUrl: '/pages/terms',
            editUrl: '/pages/terms?edit=1',
            typeLabel: 'Legal',
        },
        {
            title: 'Privacy',
            description: 'Manage the Privacy Policy content.',
            viewUrl: '/pages/privacy',
            editUrl: '/pages/privacy?edit=1',
            typeLabel: 'Legal',
        },
        {
            title: 'Cookies',
            description: 'Manage the Cookies Policy content.',
            viewUrl: '/pages/cookies',
            editUrl: '/pages/cookies?edit=1',
            typeLabel: 'Legal',
        },
    ];

    res.render('pages', {
        pages,
        activeMenu: 'pages',
        userId: req.session.userId,
        userName: req.session.name,
        sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
    });
};

exports.savePage = async (req, res) => {
    try {
        const { key } = req.params;
        const { content, type, title } = req.body;

        const allowedPages = ['about', 'contact', 'faq'];
        const allowedLegal = ['terms', 'privacy', 'cookies'];

        if (type === 'page' && !allowedPages.includes(key)) {
            return res.status(400).json({ error: 'Invalid page key' });
        }

        if (type === 'legal' && !allowedLegal.includes(key)) {
            return res.status(400).json({ error: 'Invalid legal page key' });
        }

        const updated = await Page.findOneAndUpdate(
            { key, type },
            {
                title: title || key,
                content: content || '',
            },
            { new: true, upsert: true }
        ).lean();

        return res.json({ message: 'Page updated successfully', page: updated });
    } catch (error) {
        console.error('Error saving page:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.legalPagesIndex = (req, res) => {
    const pages = [
        {
            title: 'Terms',
            description: 'Manage the Terms and Conditions content.',
            viewUrl: '/legal/terms',
            editUrl: '/legal/terms?edit=1',
        },
        {
            title: 'Privacy',
            description: 'Manage the Privacy Policy content.',
            viewUrl: '/legal/privacy',
            editUrl: '/legal/privacy?edit=1',
        },
        {
            title: 'Cookies',
            description: 'Manage the Cookies Policy content.',
            viewUrl: '/legal/cookies',
            editUrl: '/legal/cookies?edit=1',
        },
    ];

    res.render('legal-pages', {
        pages,
        activeMenu: 'legal-pages',
        userId: req.session.userId,
        userName: req.session.name,
        sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
    });
};

exports.pagesAbout = (req, res) => {
    return renderPageView(req, res, {
        pretitle: 'Pages',
        title: 'About',
        description: 'Manage the About page content.',
        activeMenu: 'pages',
        key: 'about',
        type: 'page',
        backUrl: '/pages',
    });
};

exports.pagesContact = (req, res) => {
    return renderPageView(req, res, {
        pretitle: 'Pages',
        title: 'Contact',
        description: 'Manage the Contact page content.',
        activeMenu: 'pages',
        key: 'contact',
        type: 'page',
        backUrl: '/pages',
    });
};

exports.pagesFaq = (req, res) => {
    return renderPageView(req, res, {
        pretitle: 'Pages',
        title: 'FAQ',
        description: 'Manage the FAQ page content.',
        activeMenu: 'pages',
        key: 'faq',
        type: 'page',
        backUrl: '/pages',
    });
};

exports.legalTerms = (req, res) => {
    return renderPageView(req, res, {
        pretitle: 'Pages',
        title: 'Terms',
        description: 'Manage the Terms and Conditions content.',
        activeMenu: 'pages',
        key: 'terms',
        type: 'legal',
        backUrl: '/pages',
    });
};

exports.legalPrivacy = (req, res) => {
    return renderPageView(req, res, {
        pretitle: 'Pages',
        title: 'Privacy',
        description: 'Manage the Privacy Policy content.',
        activeMenu: 'pages',
        key: 'privacy',
        type: 'legal',
        backUrl: '/pages',
    });
};

exports.legalCookies = (req, res) => {
    return renderPageView(req, res, {
        pretitle: 'Pages',
        title: 'Cookies',
        description: 'Manage the Cookies Policy content.',
        activeMenu: 'pages',
        key: 'cookies',
        type: 'legal',
        backUrl: '/pages',
    });
};

exports.blogsIndex = (req, res) => {
    renderStaticPage(req, res, {
        pretitle: 'Blogs',
        title: 'Blogs',
        description: 'Manage blog posts.',
        activeMenu: 'blogs',
    });
};
