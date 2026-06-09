'use client';

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { LikeFilled, LikeOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface LikeButtonProps {
  postId: string;
  /** 初始是否点赞 */
  initialLiked: boolean;
  /** 初始点赞数 */
  initialCount: number;
  /** 按钮尺寸（透传给 antd Button） */
  size?: 'small' | 'middle' | 'large';
  /** 是否使用紧凑文本样式（用于卡片内联展示） */
  compact?: boolean;
  /** 点赞数变化回调（点赞或取消点赞后触发） */
  onChange?: (status: { liked: boolean; likeCount: number }) => void;
}

/**
 * 文章点赞按钮。
 *
 * 已登录用户点击切换点赞状态；未登录则提示登录。
 * 内部使用乐观更新 + 接口幂等保证体验流畅。
 */
export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  size = 'middle',
  compact = false,
  onChange,
}: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  /**
   * 点击点赞按钮：根据当前状态调用 like / unlike 接口。
   */
  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      message.info('请先登录后再点赞');
      return;
    }
    if (loading) return;

    setLoading(true);
    const next = !liked;
    // 乐观更新
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    try {
      const res = next ? await api.likePost(postId) : await api.unlikePost(postId);
      setLiked(res.liked);
      setCount(res.likeCount);
      onChange?.(res);
    } catch (err) {
      // 回滚
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
      message.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type={liked ? 'primary' : 'default'}
      size={size}
      icon={liked ? <LikeFilled /> : <LikeOutlined />}
      onClick={handleToggle}
      loading={loading}
      ghost={liked}
      style={compact ? { padding: 0, height: 'auto', border: 'none', boxShadow: 'none' } : undefined}
    >
      {liked ? '已赞' : '点赞'} {count}
    </Button>
  );
}
