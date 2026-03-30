const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { authMiddleware, generateToken } = require('../middleware/auth');
const slugify = require('slugify');

// 管理后台页面
router.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'login.html')));
router.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'dashboard.html')));
router.get('/posts', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'posts.html')));
router.get('/posts/new', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'post-edit.html')));
router.get('/posts/edit/:id', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'post-edit.html')));
router.get('/friends', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'friends.html')));
router.get('/comments', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'comments.html')));
router.get('/settings', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'settings.html')));

// 登录
router.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = db.getAdmin(username);
        if (!admin || !bcrypt.compareSync(password, admin.password)) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        res.json({ success: true, token: generateToken(admin) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 以下需要认证
router.use('/api/*', authMiddleware);

router.get('/api/stats', (req, res) => {
    try {
        const stats = db.getStats();
        const recentPosts = db.getPosts({ limit: 5 });
        const recentComments = db.getComments().slice(0, 5);
        res.json({ stats, recentPosts, recentComments });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 文章管理
router.get('/api/posts/count', (req, res) => {
    try {
        const { search } = req.query;
        const total = db.getPostCount({ search: search || undefined });
        res.json({ total });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/api/posts', (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const posts = db.getPosts({ page: parseInt(page), limit: parseInt(limit), search });
        posts.forEach(p => { p.tags = p.tag_names ? p.tag_names.split(',') : []; delete p.tag_names; });
        res.json(posts);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/api/posts/:id', (req, res) => {
    try {
        const post = db.getPostById(parseInt(req.params.id));
        if (!post) return res.status(404).json({ error: '不存在' });
        post.tags = post.tag_names ? post.tag_names.split(',') : [];
        delete post.tag_names;
        const tagIds = db.getDb().prepare('SELECT tag_id FROM post_tags WHERE post_id=?').all(post.id).map(t => t.tag_id);
        post.tag_ids = tagIds;
        res.json(post);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/api/posts', (req, res) => {
    try {
        const { title, excerpt, content, cover_image, category_id, is_pinned, is_published, tags } = req.body;
        const slug = slugify(title, { lower: true, strict: true });
        const r = db.createPost({ title, slug, excerpt, content, cover_image, category_id: category_id || null, is_pinned, is_published, tags });
        res.json({ success: true, id: r.lastInsertRowid });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/api/posts/:id', (req, res) => {
    try {
        const { title, excerpt, content, cover_image, category_id, is_pinned, is_published, tags } = req.body;
        const slug = slugify(title, { lower: true, strict: true });
        db.updatePost(parseInt(req.params.id), { title, slug, excerpt, content, cover_image, category_id: category_id || null, is_pinned, is_published, tags });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/api/posts/:id', (req, res) => {
    try { db.deletePost(parseInt(req.params.id)); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// 分类
router.get('/api/categories', (req, res) => { try { res.json(db.getCategories()); } catch (e) { res.status(500).json({ error: e.message }); } });
router.post('/api/categories', (req, res) => {
    try { const { name, description } = req.body; db.createCategory({ name, slug: slugify(name, { lower: true, strict: true }), description }); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/api/categories/:id', (req, res) => { try { db.deleteCategory(parseInt(req.params.id)); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// 标签
router.get('/api/tags', (req, res) => { try { res.json(db.getTags()); } catch (e) { res.status(500).json({ error: e.message }); } });
router.post('/api/tags', (req, res) => {
    try { const { name } = req.body; db.createTag({ name, slug: slugify(name, { lower: true, strict: true }) }); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/api/tags/:id', (req, res) => { try { db.deleteTag(parseInt(req.params.id)); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// 友链
router.get('/api/friends', (req, res) => { try { res.json(db.getAllFriends()); } catch (e) { res.status(500).json({ error: e.message }); } });
router.post('/api/friends', (req, res) => {
    try { const { name, avatar, description, url, color, sort_order } = req.body; db.createFriend({ name, avatar, description, url, color, sort_order }); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/api/friends/:id', (req, res) => {
    try { const { name, avatar, description, url, color, is_active, sort_order } = req.body; db.updateFriend(parseInt(req.params.id), { name, avatar, description, url, color, is_active, sort_order }); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/api/friends/:id', (req, res) => { try { db.deleteFriend(parseInt(req.params.id)); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// 评论
router.get('/api/comments', (req, res) => { try { res.json(db.getComments()); } catch (e) { res.status(500).json({ error: e.message }); } });
router.put('/api/comments/:id/approve', (req, res) => { try { db.approveComment(parseInt(req.params.id)); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
router.delete('/api/comments/:id', (req, res) => { try { db.deleteComment(parseInt(req.params.id)); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// 个人信息
router.get('/api/profile', (req, res) => { try { res.json(db.getProfile()); } catch (e) { res.status(500).json({ error: e.message }); } });
router.put('/api/profile', (req, res) => { try { db.updateProfile(req.body); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// 设置
router.get('/api/settings', (req, res) => { try { res.json(db.getSettings()); } catch (e) { res.status(500).json({ error: e.message }); } });
router.put('/api/settings', (req, res) => { try { db.updateSettings(req.body); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// 改密码
router.put('/api/password', (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const admin = db.getAdmin(req.user.username);
        if (!bcrypt.compareSync(oldPassword, admin.password)) return res.status(400).json({ error: '原密码错误' });
        db.updateAdminPassword(req.user.username, newPassword);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
