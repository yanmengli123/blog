const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

let _db = null;
let _SQL = null;
let _initPromise = null;

const dbPath = path.join(__dirname, '..', 'database', 'blog.db');

// ---------- 底层 sql.js 封装 ----------
function run(sql, params = []) {
    const safe = (params || []).map(p => (p === undefined || p === null) ? null : p);
    _db.run(sql, safe);
    let lastId = 0;
    try {
        const r = _db.exec("SELECT last_insert_rowid() as id");
        if (r.length && r[0].values.length) lastId = r[0].values[0][0];
    } catch (e2) {}
    return { lastInsertRowid: lastId };
}

function get(sql, params = []) {
    const safe = (params || []).map(p => (p === undefined || p === null) ? null : p);
    const r = _db.exec(sql, safe);
    if (!r.length || !r[0].values.length) return null;
    const cols = r[0].columns;
    const vals = r[0].values[0];
    const row = {};
    cols.forEach((c, i) => row[c] = vals[i]);
    return row;
}

function all(sql, params = []) {
    const safe = (params || []).map(p => (p === undefined || p === null) ? null : p);
    const r = _db.exec(sql, safe);
    if (!r.length) return [];
    const cols = r[0].columns;
    return r[0].values.map(row => {
        const o = {};
        cols.forEach((c, i) => o[c] = row[i]);
        return o;
    });
}

// ---------- 持久化 ----------
function saveDb() {
    if (!_db) return;
    const data = _db.export();
    const buf = Buffer.from(data);
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, buf);
}

// ---------- 初始化 ----------
async function initSQL() {
    if (_db) return; // 已有实例，直接返回
    if (_initPromise) return _initPromise; // 正在初始化中

    _initPromise = (async () => {
        _SQL = await initSqlJs();

        if (fs.existsSync(dbPath)) {
            const buf = fs.readFileSync(dbPath);
            _db = new _SQL.Database(buf);
        } else {
            _db = new _SQL.Database();
        }

        _db.run('PRAGMA foreign_keys = ON');

        // 建表
        const schema = `
        CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, excerpt TEXT, content TEXT NOT NULL, cover_image TEXT, category_id INTEGER, is_pinned INTEGER DEFAULT 0, is_published INTEGER DEFAULT 1, view_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL);
        CREATE TABLE IF NOT EXISTS post_tags (post_id INTEGER, tag_id INTEGER, PRIMARY KEY (post_id, tag_id), FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE);
        CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, avatar TEXT, description TEXT, url TEXT NOT NULL, color TEXT DEFAULT '#8b5cf6', is_active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, parent_id INTEGER, nickname TEXT NOT NULL, email TEXT, website TEXT, avatar TEXT, content TEXT NOT NULL, ip_address TEXT, is_approved INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE);
        CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY AUTOINCREMENT, page TEXT NOT NULL, ip_address TEXT, user_agent TEXT, visited_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT, avatar TEXT, signature TEXT, bio TEXT, github_url TEXT, blog_url TEXT, email TEXT, social_links TEXT, skills TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        `;
        schema.split(';').filter(s => s.trim()).forEach(s => _db.run(s.trim()));

        // 迁移：为已存在的 profile 表添加 skills 列（如果不存在）
        try { _db.run("ALTER TABLE profile ADD COLUMN skills TEXT"); } catch(e) {}

        // 迁移：为没有 skills 的现有 profile 填充默认值
        const defaultSkills = JSON.stringify([
            { name: 'Java / Spring Boot / Maven', icon: 'fa-coffee' },
            { name: 'Python / ROS 2 / OpenCV', icon: 'fa-python' },
            { name: 'MySQL / PostgreSQL / Redis', icon: 'fa-database' },
            { name: 'Docker / Linux / Nginx', icon: 'fa-server' },
        ]);
        try { run("UPDATE profile SET skills=? WHERE skills IS NULL OR skills = ''", [defaultSkills]); } catch(e2) {}

        // 检查是否已有管理员
        const adminCount = get('SELECT COUNT(*) as c FROM admins')?.c || 0;
        if (adminCount === 0) {
            console.log('🔧 初始化默认数据...');
            const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
            run('INSERT INTO admins (username, password) VALUES (?, ?)',
                [process.env.ADMIN_USERNAME || 'admin', hash]);

            const defaults = [
                ['site_name', process.env.SITE_NAME || '鱼行尺素'],
                ['site_url', process.env.SITE_URL || 'http://localhost:3000'],
                ['site_description', '书山有路勤为径，学海无涯苦作舟'],
                ['posts_per_page', '10'],
                ['comment_enabled', '1'],
            ];
            defaults.forEach(([k, v]) => run('INSERT INTO settings (key, value) VALUES (?, ?)', [k, v]));

            const defaultSkills = [
                { name: 'Java / Spring Boot / Maven', icon: 'fa-coffee' },
                { name: 'Python / ROS 2 / OpenCV', icon: 'fa-python' },
                { name: 'MySQL / PostgreSQL / Redis', icon: 'fa-database' },
                { name: 'Docker / Linux / Nginx', icon: 'fa-server' },
            ];
            run(`INSERT INTO profile (nickname, avatar, signature, bio, github_url, blog_url, email, social_links, skills) VALUES (?,?,?,?,?,?,?,?,?)`, [
                '鱼行尺素', '/images/avatar.png',
                '书山有路勤为径，学海无涯苦作舟',
                '一名热爱技术、喜欢折腾的程序员，致力于在计算机科学的海洋中不断探索与成长。',
                'https://github.com/duanluan',
                'https://blog.yuxingchisu.com',
                'yuxingchisu@email.com',
                JSON.stringify({ bilibili: 'https://space.bilibili.com/3546655366318097' }),
                JSON.stringify(defaultSkills),
            ]);

            const cats = [['技术','tech'],['资源','resource'],['生活','life'],['随笔','essay']];
            cats.forEach(([n, s]) => run('INSERT INTO categories (name, slug) VALUES (?, ?)', [n, s]));

            const tagList = [['Java','java'],['Spring Boot','spring-boot'],['Linux','linux'],['Docker','docker'],['Python','python'],['Git','git'],['Maven','maven'],['工具','tool'],['AI','ai'],['MySQL','mysql'],['Redis','redis'],['Nginx','nginx'],['资源','resource'],['随笔','essay']];
            tagList.forEach(([n, s]) => run('INSERT INTO tags (name, slug) VALUES (?, ?)', [n, s]));

            const friends = [
                { name: 'Halo 官方', url: 'https://halo.run', desc: '强大易用的开源博客系统', color: '#8b5cf6' },
                { name: 'Joe3 主题', url: 'https://github.com/halo51102/joe3', desc: 'Halo 最受欢迎的主题之一', color: '#3b82f6' },
                { name: 'LinuxMirrors', url: 'https://linuxmirrors.cn', desc: '一键脚本换源工具', color: '#10b981' },
            ];
            friends.forEach(f => run('INSERT INTO friends (name,url,description,color) VALUES (?,?,?,?)', [f.name, f.url, f.desc, f.color]));

            console.log('✅ 默认数据初始化完成');
            saveDb();
        }
    })();

    await _initPromise;
}

