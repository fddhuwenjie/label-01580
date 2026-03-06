'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, message } from 'antd';
import AuthGuard from '@/components/auth/AuthGuard';
import PostForm from '@/components/posts/PostForm';
import { api } from '@/lib/api';
import type { CreatePostRequest } from '@/types';

const { Title } = Typography;

export default function CreatePostPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: CreatePostRequest) => {
    setLoading(true);
    try {
      const post = await api.createPost(values);
      message.success('文章发布成功！');
      router.push(`/posts/${post._id}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          写文章
        </Title>
        <PostForm onSubmit={handleSubmit} loading={loading} submitText="发布文章" />
      </div>
    </AuthGuard>
  );
}
