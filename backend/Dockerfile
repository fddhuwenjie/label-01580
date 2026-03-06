# Backend Dockerfile - NestJS
# 支持多平台架构 (ARM64 和 AMD64)

# ============ 构建阶段 ============
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖（包括开发依赖用于构建）
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# ============ 生产阶段 ============
FROM node:20-alpine AS production

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 复制依赖文件并安装生产依赖
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 启动应用
CMD ["node", "dist/main.js"]
