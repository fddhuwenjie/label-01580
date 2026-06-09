'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Card,
  Space,
  Avatar,
  Divider,
  Button,
  Spin,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  MessageOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Post } from '@/types';
import LikeButton from '@/components/likes/LikeButton';
import CommentList from '@/components/comments/CommentList';

const { Title, Paragraph, Text } = Typography;

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const id = params.id as string;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await api.getPost(id);
        setPost(data);
        setLikeCount(data.likeCount ?? 0);
        if (user) {
          try {
            const status = await api.getLikeStatus(id);
            setLiked(status.liked);
            setLikeCount(status.likeCount);
          } catch {
            // ignore like status fetch error
          }
        }
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
  }, [id, router, user]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePost(id);
      message.success('文章已删除');
      router.push('/');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAuthor = user && post?.author && user.id === (post.author as unknown as { _id: string })._id;

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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Space>
              {!post.published && <Tag color="orange">草稿</Tag>}
            </Space>
            <Title level={2} style={{ marginBottom: 16, marginTop: 8 }}>
              {post.title}
            </Title>

            <Space split={<Text type="secondary">·</Text>} wrap>
              <Space size={8}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <Text>{post.author?.username || '匿名'}</Text>
              </Space>

              <Space size={4}>
                <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                <Text type="secondary">{formatDate(post.createdAt)}</Text>
              </Space>

              <Space size={4}>
                <EyeOutlined style={{ color: '#8c8c8c' }} />
                <Text type="secondary">{post.viewCount} 阅读</Text>
              </Space>

              {post.commentCount !== undefined && (
                <Space size={4}>
                  <MessageOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">{post.commentCount} 评论</Text>
                </Space>
              )}

              {post.likeCount !== undefined && (
                <Space size={4}>
                  <HeartOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">{post.likeCount} 喜欢</Text>
                </Space>
              )}
            </Space>
          </div>

          {isAuthor && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => router.push(`/posts/edit/${id}`)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除这篇文章吗？"
                  description="删除后无法恢复"
                  onConfirm={handleDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />} loading={deleting}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </>
          )}

          <Divider />

          <div style={{ minHeight: 200 }}>
            <Paragraph
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {post.content}
            </Paragraph>
          </div>

          <Divider />

          <div>
            <LikeButton
              postId={post._id}
              initialLiked={liked}
              initialCount={likeCount}
            />
          </div>

          <Divider />

          <CommentList postId={post._id} currentUser={user} />
        </Space>
      </Card>
    </div>
  );
}
