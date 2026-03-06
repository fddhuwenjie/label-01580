// MongoDB 初始化脚本
// 使用方法: mongosh < scripts/mongo-init.js
// 或者在 MongoDB Shell 中运行: load('scripts/mongo-init.js')

// 切换到 blog 数据库（如果不存在则自动创建）
db = db.getSiblingDB('blog');

print('========================================');
print('开始初始化博客数据库...');
print('========================================');

// 创建用户集合并设置索引
print('\n1. 创建 users 集合...');
db.createCollection('users');

// 为 username 字段创建唯一索引
db.users.createIndex({ username: 1 }, { unique: true });
print('   - 已创建 username 唯一索引');

// 为创建时间创建索引
db.users.createIndex({ createdAt: -1 });
print('   - 已创建 createdAt 索引');

// 创建文章集合并设置索引
print('\n2. 创建 posts 集合...');
db.createCollection('posts');

// 为作者创建索引
db.posts.createIndex({ author: 1 });
print('   - 已创建 author 索引');

// 为发布状态和创建时间创建复合索引
db.posts.createIndex({ published: 1, createdAt: -1 });
print('   - 已创建 published + createdAt 复合索引');

// 为创建时间创建索引
db.posts.createIndex({ createdAt: -1 });
print('   - 已创建 createdAt 索引');

// 为标题创建文本索引（支持搜索）
db.posts.createIndex({ title: 'text', content: 'text' });
print('   - 已创建 title + content 文本索引');

// ========================================
// 插入测试用户
// ========================================
print('\n3. 创建测试用户...');

// 密码: 123456 (bcrypt hash)
const adminPassword = '$2a$10$y8RfFOI1XL9/ikUv/3WT4.BBPqjdIb7CC/vTIpElHuZF.CFSaxFGa';
const now = new Date();

// 检查 admin 用户是否已存在
const existingAdmin = db.users.findOne({ username: 'admin' });
if (!existingAdmin) {
  db.users.insertOne({
    username: 'admin',
    password: adminPassword,
    avatar: '',
    bio: '博客管理员',
    createdAt: now,
    updatedAt: now
  });
  print('   - 已创建测试用户: admin / 123456');
} else {
  print('   - 测试用户 admin 已存在，跳过创建');
}

// 获取 admin 用户 ID
const adminUser = db.users.findOne({ username: 'admin' });
const adminId = adminUser._id;

// ========================================
// 插入测试文章
// ========================================
print('\n4. 创建测试文章...');

const existingPosts = db.posts.countDocuments();
if (existingPosts === 0) {
  const posts = [
    {
      title: '欢迎使用博客系统',
      summary: '这是一个基于 Next.js 和 NestJS 构建的现代化博客系统。',
      content: `# 欢迎使用博客系统

这是一个功能完整的博客系统，具有以下特性：

## 技术栈

- **前端**: Next.js 14 + React 18 + Ant Design
- **后端**: NestJS + MongoDB + JWT 认证
- **部署**: Docker + Docker Compose

## 主要功能

1. 用户注册与登录
2. 文章的创建、编辑、删除
3. 文章列表与详情展示
4. 响应式设计，支持移动端

## 快速开始

使用 Docker Compose 一键启动：

\`\`\`bash
docker-compose up --build -d
\`\`\`

访问 http://localhost:8081 即可使用。

祝您使用愉快！`,
      author: adminId,
      published: true,
      viewCount: 10,
      createdAt: new Date(now.getTime() - 86400000 * 2),
      updatedAt: new Date(now.getTime() - 86400000 * 2)
    },
    {
      title: 'JavaScript 异步编程详解',
      summary: '深入理解 Promise、async/await 和事件循环机制。',
      content: `# JavaScript 异步编程详解

JavaScript 是单线程语言，但通过异步编程可以实现非阻塞操作。

## Promise

Promise 是异步编程的基础：

\`\`\`javascript
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('数据加载成功');
    }, 1000);
  });
};
\`\`\`

## async/await

async/await 让异步代码看起来像同步代码：

\`\`\`javascript
async function getData() {
  try {
    const result = await fetchData();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
\`\`\`

## 事件循环

JavaScript 的事件循环机制确保了异步任务的正确执行顺序。宏任务（setTimeout、setInterval）和微任务（Promise.then）有不同的优先级。

理解这些概念对于编写高效的 JavaScript 代码至关重要。`,
      author: adminId,
      published: true,
      viewCount: 25,
      createdAt: new Date(now.getTime() - 86400000),
      updatedAt: new Date(now.getTime() - 86400000)
    },
    {
      title: 'React Hooks 最佳实践',
      summary: '探索 React Hooks 的常见使用模式和性能优化技巧。',
      content: `# React Hooks 最佳实践

React Hooks 彻底改变了我们编写 React 组件的方式。

## useState

状态管理的基础：

\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

## useEffect

处理副作用：

\`\`\`jsx
useEffect(() => {
  document.title = \`点击了 \${count} 次\`;
}, [count]);
\`\`\`

## 自定义 Hooks

封装可复用的逻辑：

\`\`\`jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
\`\`\`

## 性能优化

- 使用 useMemo 缓存计算结果
- 使用 useCallback 缓存函数引用
- 避免不必要的重渲染`,
      author: adminId,
      published: true,
      viewCount: 18,
      createdAt: now,
      updatedAt: now
    }
  ];

  db.posts.insertMany(posts);
  print('   - 已创建 ' + posts.length + ' 篇测试文章');
} else {
  print('   - 文章已存在，跳过创建');
}

print('\n========================================');
print('数据库初始化完成！');
print('========================================');

// 显示集合信息
print('\n集合列表:');
db.getCollectionNames().forEach(function(collection) {
  const count = db[collection].countDocuments();
  print('  - ' + collection + ' (' + count + ' 条记录)');
});

print('\n索引信息:');
print('users 集合索引:');
db.users.getIndexes().forEach(function(index) {
  print('  - ' + JSON.stringify(index.key));
});

print('\nposts 集合索引:');
db.posts.getIndexes().forEach(function(index) {
  print('  - ' + JSON.stringify(index.key));
});

print('\n========================================');
print('测试账号: admin / 123456');
print('========================================');
