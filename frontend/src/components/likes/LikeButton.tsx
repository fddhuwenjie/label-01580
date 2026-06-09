'use client';

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const result = await api.toggleLike(postId);
      setLiked(result.liked);
      setCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="text"
      icon={liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
      loading={loading}
      onClick={handleToggle}
      style={{ padding: '4px 8px' }}
    >
      {count}
    </Button>
  );
}
