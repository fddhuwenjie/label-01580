import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Post, PostDocument } from '../../posts/schemas/post.schema';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
    await this.seedPosts();
  }

  private async seedAdminUser() {
    const adminUsername = 'admin';
    const adminPassword = '123456';

    try {
      const existingAdmin = await this.userModel.findOne({ username: adminUsername });

      if (existingAdmin) {
        // 重置密码确保可以登录
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await this.userModel.updateOne(
          { username: adminUsername },
          { $set: { password: hashedPassword } }
        );
        this.logger.log(`✅ 测试账号密码已重置: ${adminUsername} / ${adminPassword}`);
      } else {
        // 创建新用户
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await this.userModel.create({
          username: adminUsername,
          password: hashedPassword,
          bio: '博客管理员',
        });
        this.logger.log(`✅ 测试账号已创建: ${adminUsername} / ${adminPassword}`);
      }
    } catch (error) {
      this.logger.error('初始化测试账号失败:', error);
    }
  }

  private async seedPosts() {
    try {
      const postCount = await this.postModel.countDocuments();
      if (postCount > 0) {
        this.logger.log(`📝 文章已存在 (${postCount} 篇)，跳过初始化`);
        return;
      }

      const admin = await this.userModel.findOne({ username: 'admin' });
      if (!admin) {
        this.logger.warn('未找到 admin 用户，跳过文章初始化');
        return;
      }

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

祝您使用愉快！`,
          author: admin._id,
          published: true,
          viewCount: 10,
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

理解这些概念对于编写高效的 JavaScript 代码至关重要。`,
          author: admin._id,
          published: true,
          viewCount: 25,
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

## 性能优化

- 使用 useMemo 缓存计算结果
- 使用 useCallback 缓存函数引用
- 避免不必要的重渲染`,
          author: admin._id,
          published: true,
          viewCount: 18,
        },
      ];

      await this.postModel.insertMany(posts);
      this.logger.log(`📝 已创建 ${posts.length} 篇示例文章`);
    } catch (error) {
      this.logger.error('初始化文章失败:', error);
    }
  }
}
