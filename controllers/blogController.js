const fs = require('fs');
const path = require('path');

const Blog = require('../models/Blog');
const { createLog } = require('../modules/logService');

const toSlug = (value) => {
    if (!value) return '';
    return value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const getUniqueSlug = async (base, excludeId = null) => {
    let slug = base || 'blog';
    let counter = 1;

    while (true) {
        const query = excludeId
            ? { slug, _id: { $ne: excludeId } }
            : { slug };
        const exists = await Blog.findOne(query).select('_id').lean();
        if (!exists) return slug;
        slug = `${base}-${counter}`;
        counter += 1;
    }
};

const normalizeTags = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((tag) => tag.trim()).filter(Boolean);
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
};

exports.blogs = async (req, res) => {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();

    res.render('blogs', {
        blogs,
        activeMenu: 'blogs',
        userId: req.session.userId,
        userName: req.session.name,
        sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
    });
};

exports.blogView = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findById(id).lean();

        if (!blog) {
            return res.status(404).render('error', {
                message: 'Blog not found',
                activeMenu: 'blogs',
                userId: req.session.userId,
                userName: req.session.name,
                sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
            });
        }

        return res.render('blog-view', {
            blog,
            activeMenu: 'blogs',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
        });
    } catch (error) {
        console.error('Error loading blog view:', error);
        return res.status(500).render('error', {
            message: 'Failed to load blog',
            activeMenu: 'blogs',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
        });
    }
};

exports.createBlog = async (req, res) => {
    try {
        const { title, slug, excerpt, content, coverImageUrl, tags, status, publishedAt } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const baseSlug = toSlug(slug || title);
        const uniqueSlug = await getUniqueSlug(baseSlug);
        const isActive = status === 'active';

        const blog = await Blog.create({
            title: title.trim(),
            slug: uniqueSlug,
            excerpt,
            content,
            coverImageUrl,
            tags: normalizeTags(tags),
            isActive,
            publishedAt: publishedAt ? new Date(publishedAt) : null,
        });

        createLog({
            req,
            action: 'create',
            entityType: 'blog',
            entityId: blog._id,
            message: `Blog ${blog.title} created by ${req.session?.name || 'system'}`,
            metadata: { title: blog.title, createdBy: req.session?.name || 'system' },
        });

        return res.status(201).json({ message: 'Blog created successfully' });
    } catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, excerpt, content, coverImageUrl, tags, status, publishedAt } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const baseSlug = toSlug(slug || title);
        const uniqueSlug = await getUniqueSlug(baseSlug, id);
        const isActive = status === 'active';

        const updated = await Blog.findByIdAndUpdate(
            id,
            {
                title: title.trim(),
                slug: uniqueSlug,
                excerpt,
                content,
                coverImageUrl,
                tags: normalizeTags(tags),
                isActive,
                publishedAt: publishedAt ? new Date(publishedAt) : null,
            },
            { new: true }
        ).lean();

        if (!updated) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        createLog({
            req,
            action: 'update',
            entityType: 'blog',
            entityId: updated._id,
            message: `Blog ${updated.title} updated by ${req.session?.name || 'system'}`,
            metadata: { title: updated.title, updatedBy: req.session?.name || 'system' },
        });

        return res.json({ message: 'Blog updated successfully' });
    } catch (error) {
        console.error('Error updating blog:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findById(id).lean();
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        if (blog.coverImageUrl && typeof blog.coverImageUrl === 'string' && blog.coverImageUrl.startsWith('/uploads/')) {
            const normalized = blog.coverImageUrl.replace(/^\//, '');
            const filePath = path.join(__dirname, '..', normalized);
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error('Failed to delete blog cover image:', err);
                }
            });
        }

        await Blog.deleteOne({ _id: id });

        createLog({
            req,
            action: 'delete',
            entityType: 'blog',
            entityId: id,
            message: `Blog ${blog.title} deleted by ${req.session?.name || 'system'}`,
            metadata: { title: blog.title, deletedBy: req.session?.name || 'system' },
        });

        return res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
