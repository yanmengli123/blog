require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // serves root public/ folder
app.use('/public', express.static(path.join(__dirname, 'public')));

// 初始化数据库
const db = require('./models/database');

async function start() {
    await db.initSQL();

    // 路由
    app.use('/api', require('./routes/api'));
    app.use('/admin', require('./routes/admin'));

    // 前端页面路由
    app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
    app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));
    app.get('/friends', (req, res) => res.sendFile(path.join(__dirname, 'views', 'friends.html')));
    app.get('/post/:id', (req, res) => res.sendFile(path.join(__dirname, 'views', 'post.html')));

    // 404
    app.use((req, res) => {
        res.status(404).send('<h1>404 - 页面不存在</h1><p><a href="/">返回首页</a></p>');
    });

    // 启动
    app.listen(PORT, () => {
        console.log(`\n╔═══════════════════════════════════════════╗`);
        console.log(`║                                           ║`);
        console.log(`║   🚀 博客系统已启动!                      ║`);
        console.log(`║                                           ║`);
        console.log(`║   前台地址: http://localhost:${PORT}          ║`);
        console.log(`║   管理后台: http://localhost:${PORT}/admin   ║`);
        console.log(`║                                           ║`);
        console.log(`║   默认管理员账号:                          ║`);
        console.log(`║   用户名: ${(process.env.ADMIN_USERNAME || 'admin').padEnd(20)}║`);
        console.log(`║   密码:   admin123                        ║`);
        console.log(`║                                           ║`);
        console.log(`╚═══════════════════════════════════════════╝\n`);
    });
}

start().catch(console.error);
