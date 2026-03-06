# 博客系统

基于 NestJS + Next.js + MongoDB 构建的全栈博客系统。

## How to Run

### 使用 Docker Compose（推荐）

确保已安装 Docker 和 Docker Compose，然后执行：

```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止服务并删除数据卷
docker-compose down -v
```

### 本地开发运行

#### 1. 启动 MongoDB

```bash
# 使用 Docker 启动 MongoDB
docker run -d --name mongodb -p 27017:27017 mongo:7

# 或者本地安装的 MongoDB
mongod --dbpath /path/to/data
```

#### 2. 初始化数据库

```bash
mongosh < backend/scripts/mongo-init.js
```

#### 3. 启动后端

```bash
cd backend
cp env.example .env  # 配置环境变量
npm install
npm run start:dev
```

#### 4. 启动前端

```bash
cd frontend
cp env.local.example .env.local  # 配置环境变量
npm install
npm run dev
```

## Services

| 服务 | 容器名称 | 端口 | 访问地址 |
|------|----------|------|----------|
| 前端 | frontend | 8081 | http://localhost:8081 |
| 后端 | backend | 3001 | http://localhost:3001/api |
| 数据库 | mongodb | 27017 | mongodb://localhost:27017 |

### API 端点

#### 认证

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | 否 |
| POST | /api/auth/login | 用户登录 | 否 |
| GET | /api/auth/profile | 获取当前用户信息 | 是 |

#### 文章

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/posts | 获取文章列表 | 否 |
| GET | /api/posts/my | 获取我的文章 | 是 |
| GET | /api/posts/:id | 获取文章详情 | 否 |
| POST | /api/posts | 创建文章 | 是 |
| PATCH | /api/posts/:id | 更新文章 | 是 |
| DELETE | /api/posts/:id | 删除文章 | 是 |

### 请求示例

```bash
# 注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "123456"}'

# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}'

# 创建文章
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title": "我的第一篇文章", "content": "文章内容...", "published": true}'
```

### 页面路由

| 路径 | 描述 |
|------|------|
| / | 首页，展示所有已发布文章 |
| /auth/login | 用户登录 |
| /auth/register | 用户注册 |
| /posts/[id] | 文章详情 |
| /posts/create | 创建文章（需登录） |
| /posts/edit/[id] | 编辑文章（需登录） |
| /posts/my | 我的文章（需登录） |

## 测试账号

**构建完成后可直接使用以下账号登录：**

| 用户名 | 密码 | 说明 |
|--------|------|------|
| admin | 123456 | 管理员账号 |

**访问地址：** http://localhost:8081

也可以通过注册页面创建新账号。

> ✅ **自动初始化：** 后端服务每次启动时会自动确保测试账号 `admin / 123456` 可用，无需任何手动操作。

## 题目内容

### 原始需求

我打算在这个目录中创建两个工程，一个是nestjs工程，一个是nextjs工程，分别命名为frontend和backend，分别用于前端和后端开发。

请帮忙创建这两个工程的目录结构。具体需求如下：

- 制作一个博客网站，利用上frontend和backend两个工程。
- 分别是前端和后端，前端用于展示博客文章，后端用于处理博客文章的CRUD操作。
- 前端采用nextjs，后端采用nestjs。
- 博客系统有基本的用户体系和文章CRUD功能。UI 采用ant design。
- 所有代码架构都要符合nestjs和nextjs的最佳实践，以及 typescript 最佳实践。
- 数据库我会单独安装MongoDB，用于存储用户信息和博客文章。请将初始化脚本准备好，包括创建数据库和用户集合。
- 我打算用git进行版本控制，分别在frontend和backend目录中初始化git仓库。

### 补充需求

1. 命名规范后端项目文件名叫 backend，前端项目文件名叫 frontend
2. 每个子项目中编写一个Dockerfile（需要包含编译过程、基础镜像要选用跨平台版本同时支持 ARM 和 X86）
3. 根目录增加 docker-compose.yml 和 .gitignore 和 README.md
4. 确保 docker-compose up --build -d 可以正确运行项目
5. 前端项目的对外映射端口为 8081
6. .gitignore 中需要包含所有子项目需要忽略的文件
7. README.md 中需要包含 How to Run、Services、测试账号、题目内容
8. 登录和注册只需要账号密码，不需要邮箱
9. 一进入系统默认显示登录页，登录/注册页不显示头部导航

---

## 项目结构

```
.
├── backend/                    # NestJS 后端
│   ├── src/
│   │   ├── auth/              # 认证模块 (JWT)
│   │   ├── users/             # 用户模块
│   │   ├── posts/             # 文章模块
│   │   └── common/            # 公共模块
│   ├── scripts/
│   │   └── mongo-init.js      # MongoDB 初始化脚本
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js 前端
│   ├── src/
│   │   ├── app/               # App Router 页面
│   │   ├── components/        # React 组件
│   │   ├── context/           # React Context
│   │   ├── lib/               # 工具库
│   │   └── types/             # TypeScript 类型
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Docker Compose 配置
├── .gitignore                  # Git 忽略文件
└── README.md                   # 项目文档
```

## 技术栈

- **后端**: NestJS 10, MongoDB, Mongoose, JWT, Passport
- **前端**: Next.js 14 (App Router), React 18, Ant Design 5, TypeScript
- **数据库**: MongoDB 7
- **容器化**: Docker, Docker Compose

## 功能特性

- 用户注册和登录 (JWT 认证)
- 文章的创建、编辑、删除、查看
- 文章列表和详情页
- 响应式 UI 设计 (Ant Design)
- Docker 容器化部署
