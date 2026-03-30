/* ===== Frontend API Wrapper ===== */
const API = {
    baseURL: '/api',

    async request(method, path, data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        const res = await fetch(`${this.baseURL}${path}`, options);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || '请求失败');
        return result;
    },

    getSettings()      { return this.request('GET', '/settings'); },
    getProfile()        { return this.request('GET', '/profile'); },
    getPosts(params)    {
        const q = new URLSearchParams(params || {}).toString();
        return this.request('GET', `/posts${q ? '?' + q : ''}`);
    },
    getPostAll()        { return this.request('GET', '/posts/all'); },
    getPost(id)         { return this.request('GET', `/posts/${id}`); },
    getPostCount(params){ const q = new URLSearchParams(params||{}).toString(); return this.request('GET', `/posts/count${q?'?'+q:''}`); },
    getCategories()     { return this.request('GET', '/categories'); },
    getTags()          { return this.request('GET', '/tags'); },
    getFriends()        { return this.request('GET', '/friends'); },
    getStats()          { return this.request('GET', '/stats'); },
    getComments(postId) { return this.request('GET', `/comments?post_id=${postId}`); },
    getRecentComments(limit) { return this.request('GET', `/comments/recent?limit=${limit || 5}`); },
    createComment(data) { return this.request('POST', '/comments', data); },
};

/* ===== Admin API ===== */
const AdminAPI = {
    baseURL: '/admin/api',
    token: localStorage.getItem('admin_token'),

    setToken(t)   { this.token = t; localStorage.setItem('admin_token', t); },
    clearToken() { this.token = null; localStorage.removeItem('admin_token'); },
    isLoggedIn() { return !!this.token; },

    async request(method, path, data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (this.token) options.headers['Authorization'] = `Bearer ${this.token}`;
        if (data && (method === 'POST' || method === 'PUT')) options.body = JSON.stringify(data);
        const res = await fetch(`${this.baseURL}${path}`, options);
        const result = await res.json();
        if (res.status === 401) { this.clearToken(); window.location.href = '/admin'; throw new Error('登录已过期'); }
        if (!res.ok) throw new Error(result.error || '请求失败');
        return result;
    },

    login(u, p)       { return this.request('POST', '/login', { username: u, password: p }); },
    getStats()        { return this.request('GET', '/stats'); },
    getPostCount(p)   { const q = new URLSearchParams(p||{}).toString(); return this.request('GET', `/posts/count${q?'?'+q:''}`); },
    getPosts(p)       { const q = new URLSearchParams(p||{}).toString(); return this.request('GET', `/posts${q?'?'+q:''}`); },
    getPost(id)       { return this.request('GET', `/posts/${id}`); },
    createPost(data)  { return this.request('POST', '/posts', data); },
    updatePost(id, d){ return this.request('PUT', `/posts/${id}`, d); },
    deletePost(id)    { return this.request('DELETE', `/posts/${id}`); },
    getCategories()   { return this.request('GET', '/categories'); },
    createCategory(d) { return this.request('POST', '/categories', d); },
    deleteCategory(id){ return this.request('DELETE', `/categories/${id}`); },
    getTags()         { return this.request('GET', '/tags'); },
    createTag(d)      { return this.request('POST', '/tags', d); },
    deleteTag(id)     { return this.request('DELETE', `/tags/${id}`); },
    getFriends()      { return this.request('GET', '/friends'); },
    createFriend(d)   { return this.request('POST', '/friends', d); },
    updateFriend(id,d){ return this.request('PUT', `/friends/${id}`, d); },
    deleteFriend(id)  { return this.request('DELETE', `/friends/${id}`); },
    getComments()     { return this.request('GET', '/comments'); },
    approveComment(id){ return this.request('PUT', `/comments/${id}/approve`); },
    deleteComment(id) { return this.request('DELETE', `/comments/${id}`); },
    getProfile()      { return this.request('GET', '/profile'); },
    updateProfile(d)  { return this.request('PUT', '/profile', d); },
    getSettings()     { return this.request('GET', '/settings'); },
    updateSettings(d) { return this.request('PUT', '/settings', d); },
    changePassword(o, n) { return this.request('PUT', '/password', { oldPassword: o, newPassword: n }); },
};

/* ===== Toast Helper ===== */
function showToast(message, type = 'success') {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

/* ===== Formatter ===== */
function formatDate(d) {
    const date = new Date(d);
    return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function formatNumber(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;
}