// 同步初始化桩（给 server.js 用）
function initialize() {}

// ---------- 业务方法 ----------
const api = {
    initSQL,
    getDb: () => _db,
    save: saveDb,
    all, get,

    getPosts({ page = 1, limit = 10, category, tag, search, pinned } = {}) {
        let q = `SELECT p.*, c.name as category_name,
                 GROUP_CONCAT(DISTINCT t.name) as tag_names
             FROM posts p
             LEFT JOIN categories c ON p.category_id=c.id
             LEFT JOIN post_tags pt ON p.id=pt.post_id
             LEFT JOIN tags t ON pt.tag_id=t.id
             WHERE p.is_published=1`;
        const params = [];
        if (category) { q += ' AND c.slug=?'; params.push(category); }
        if (tag) { q += ' AND t.slug=?'; params.push(tag); }
        if (search) { q += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
        if (pinned !== undefined) { q += ' AND p.is_pinned=?'; params.push(pinned ? 1 : 0); }
        q += ' GROUP BY p.id ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);
        return all(q, params);
    },

    // 获取所有文章（用于上下篇导航）
    getPostsAll() {
        return all(`SELECT id, title, slug, created_at FROM posts WHERE is_published=1 ORDER BY is_pinned DESC, created_at DESC`);
    },

    // 文章总数（支持搜索过滤，用于后台管理）
    getPostCount({ search } = {}) {
        let q = `SELECT COUNT(*) as total FROM posts WHERE is_published=1`;
        const params = [];
        if (search) { q += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
        return get(q, params)?.total || 0;
    },

    getPostById(id) {
        return get(`SELECT p.*,c.name as category_name,GROUP_CONCAT(DISTINCT t.name) as tag_names
            FROM posts p LEFT JOIN categories c ON p.category_id=c.id
            LEFT JOIN post_tags pt ON p.id=pt.post_id LEFT JOIN tags t ON pt.tag_id=t.id
            WHERE p.id=? GROUP BY p.id`, [id]);
    },

    getPostBySlug(slug) {
        return get(`SELECT p.*,c.name as category_name,GROUP_CONCAT(DISTINCT t.name) as tag_names
            FROM posts p LEFT JOIN categories c ON p.category_id=c.id
            LEFT JOIN post_tags pt ON p.id=pt.post_id LEFT JOIN tags t ON pt.tag_id=t.id
            WHERE p.slug=? GROUP BY p.id`, [slug]);
    },

    createPost(p) {
        const r = run(`INSERT INTO posts (title,slug,excerpt,content,cover_image,category_id,is_pinned,is_published)
            VALUES (?,?,?,?,?,?,?,?)`,
            [p.title, p.slug, p.excerpt, p.content, p.cover_image || null,
             p.category_id || null, p.is_pinned ? 1 : 0, p.is_published ? 1 : 0]);
        const postId = r.lastInsertRowid;
        if (p.tags && p.tags.length) {
            p.tags.forEach(tagName => {
                const name = String(tagName);
                // 先按 name 查（中文名），找不到再按 slug 查（英文）
                let tag = get('SELECT id FROM tags WHERE name=?', [name]);
                if (!tag) {
                    const slug = name.toLowerCase();
                    tag = get('SELECT id FROM tags WHERE slug=?', [slug]);
                }
                if (tag) run('INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (?,?)', [postId, tag.id]);
            });
        }
        saveDb();
        return r;
    },

    updatePost(id, p) {
        run(`UPDATE posts SET title=?,slug=?,excerpt=?,content=?,cover_image=?,category_id=?,is_pinned=?,is_published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [p.title, p.slug, p.excerpt, p.content, p.cover_image || null,
             p.category_id || null, p.is_pinned ? 1 : 0, p.is_published ? 1 : 0, id]);
        run('DELETE FROM post_tags WHERE post_id=?', [id]);
        if (p.tags && p.tags.length) {
            p.tags.forEach(tagName => {
                const tagSlug = String(tagName).toLowerCase();
                const tag = get('SELECT id FROM tags WHERE slug=?', [tagSlug]);
                if (tag) run('INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (?,?)', [id, tag.id]);
            });
        }
        saveDb();
    },

    deletePost(id) { run('DELETE FROM posts WHERE id=?', [id]); saveDb(); },
    incrementViewCount(id) { run('UPDATE posts SET view_count=view_count+1 WHERE id=?', [id]); saveDb(); },

    getCategories() {
        return all(`SELECT c.*, COUNT(p.id) as post_count FROM categories c
            LEFT JOIN posts p ON c.id=p.category_id GROUP BY c.id`);
    },

    createCategory(c) {
        const r = run('INSERT INTO categories (name,slug,description) VALUES (?,?,?)',
            [c.name, c.slug, c.description]);
        saveDb();
        return r;
    },

    deleteCategory(id) { run('DELETE FROM categories WHERE id=?', [id]); saveDb(); },

    getTags() {
        return all(`SELECT t.*, COUNT(pt.post_id) as post_count FROM tags t
            LEFT JOIN post_tags pt ON t.id=pt.tag_id GROUP BY t.id`);
    },

    createTag(t) {
        const r = run('INSERT INTO tags (name,slug) VALUES (?,?)', [t.name, t.slug]);
        saveDb();
        return r;
    },

    deleteTag(id) { run('DELETE FROM tags WHERE id=?', [id]); saveDb(); },

    getFriends() { return all('SELECT * FROM friends WHERE is_active=1 ORDER BY sort_order ASC'); },
    getAllFriends() { return all('SELECT * FROM friends ORDER BY sort_order ASC'); },

    createFriend(f) {
        const r = run('INSERT INTO friends (name,avatar,description,url,color,sort_order) VALUES (?,?,?,?,?,?)',
            [f.name, f.avatar || null, f.description || null, f.url, f.color || '#8b5cf6', f.sort_order || 0]);
        saveDb();
        return r;
    },

    updateFriend(id, f) {
        run('UPDATE friends SET name=?,avatar=?,description=?,url=?,color=?,is_active=?,sort_order=? WHERE id=?',
            [f.name, f.avatar || null, f.description || null, f.url, f.color || '#8b5cf6', f.is_active ? 1 : 0, f.sort_order || 0, id]);
        saveDb();
    },

    deleteFriend(id) { run('DELETE FROM friends WHERE id=?', [id]); saveDb(); },

    getComments(postId) {
        if (postId) return all('SELECT * FROM comments WHERE post_id=? AND is_approved=1 ORDER BY created_at DESC', [postId]);
        return all(`SELECT c.*, p.title as post_title FROM comments c LEFT JOIN posts p ON c.post_id=p.id ORDER BY c.created_at DESC`);
    },

    createComment(c) {
        const avatar = `https://cravatar.cn/avatar/${c.email ? crypto.createHash('md5').update(c.email.toLowerCase()).digest('hex') : 'default'}?s=100&d=identicon`;
        const r = run(`INSERT INTO comments (post_id,parent_id,nickname,email,website,avatar,content,ip_address) VALUES (?,?,?,?,?,?,?,?)`,
            [c.post_id || null, c.parent_id || null, c.nickname, c.email || null, c.website || null, avatar, c.content, c.ip_address || '']);
        saveDb();
        return r;
    },

    approveComment(id) { run('UPDATE comments SET is_approved=1 WHERE id=?', [id]); saveDb(); },
    deleteComment(id) { run('DELETE FROM comments WHERE id=?', [id]); saveDb(); },

    getProfile() {
        const p = get('SELECT * FROM profile ORDER BY id DESC LIMIT 1');
        if (p) {
            if (p.social_links) { try { p.social_links = JSON.parse(p.social_links); } catch(e) {} }
            if (p.skills) { try { p.skills = JSON.parse(p.skills); } catch(e) { p.skills = []; } }
            else { p.skills = []; }
        }
        return p;
    },

    updateProfile(p) {
        run(`UPDATE profile SET nickname=?,avatar=?,signature=?,bio=?,github_url=?,blog_url=?,email=?,social_links=?,skills=?,updated_at=CURRENT_TIMESTAMP WHERE id=(SELECT id FROM profile ORDER BY id DESC LIMIT 1)`,
            [p.nickname || null, p.avatar || null, p.signature || null, p.bio || null, p.github_url || null, p.blog_url || null, p.email || null, JSON.stringify(p.social_links || {}), JSON.stringify(p.skills || [])]);
        saveDb();
    },

    getSettings() {
        const s = all('SELECT * FROM settings');
        return s.reduce((a, r) => { a[r.key] = r.value; return a; }, {});
    },

    updateSettings(settings) {
        Object.entries(settings).forEach(([k, v]) => run('UPDATE settings SET value=?,updated_at=CURRENT_TIMESTAMP WHERE key=?', [v, k]));
        saveDb();
    },

    getStats() {
        return {
            totalPosts:    get('SELECT COUNT(*) as c FROM posts WHERE is_published=1')?.c || 0,
            totalComments: get('SELECT COUNT(*) as c FROM comments')?.c || 0,
            totalViews:    get('SELECT SUM(view_count) as t FROM posts')?.t || 0,
            totalFriends: get('SELECT COUNT(*) as c FROM friends WHERE is_active=1')?.c || 0,
            todayVisits:   get("SELECT COUNT(*) as c FROM visits WHERE date(visited_at)=date('now')")?.c || 0,
            totalVisits:   get('SELECT COUNT(*) as c FROM visits')?.c || 0,
            blogCreatedAt: get('SELECT MIN(created_at) as d FROM posts WHERE is_published=1')?.d || null,
        };
    },

    getMonthlyPostStats() {
        // 最近12个月每月文章发布数量
        const rows = all(`
            SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
            FROM posts WHERE is_published=1
            AND created_at >= date('now', '-12 months')
            GROUP BY month ORDER BY month ASC
        `);
        return rows;
    },

    getCategoryStats() {
        const rows = all(`
            SELECT c.name, COUNT(p.id) as count
            FROM categories c
            LEFT JOIN posts p ON c.id=p.category_id AND p.is_published=1
            GROUP BY c.id
        `);
        return rows;
    },

    getMonthlyCommentStats() {
        const rows = all(`
            SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
            FROM comments
            WHERE created_at >= date('now', '-12 months')
            GROUP BY month ORDER BY month ASC
        `);
        return rows;
    },

    getDailyVisits(days = 30) {
        const rows = all(`
            SELECT date(visited_at) as day, COUNT(*) as count
            FROM visits
            WHERE visited_at >= date('now', '-' || ? || ' days')
            GROUP BY day ORDER BY day ASC
        `, [days]);
        return rows;
    },

    recordVisit(page, ip, ua) { run('INSERT INTO visits (page,ip_address,user_agent) VALUES (?,?,?)', [page, ip || '', ua || '']); saveDb(); },

    getAdmin(username) { return get('SELECT * FROM admins WHERE username=?', [username]); },

    updateAdminPassword(username, password) {
        const h = bcrypt.hashSync(password, 10);
        run('UPDATE admins SET password=? WHERE username=?', [h, username]);
        saveDb();
    },
};

module.exports = api;
