'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Typography, message, Spin } from 'antd';
import AuthGuard from '@/components/auth/AuthGuard';
import PostForm from '@/components/posts/PostForm';
import { api } from '@/lib/api';
import type { Post, CreatePostRequest } from '@/types';

const { Title } = Typography;

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await api.getPost(id);
        setPost(data);
      } catch (error) {
        message.error(error instanceof Error ? error.message : '获取文章失败');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, router]);

  const handleSubmit = async (values: CreatePostRequest) => {
    setSubmitting(true);
    try {
      await api.updatePost(id, values);
      message.success('文章更新成功！');
      router.replace(`/posts/${id}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <AuthGuard>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          编辑文章
        </Title>
        <PostForm
          initialValues={{
            title: post.title,
            content: post.content,
            summary: post.summary,
            published: post.published,
          }}
          onSubmit={handleSubmit}
          loading={submitting}
          submitText="更新文章"
        />
      </div>
    </AuthGuard>
  );
}
