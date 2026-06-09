'use client';

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { LikeOutlined, LikeFilled } from '@ant-design/icons';
import { api } from '@/lib/api';

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onCountChange?: (count: number, liked: boolean) => void;
}

/**
 * 点赞按钮组件
 * - 支持点赞/取消点赞切换
 * - 幂等操作：重复点击取消点赞
 * - 乐观更新UI，失败时回滚
 */
export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  onCountChange,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const prevLiked = liked;
    const prevCount = count;

    const newLiked = !prevLiked;
    const newCount = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setLiked(newLiked);
    setCount(newCount);
    setLoading(true);

    try {
      const result = await api.toggleLike(postId);
      setLiked(result.liked);
      setCount(result.likeCount);
      onCountChange?.(result.likeCount, result.liked);
    } catch (error) {
      setLiked(prevLiked);
      setCount(prevCount);
      message.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type={liked ? 'primary' : 'default'}
      icon={liked ? <LikeFilled /> : <LikeOutlined />}
      onClick={handleToggle}
      loading={loading}
      size="small"
    >
      {count > 0 ? count : '点赞'}
    </Button>
  );
}
