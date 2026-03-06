'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, message, Spin } from 'antd';
import PostList from '@/components/posts/PostList';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Post } from '@/types';

const { Title } = Typography;

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 未登录用户跳转到登录页
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // 已登录用户加载文章列表
    if (isAuthenticated) {
      const fetchPosts = async () => {
        try {
          const data = await api.getPosts();
          setPosts(data);
        } catch (error) {
          message.error(error instanceof Error ? error.message : '获取文章列表失败');
        } finally {
          setLoading(false);
        }
      };

      fetchPosts();
    }
  }, [isAuthenticated, authLoading, router]);

  // 认证加载中
  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 未登录，等待跳转
  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        最新文章
      </Title>
      <PostList posts={posts} loading={loading} />
    </div>
  );
}
