'use client';

import React, { useEffect, useState } from 'react';
import { Typography, message } from 'antd';
import AuthGuard from '@/components/auth/AuthGuard';
import PostList from '@/components/posts/PostList';
import { api } from '@/lib/api';
import type { Post } from '@/types';

const { Title } = Typography;

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const data = await api.getMyPosts();
        setPosts(data);
      } catch (error) {
        message.error(error instanceof Error ? error.message : '获取文章列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  return (
    <AuthGuard>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          我的文章
        </Title>
        <PostList posts={posts} loading={loading} />
      </div>
    </AuthGuard>
  );
}
