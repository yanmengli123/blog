const express = require('express');
const router = express.Router();
const db = require('../models/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
const { marked } = require('marked');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)),
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片'));
        }
    }
});

// 记录访问
router.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/admin')) {
        db.recordVisit(req.path, req.ip, req.headers['user-agent']);
    }
    next();
});

// 站点设置
router.get('/settings', (req, res) => {
    try { res.json(db.getSettings()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 个人信息
router.get('/profile', (req, res) => {
    try { res.json(db.getProfile()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 文章列表
router.get('/posts', (req, res) => {
    try {
        const { page = 1, limit = 10, category, tag, search, pinned } = req.query;
        const posts = db.getPosts({
            page: parseInt(page), limit: parseInt(limit), category, tag, search,
            pinned: pinned !== undefined ? pinned === 'true' : undefined
        });
        posts.forEach(p => {
            p.tags = p.tag_names ? p.tag_names.split(',') : [];
            delete p.tag_names;
            p.content_html = marked(p.content);
        });
        res.json(posts);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 文章列表（全量，用于上下篇导航）
router.get('/posts/all', (req, res) => {
    try {
        res.json(db.getPostsAll());
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 文章总数（用于分页）
router.get('/posts/count', (req, res) => {
    try {
        const { category, tag, search } = req.query;
        let q = `SELECT COUNT(DISTINCT p.id) as total FROM posts p WHERE p.is_published=1`;
        const params = [];
        if (category) { q += ' AND p.category_id=(SELECT id FROM categories WHERE slug=?)'; params.push(category); }
        if (tag) { q += ' AND EXISTS(SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id=t.id WHERE pt.post_id=p.id AND t.slug=?)'; params.push(tag); }
        if (search) { q += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
        const result = db.get(q, params);
        res.json({ total: result?.total || 0 });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 单篇文章
router.get('/posts/:id', (req, res) => {
    try {
        const raw = req.params.id;
        // 优先按slug查（slug也可能是纯数字），找不到再按ID查
        let post = db.getPostBySlug(raw);
        if (!post) post = db.getPostById(parseInt(raw));
        if (!post) return res.status(404).json({ error: '文章不存在' });
        db.incrementViewCount(post.id);
        post.tags = post.tag_names ? post.tag_names.split(',') : [];
        delete post.tag_names;
        post.content_html = marked(post.content);
        post.comments = db.getComments(post.id);
        res.json(post);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 分类
router.get('/categories', (req, res) => {
    try { res.json(db.getCategories()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 标签
router.get('/tags', (req, res) => {
    try { res.json(db.getTags()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 友链
router.get('/friends', (req, res) => {
    try { res.json(db.getFriends()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 统计
router.get('/stats', (req, res) => {
    try { res.json(db.getStats()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 图表统计数据
router.get('/stats/charts', (req, res) => {
    try {
        res.json({
            monthlyPosts: db.getMonthlyPostStats(),
            categories: db.getCategoryStats(),
            monthlyComments: db.getMonthlyCommentStats(),
            dailyVisits: db.getDailyVisits(30),
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 最新评论（前台侧边栏用）
router.get('/comments/recent', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const comments = db.getComments().slice(0, limit);
        res.json(comments);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 评论列表
router.get('/comments', (req, res) => {
    try {
        const { post_id } = req.query;
        const comments = db.getComments(post_id ? parseInt(post_id) : undefined);
        res.json(comments);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 提交评论
router.post('/comments', (req, res) => {
    try {
        const { post_id, nickname, email, website, content } = req.body;
        if (!post_id || !nickname || !content) return res.status(400).json({ error: '请填写必要信息' });
        const ip = req.ip || '';
        const result = db.createComment({ post_id, nickname, email, website, content, ip_address: ip });
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 文件上传
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: '请选择文件' });
        res.json({ success: true, url: `/images/uploads/${req.file.filename}` });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
