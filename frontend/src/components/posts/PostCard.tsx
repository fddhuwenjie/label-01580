'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Typography, Space, Avatar, Tag } from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  LikeOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { Post } from '@/types';

const { Title, Paragraph, Text } = Typography;

interface PostCardProps {
  post: Post;
}

/**
 * 文章卡片：用于列表页展示文章摘要信息及统计数据。
 */
export default function PostCard({ post }: PostCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/posts/${post._id}`}>
      <Card
        hoverable
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Title level={4} style={{ marginBottom: 0 }}>
            {post.title}
          </Title>

          <Paragraph
            ellipsis={{ rows: 2 }}
            type="secondary"
            style={{ marginBottom: 0 }}
          >
            {post.summary || post.content.slice(0, 200)}
          </Paragraph>

          <Space split={<Text type="secondary">·</Text>} wrap>
            <Space size={4}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <Text type="secondary">{post.author?.username || '匿名'}</Text>
            </Space>

            <Space size={4}>
              <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary">{formatDate(post.createdAt)}</Text>
            </Space>

            <Space size={4}>
              <EyeOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary">{post.viewCount} 阅读</Text>
            </Space>

            <Space size={4}>
              <LikeOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary">{post.likeCount ?? 0} 点赞</Text>
            </Space>

            <Space size={4}>
              <MessageOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary">{post.commentCount ?? 0} 评论</Text>
            </Space>

            {!post.published && (
              <Tag color="orange">草稿</Tag>
            )}
          </Space>
        </Space>
      </Card>
    </Link>
  );
}
