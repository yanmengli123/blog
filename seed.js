/**
 * 填充虚拟博客文章数据
 * 运行方式: node seed.js
 */
require('dotenv').config();
const db = require('./models/database');

async function seed() {
    await db.initSQL();

    const existing = db.getPosts({ limit: 1 });
    if (existing.length > 0) {
        console.log('已有文章数据，跳过填充。如需重新填充请先删除 database/blog.db');
        return;
    }

    console.log('开始填充文章...\n');

    // 标签（可能已存在，跳过重复）
    const tagList = [
        { name: 'Java', slug: 'java' },
        { name: 'Spring Boot', slug: 'spring-boot' },
        { name: 'Linux', slug: 'linux' },
        { name: 'Docker', slug: 'docker' },
        { name: 'Python', slug: 'python' },
        { name: 'Git', slug: 'git' },
        { name: 'MySQL', slug: 'mysql' },
        { name: 'Redis', slug: 'redis' },
        { name: 'Nginx', slug: 'nginx' },
        { name: 'Vue', slug: 'vue' },
        { name: 'AI', slug: 'ai' },
        { name: 'tool', slug: 'tool' },
        { name: 'resource', slug: 'resource' },
        { name: 'essay', slug: 'essay' },
    ];
    tagList.forEach(t => { try { db.createTag(t); } catch (e) { } });

    const posts = [
        // ===== 置顶 =====
        {
            title: '「置顶」JetBrains 全家桶最新版本激活破解教程',
            slug: 'jetbrains-crack',
            excerpt: '主要使用 zhile/ja-netfilter 进行激活，支持 IDEA、PyCharm、WebStorm 等全家桶所有产品，亲测有效，持续更新。',
            content: `# JetBrains 全家桶激活教程

> 免责声明：本文仅供学习交流，请支持正版软件。

## 方式一：一键激活（推荐）

打开 PowerShell（管理员），执行：

\`\`\`bash
irm ckey.run|iex
\`\`\`

等待脚本自动配置完成，重启 IDE 即可。

## 方式二：手动配置

### 1. 下载 ja-netfilter

访问 https://github.com/zhile-io/ja-netfilter ，下载对应版本的压缩包并解压。

### 2. 配置 VM 选项

在 IDE 中打开 Help -> Edit Custom VM Options...，添加：

\`\`\`
-javaagent:/path/to/ja-netfilter/ja-netfilter.jar=configfile
\`\`\`

### 3. 安装 IDE Eval Reset 插件

下载地址：https://plugins.zhile.io/ ，安装后重启 IDE。

## 常见问题

Q: 激活后过期怎么办？
A: 重启 IDE，或在 Help -> Eval Reset 中重置试用期。

Q: 方式一执行失败？
A: 检查网络代理，或使用方式二手动配置。

---

持续更新中，如有问题可在评论区留言。`,
            cover_image: 'https://images.unsplash.com/photo-1623479322729-28b25c16b011?w=800&q=80',
            category_id: 2, is_pinned: 1,
            tags: ['tool', 'resource'], views: 2847,
        },
        {
            title: '「置顶」Halo 博客搭建完全指南 - 从零到上线',
            slug: 'halo-setup-guide',
            excerpt: '使用 Docker 部署 Halo 博客系统，配合 Nginx 反向代理和域名配置，手把手带你搭建个人博客。',
            content: `# Halo 博客搭建完全指南

## 环境准备

- 一台云服务器（推荐 2核2G 以上）
- 域名（可选）
- Docker 和 Docker Compose

## 安装 Docker

\`\`\`bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
\`\`\`

## 创建 docker-compose.yml

\`\`\`yaml
version: "3.8"
services:
  halo:
    image: halohub/halo:2.14
    container_name: halo
    restart: on-failure:3
    ports:
      - "8090:8090"
    volumes:
      - ./halo:/root/.halo2
    environment:
      - SPRING_RUNTIMECONFIG_OPTS=--add-opens=java.base/java.lang=ALL-UNNAMED
      - HALO_EXTERNAL_URL=https://your-domain.com/
      - HALO_SECURITY_INITIALIZER__SUPERADMINUSERNAME=admin
      - HALO_SECURITY_INITIALIZER__SUPERADMINPASSWORD=P@ssw0rd123
\`\`\`

## 启动

\`\`\`bash
docker-compose up -d
\`\`\`

访问 http://your-server:8090 即可进入后台。

## 配置 Nginx 反向代理

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

## HTTPS 配置

\`\`\`bash
certbot --nginx -d your-domain.com
\`\`\`

完成！你的博客已上线。`,
            cover_image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
            category_id: 1, is_pinned: 1,
            tags: ['Docker', 'Linux', 'Nginx', 'tool'], views: 1923,
        },

        // ===== 技术文章 =====
        {
            title: 'Spring Boot 3.x 快速入门实战',
            slug: 'springboot-quickstart',
            excerpt: '从零开始搭建 Spring Boot 3.x 项目，整合 MySQL、Redis、MyBatis-Plus，告别 CRUD 重复劳动。',
            content: `# Spring Boot 3.x 快速入门

## 创建项目

使用 Spring Initializr 或 IDEA 创建，选择以下依赖：
- Spring Web
- Spring Data JPA
- MySQL Driver
- Redis
- Lombok

## 项目结构

\`\`\`
src/main/java/com/example/demo/
  DemoApplication.java
  controller/UserController.java
  service/UserService.java
  mapper/UserMapper.java
  entity/User.java
  config/RedisConfig.java
\`\`\`

## 配置文件

\`\`\`yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo
    username: root
    password: 123456
  data:
    redis:
      host: localhost
      port: 6379
\`\`\`

## RESTful 接口

\`\`\`java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping
    public Result<?> list() {
        return Result.success(userService.list());
    }

    @PostMapping
    public Result<?> add(@RequestBody User user) {
        userService.save(user);
        return Result.success();
    }
}
\`\`\`

## 统一响应封装

\`\`\`java
@Data
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.setCode(200);
        r.setMessage("success");
        r.setData(data);
        return r;
    }
}
\`\`\``,
            cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
            category_id: 1, is_pinned: 0,
            tags: ['Java', 'Spring Boot', 'MySQL', 'Redis'], views: 856,
        },
        {
            title: 'Docker 从入门到精通 - 常用命令速查',
            slug: 'docker-commands',
            excerpt: '整理了日常开发中最常用的 Docker 命令，涵盖镜像、容器、网络、数据卷的完整操作指南。',
            content: `# Docker 常用命令速查

## 镜像操作

\`\`\`bash
# 拉取镜像
docker pull ubuntu:22.04

# 查看本地镜像
docker images

# 删除镜像
docker rmi <image_id>

# 构建镜像
docker build -t myapp:1.0 .

# 推送镜像
docker push myuser/myapp:1.0
\`\`\`

## 容器操作

\`\`\`bash
# 创建并启动容器
docker run -it --name myubuntu ubuntu:22.04

# 后台运行
docker run -d -p 8080:80 --name nginx nginx

# 查看运行中容器
docker ps

# 进入容器
docker exec -it <container> /bin/bash

# 查看日志
docker logs -f <container>

# 删除容器
docker rm <container>
\`\`\`

## 数据卷

\`\`\`bash
# 创建数据卷
docker volume create mydata

# 挂载数据卷
docker run -v mydata:/data ubuntu

# 绑定宿主机目录
docker run -v /host/path:/container/path ubuntu
\`\`\`

## Docker Compose

\`\`\`bash
docker-compose up -d
docker-compose down
docker-compose logs -f
docker-compose up -d --build
\`\`\`

## 常用参数

| 参数 | 说明 |
|------|------|
| -d | 后台运行 |
| -p 8080:80 | 端口映射 |
| -v | 数据卷挂载 |
| -e KEY=VALUE | 环境变量 |
| --name | 容器名 |`,
            cover_image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80',
            category_id: 1, is_pinned: 0,
            tags: ['Docker', 'Linux', 'tool'], views: 1342,
        },
        {
            title: 'Git 常用命令与团队协作规范',
            slug: 'git-workflow',
            excerpt: 'Git 常用命令汇总，以及团队开发中的分支管理规范，告别 git revert 的噩梦。',
            content: `# Git 常用命令与协作规范

## 基础命令

\`\`\`bash
git init
git clone https://github.com/user/repo.git
git add .
git add file.txt
git commit -m "feat: 添加登录功能"
git push origin main
git pull origin main
\`\`\`

## 分支管理

\`\`\`bash
# 查看分支
git branch

# 创建并切换
git checkout -b feature/login

# 切换分支
git checkout main

# 合并分支
git merge feature/login

# 删除分支
git branch -d feature/login
\`\`\`

## 撤销操作

\`\`\`bash
# 撤销工作区修改
git checkout -- file.txt

# 撤销暂存
git reset HEAD file.txt

# 回退提交（保留修改）
git reset --soft HEAD~1

# 回退提交（丢弃修改）
git reset --hard HEAD~1
\`\`\`

## 团队协作规范

### 分支命名
\`\`\`
feature/功能描述
bugfix/问题描述
hotfix/紧急修复
release/版本号
\`\`\`

### 提交信息规范
\`\`\`
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具
\`\`\`

### 推荐工作流

1. main 分支保持稳定可发布
2. develop 分支作为开发基准
3. 从 develop 创建 feature/ 分支开发
4. 完成后合并回 develop
5. hotfix/ 从 main 创建，修复后合并回两者`,
            cover_image: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&q=80',
            category_id: 1, is_pinned: 0,
            tags: ['Git', 'tool'], views: 689,
        },
        {
            title: 'Nginx 配置详解 - 反向代理、HTTPS、负载均衡',
            slug: 'nginx-config',
            excerpt: 'Nginx 常用配置整理：反向代理、HTTPS、负载均衡、静态资源、限流防盗链，收藏备用！',
            content: `# Nginx 配置详解

## 反向代理

\`\`\`nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

## 负载均衡

\`\`\`nginx
upstream backend {
    server 192.168.1.10:8080 weight=3;
    server 192.168.1.11:8080 weight=1;
    server 192.168.1.12:8080 backup;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
\`\`\`

## HTTPS 配置

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/ssl/certs/example.com.pem;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
\`\`\`

## 静态资源

\`\`\`nginx
server {
    root /var/www/html;
    index index.html;

    location /static/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
\`\`\`

## 限流

\`\`\`nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
    }
}
\`\`\``,
            cover_image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
            category_id: 1, is_pinned: 0,
            tags: ['Nginx', 'Linux', 'tool'], views: 923,
        },
        {
            title: 'Python 自动化脚本实战 - 让重复工作说再见',
            slug: 'python-automation',
            excerpt: '分享几个实用的 Python 自动化脚本：批量重命名文件、自动签到、爬取网页数据，解放双手！',
            content: `# Python 自动化脚本实战

## 1. 批量重命名文件

\`\`\`python
import os

folder = "./files"
prefix = "文档_"

for i, filename in enumerate(sorted(os.listdir(folder)), 1):
    if filename.endswith(('.txt', '.pdf')):
        ext = os.path.splitext(filename)[1]
        new_name = f"{prefix}{i:03d}{ext}"
        os.rename(
            os.path.join(folder, filename),
            os.path.join(folder, new_name)
        )
        print(f"OK: {filename} -> {new_name}")
\`\`\`

## 2. 自动签到脚本

\`\`\`python
import requests
import schedule
import time

session = requests.Session()

def login():
    resp = session.post("https://example.com/api/login", json={
        "username": "your_username",
        "password": "your_password"
    })
    return resp.json().get("token")

def sign(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = session.post("https://example.com/api/sign", headers=headers)
    print(f"签到结果: {resp.json()}")

def job():
    token = login()
    if token:
        sign(token)

schedule.every().day.at("08:00").do(job)

while True:
    schedule.run_pending()
    time.sleep(60)
\`\`\`

## 3. 图片爬虫

\`\`\`python
import requests
from bs4 import BeautifulSoup
import os

def download_images(keyword, num=10):
    headers = {"User-Agent": "Mozilla/5.0"}
    url = f"https://example.com/search?q={keyword}"
    resp = requests.get(url, headers=headers)
    soup = BeautifulSoup(resp.text, "html.parser")

    os.makedirs(keyword, exist_ok=True)

    for i, img in enumerate(soup.select("img")[:num], 1):
        src = img.get("src")
        if src and src.startswith("http"):
            data = requests.get(src).content
            with open(f"{keyword}/{i}.jpg", "wb") as f:
                f.write(data)
            print(f"下载 {i}: {src[:50]}...")

download_images("cat", 5)
\`\`\``,
            cover_image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80',
            category_id: 1, is_pinned: 0,
            tags: ['Python', 'tool'], views: 1105,
        },

        // ===== 生活随笔 =====
        {
            title: '2024 年终总结 - 程序员的第四年',
            slug: '2024-yearly-summary',
            excerpt: '回顾 2024，这一年做了不少项目，也踩了很多坑，记录一下自己的成长和感悟。',
            content: `# 2024 年终总结

时间过得真快，转眼间已经是做程序员的第四年了。

## 技术成长

这一年系统地学习了不少东西：

- 后端：从 Spring Boot 2.x 升级到了 3.x，踩了不少兼容性的坑
- DevOps：学会了用 Docker 和 Kubernetes 部署服务
- 数据库：深入学习了 MySQL 索引原理和 Redis 缓存策略
- 前端：用 Vue3 重构了公司项目，体验了一把全栈

## 踩过的坑

### 一次数据库锁表事故

线上环境因为一条 DELETE 语句没带 WHERE 条件，导致全表删除。虽然有备份，但恢复花了 2 小时，教训深刻。

经验：生产环境执行 UPDATE/DELETE 前，必须先 SELECT 确认！

### Docker 容器内存溢出

一个 Python 爬虫脚本在容器里无限吃内存，差点把服务器搞挂。

经验：给容器设置合理的内存限制，添加 OOM 处理。

## 2025 计划

- 系统学习分布式系统
- 搭建自己的技术博客（就是现在这个）
- 开始做技术视频，分享学习心得
- 保持锻炼，身体是革命的本钱

---

感谢这一路上帮助过我的朋友，也感谢一直在努力的自己。`,
            cover_image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
            category_id: 4, is_pinned: 0,
            tags: ['essay'], views: 2341,
        },
        {
            title: '我的装机必备软件清单',
            slug: 'must-have-software',
            excerpt: '整理了一份日常开发和生活使用的软件清单，涵盖了效率工具、开发环境、影音娱乐，每一款都是精挑细选。',
            content: `# 装机必备软件清单

## 开发工具

### IDE 和编辑器
- JetBrains 全家桶 - Java 和 Python 开发必备
- VS Code - 轻量编辑器之神
- Sublime Text - 临时看代码飞快

### 效率工具
- Warp - 现代化的终端，AI 补全超好用
- Docker Desktop - 容器化必备
- Postman - API 调试神器

## 系统工具

- Bandizip - 压缩软件，支持格式多
- Everything - 电脑文件秒搜
- PowerToys - 微软官方效率工具箱
- Snipaste - 截图加贴图，太实用了
- Listary - 全局搜索和快速启动

## 浏览器插件

- uBlock Origin - 广告拦截
- Tampermonkey - 油猴脚本
- Vue Devtools - Vue 调试
- Octotree - GitHub 代码树

## 影音娱乐

- PotPlayer - 播放器之王
- Listen 1 - 聚合音乐软件
- 网易云音乐 - 听歌识曲

## 其他

- 飞书 - 团队协作
- Notion - 笔记和知识库
- Downie - 视频下载`,
            cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
            category_id: 3, is_pinned: 0,
            tags: ['tool', 'resource'], views: 1567,
        },
        {
            title: '使用 AI 工具提升编程效率的实战经验',
            slug: 'ai-coding-assistants',
            excerpt: '分享我日常使用 AI 编程助手（Cursor、Copilot）的经验，如何正确提问、调试代码，以及避坑指南。',
            content: `# AI 编程助手实战经验

## 我用过的 AI 编程工具

- GitHub Copilot - 老牌选手，代码补全强
- Cursor - 专门为代码设计的 AI IDE
- 通义灵码 - 阿里出品，免费够用
- Claude / ChatGPT - 代码解释和 review

## 正确提问方式

错误示范：
> 帮我写个登录功能

正确示范：
> 用 Spring Boot 3 加 MyBatis-Plus 写一个用户登录接口，包含用户名密码校验、token 生成和错误处理，用 JWT 认证，返回统一响应结构

## 实战场景

### 1. 写单元测试

让 AI 根据现有代码生成测试用例，指定：
- 测试框架（JUnit 5 / pytest）
- 覆盖率要求
- 边界条件

### 2. 代码 Review

把代码片段发给 AI，让它指出：
- 潜在 bug
- 安全风险
- 性能问题
- 代码规范

### 3. 学习新技术

用 AI 解释一个陌生的类或框架，比文档更易懂，还能追问。

## 避坑指南

1. 不要完全复制粘贴，理解后再用
2. 注意安全，不要把公司代码发给外部 AI
3. 保留批判思维，AI 也会犯错
4. 用它学习原理，而不只是抄答案

## 总结

AI 是工具，不是替代品。用好它，效率翻倍！`,
            cover_image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
            category_id: 1, is_pinned: 0,
            tags: ['AI', 'tool', 'essay'], views: 1876,
        },
        {
            title: 'Ubuntu 22.04 服务器运维笔记',
            slug: 'ubuntu-server-notes',
            excerpt: '记录日常服务器运维中常用的配置和命令，包括系统优化、防火墙、监控、备份等实用操作。',
            content: `# Ubuntu 22.04 服务器运维笔记

## 系统初始化

\`\`\`bash
# 更新软件源
sudo apt update && sudo apt upgrade -y

# 安装常用工具
sudo apt install curl wget git vim htop net-tools unzip

# 设置时区
sudo timedatectl set-timezone Asia/Shanghai

# 同步时间
sudo apt install chrony
sudo systemctl enable chrony
\`\`\`

## SSH 安全配置

编辑 SSH 配置：sudo vim /etc/ssh/sshd_config

关键配置：
- Port 2222 （改默认端口）
- PermitRootLogin no （禁止 root 登录）
- PasswordAuthentication no （禁用密码登录）
- PubkeyAuthentication yes （启用密钥登录）

重启 SSH：sudo systemctl restart sshd

## 防火墙配置

\`\`\`bash
sudo ufw allow 2222/tcp   # SSH 端口
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
\`\`\`

## 监控

安装 Netdata 监控：bash <(curl -Ss https://my-netdata.io/kickstart.sh)

查看资源：htop、df -h、free -h

## 自动备份脚本

\`\`\`bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup"

# 备份文件
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/html

# 删除 7 天前的备份
find $BACKUP_DIR -mtime +7 -name "*.gz" -delete
\`\`\`

## Swap 配置

\`\`\`bash
# 创建 4G Swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
\`\`\``,
            cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
            category_id: 1, is_pinned: 0,
            tags: ['Linux', 'tool'], views: 745,
        },
    ];

    // 插入文章
    posts.forEach((p, i) => {
        try {
            const r = db.createPost({
                title: p.title,
                slug: p.slug,
                excerpt: p.excerpt,
                content: p.content,
                cover_image: p.cover_image,
                category_id: p.category_id,
                is_pinned: p.is_pinned,
                is_published: 1,
                tags: p.tags || [],
            });

            if (p.views) {
                db.getDb().run('UPDATE posts SET view_count=? WHERE id=?', [p.views, r.lastInsertRowid]);
            }

            if (p.tags) {
                p.tags.forEach(tagName => {
                    const tagSlug = tagName.toLowerCase();
                    const tag = db.all('SELECT id FROM tags WHERE slug=?', [tagSlug])[0];
                    if (tag) {
                        db.getDb().run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [r.lastInsertRowid, tag.id]);
                    }
                });
            }

            const pin = p.is_pinned ? '[置顶] ' : '';
            console.log(`OK [${i + 1}/${posts.length}] ${pin}${p.title.substring(0, 40)}`);
        } catch (e) {
            console.log(`SKIP: ${p.title} (${e.message || e})`);
        }
    });

    db.save();
    console.log(`\n填充完成，共 ${posts.length} 篇文章`);
}

seed().catch(console.error);
