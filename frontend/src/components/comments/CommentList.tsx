'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Avatar,
  Button,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Spin,
  Typography,
} from 'antd';
import { UserOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Comment, User } from '@/types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CommentListProps {
  postId: string;
  currentUser: User | null;
}

interface CommentNode {
  comment: Comment;
  children: CommentNode[];
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach(comment => {
    map.set(comment._id, { comment, children: [] });
  });

  comments.forEach(comment => {
    const node = map.get(comment._id)!;
    if (comment.parentComment && map.has(comment.parentComment)) {
      map.get(comment.parentComment)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function CommentItem({
  node,
  postId,
  currentUser,
  onRefresh,
  depth,
}: {
  node: CommentNode;
  postId: string;
  currentUser: User | null;
  onRefresh: () => void;
  depth: number;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { comment, children } = node;

  const isAuthor = currentUser && currentUser.id === (comment.author as unknown as { _id: string })._id;

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

  const handleSubmitReply = async (values: { content: string }) => {
    if (!currentUser) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      await api.createComment(postId, {
        content: values.content,
        parentComment: comment._id,
      });
      message.success('回复成功');
      form.resetFields();
      setReplying(false);
      onRefresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteComment(comment._id);
      message.success('评论已删除');
      onRefresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  return (
    <div style={{ marginLeft: depth > 0 ? 48 : 0 }}>
      <div style={{ display: 'flex', gap: 12, padding: '12px 0' }}>
        <Avatar
          size="small"
          icon={<UserOutlined />}
          style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={8} align="center">
            <Text strong>{comment.author?.username || '匿名'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDate(comment.createdAt)}
            </Text>
          </Space>
          <Paragraph style={{ marginBottom: 4, marginTop: 4 }}>
            {comment.content}
          </Paragraph>
          <Space size={12}>
            <Button
              type="text"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => setReplying(!replying)}
              style={{ padding: 0, height: 'auto' }}
            >
              回复
            </Button>
            {isAuthor && (
              <Popconfirm
                title="确定要删除这条评论吗？"
                onConfirm={handleDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  style={{ padding: 0, height: 'auto' }}
                >
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>

          {replying && (
            <Form
              form={form}
              onFinish={handleSubmitReply}
              style={{ marginTop: 8 }}
            >
              <Form.Item name="content" rules={[{ required: true, message: '请输入回复内容' }]}>
                <TextArea rows={2} placeholder="写下你的回复…" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting} size="small">
                    回复
                  </Button>
                  <Button size="small" onClick={() => { setReplying(false); form.resetFields(); }}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </div>
      </div>

      {children.length > 0 && (
        <div>
          {children.map(child => (
            <CommentItem
              key={child.comment._id}
              node={child}
              postId={postId}
              currentUser={currentUser}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentList({ postId, currentUser }: CommentListProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchComments = useCallback(async () => {
    try {
      const data = await api.getComments(postId);
      setComments(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取评论失败');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (values: { content: string }) => {
    if (!currentUser) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      await api.createComment(postId, { content: values.content });
      message.success('评论成功');
      form.resetFields();
      fetchComments();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const tree = buildCommentTree(comments);

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        评论 ({comments.length})
      </Typography.Title>

      <Form form={form} onFinish={handleSubmit} style={{ marginBottom: 24 }}>
        <Form.Item name="content" rules={[{ required: true, message: '请输入评论内容' }]}>
          <TextArea rows={3} placeholder="写下你的评论…" />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={submitting}>
            发表评论
          </Button>
        </Form.Item>
      </Form>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin />
        </div>
      ) : tree.length === 0 ? (
        <Text type="secondary">暂无评论，来发表第一条评论吧！</Text>
      ) : (
        tree.map(node => (
          <CommentItem
            key={node.comment._id}
            node={node}
            postId={postId}
            currentUser={currentUser}
            onRefresh={fetchComments}
            depth={0}
          />
        ))
      )}
    </div>
  );
}
