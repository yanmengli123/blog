# 鱼行尺素 - 个人博客

> 书山有路勤为径，学海无涯苦作舟

一个基于 **Tailwind CSS** 构建的简洁美观的多页面静态个人博客。

## 项目结构

```
personal-blog/
├── index.html      # 首页（文章列表 + 侧边栏）
├── about.html      # 关于页面（个人信息 + 贡献图表）
├── friends.html    # 友链页面
├── post.html       # 文章详情页
├── css/
│   ├── style.css   # 自定义样式 + 动画
│   └── themes.css  # 暗色模式补丁
├── js/
│   ├── data.js     # 全局数据（文章、标签、友链）
│   ├── tagcloud.js # 标签云组件
│   ├── charts.js   # ECharts 贡献图表
│   └── main.js     # 主逻辑（搜索、主题、渲染）
├── assets/
│   ├── images/     # 图片资源
│   └── music/      # 背景音乐
└── README.md
```

## 功能特性

- **多页面架构** - 首页 / 关于 / 友链 / 文章详情，四大页面
- **暗色模式** - 一键切换，自动记忆偏好
- **响应式设计** - 完美适配桌面端、移动端
- **文章分类筛选** - 全部 / 计算机 / 资源快速过滤
- **实时搜索** - 按 `/` 键快速调出搜索框
- **分页导航** - 智能页码范围显示
- **标签云** - 可旋转交互的 3D 标签云
- **贡献热力图** - GitHub 风格的提交记录可视化
- **贡献折线图** - ECharts 驱动的贡献趋势图
- **音乐播放器** - 页面内置音乐播放控件
- **评论区** - 留言表单（需后端支持）
- **友链系统** - 卡片网格 + 在线申请表单
- **回到顶部** - 滚动超过 300px 显示

## 快速开始

### 本地预览

```bash
# 直接用浏览器打开 index.html 即可
open index.html

# 或使用任意静态服务器
npx serve .
python -m http.server 8080
```

### 自定义内容

编辑 `js/data.js` 中的数据即可更新：

```javascript
const SITE = { name: '你的博客名', url: 'https://...', ... };
const ARTICLES = [ { title: '文章标题', ... }, ... ];
const FRIENDS   = [ { name: '友链名称', url: '...', ... }, ... ];
const TAGS      = [ { name: '标签', count: 5 }, ... ];
```

### 部署

推荐部署到 **GitHub Pages**：

1. 将整个项目推送到 GitHub 仓库
2. 进入 `Settings → Pages`
3. Source 选择 `main` 分支 `/ (root)`
4. 访问 `https://你的用户名.github.io/仓库名`

## 技术栈

| 技术 | 说明 |
|------|------|
| HTML5 | 语义化标签 |
| Tailwind CSS | 原子化 CSS 框架（CDN 引入） |
| Font Awesome 6 | 图标库 |
| ECharts 5 | 贡献图表可视化 |
| Vanilla JS | 纯原生 JavaScript，无框架依赖 |

## 浏览器支持

- Chrome / Edge 90+
- Firefox 90+
- Safari 14+

## License

MIT © 鱼行尺素
