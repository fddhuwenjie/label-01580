'use client';

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface LikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
  size?: 'small' | 'middle' | 'large';
}

export default function LikeButton({
  postId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  size = 'small',
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLike = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录后再点赞');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const result = await api.toggleLike(postId);
      setLiked(result.liked);
      setCount(result.likeCount);
      onLikeChange?.(result.liked, result.likeCount);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="text"
      size={size}
      icon={liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
      onClick={handleLike}
      loading={loading}
      style={{ color: liked ? '#ff4d4f' : undefined }}
    >
      {count}
    </Button>
  );
}
