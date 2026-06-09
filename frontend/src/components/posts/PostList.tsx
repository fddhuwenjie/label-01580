'use client';

import React from 'react';
import { Empty, Spin } from 'antd';
import PostCard from './PostCard';
import type { Post } from '@/types';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
}

export default function PostList({ posts, loading = false }: PostListProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Empty
        description="暂无文章"
        style={{ padding: '50px 0' }}
      />
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
