'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Empty,
  Form,
  Input,
  Popconfirm,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Comment } from '@/types';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface CommentListProps {
  postId: string;
  /** 评论数变化回调（创建/删除评论后触发） */
  onCountChange?: (count: number) => void;
}

interface CommentNode extends Comment {
  children: CommentNode[];
}

/**
 * 将平铺的评论数组按 parent 字段构建成楼中楼树。
 * @param list 评论列表
 */
function buildTree(list: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of list) {
    map.set(c._id, { ...c, children: [] });
  }
  for (const c of list) {
    const node = map.get(c._id)!;
    if (c.parent && map.has(c.parent)) {
      map.get(c.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * 格式化时间为可读字符串。
 */
function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 评论列表 + 评论输入框组件。
 *
 * 支持楼中楼回复：每条评论右下角的"回复"按钮会展开内联输入框，
 * 提交后作为该评论的子节点缩进展示。
 */
export default function CommentList({ postId, onCountChange }: CommentListProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  /**
   * 拉取评论列表。
   */
  const fetchComments = async () => {
    try {
      const data = await api.getComments(postId);
      setComments(data);
      onCountChange?.(data.length);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '获取评论失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const tree = useMemo(() => buildTree(comments), [comments]);

  /**
   * 发表一级评论。
   */
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      message.info('请先登录后再评论');
      return;
    }
    const text = content.trim();
    if (!text) {
      message.warning('请输入评论内容');
      return;
    }
    setSubmitting(true);
    try {
      await api.createComment(postId, { content: text });
      setContent('');
      await fetchComments();
      message.success('评论成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 提交对某条评论的回复。
   */
  const handleReplySubmit = async (parentId: string) => {
    const text = replyContent.trim();
    if (!text) {
      message.warning('请输入回复内容');
      return;
    }
    setSubmitting(true);
    try {
      await api.createComment(postId, { content: text, parent: parentId });
      setReplyTo(null);
      setReplyContent('');
      await fetchComments();
      message.success('回复成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 删除评论（仅作者本人）。
   */
  const handleDelete = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      await fetchComments();
      message.success('已删除');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  /**
   * 递归渲染评论节点。
   */
  const renderNode = (node: CommentNode, depth: number): React.ReactNode => {
    const isOwner = user && user.id === node.author?.id;
    return (
      <div
        key={node._id}
        style={{
          marginLeft: depth === 0 ? 0 : 32,
          paddingTop: 12,
          paddingBottom: 12,
          borderTop: depth === 0 ? '1px solid #f0f0f0' : undefined,
        }}
      >
        <Space align="start" size={12} style={{ width: '100%' }}>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <Space size={8} wrap>
              <Text strong>{node.author?.username || '匿名'}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(node.createdAt)}
              </Text>
            </Space>
            <Paragraph style={{ marginTop: 6, marginBottom: 6, whiteSpace: 'pre-wrap' }}>
              {node.content}
            </Paragraph>
            <Space size={8}>
              {isAuthenticated && (
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  onClick={() => {
                    setReplyTo(replyTo === node._id ? null : node._id);
                    setReplyContent('');
                  }}
                >
                  {replyTo === node._id ? '取消回复' : '回复'}
                </Button>
              )}
              {isOwner && (
                <Popconfirm
                  title="确定删除此评论？"
                  description="该评论下的所有回复也会被删除"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => handleDelete(node._id)}
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ padding: 0 }}
                  >
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>

            {replyTo === node._id && (
              <div style={{ marginTop: 8 }}>
                <TextArea
                  rows={3}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`回复 @${node.author?.username || ''}`}
                  maxLength={1000}
                  showCount
                />
                <Space style={{ marginTop: 8 }}>
                  <Button
                    type="primary"
                    size="small"
                    loading={submitting}
                    onClick={() => handleReplySubmit(node._id)}
                  >
                    发表回复
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent('');
                    }}
                  >
                    取消
                  </Button>
                </Space>
              </div>
            )}

            {node.children.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {node.children.map((child) => renderNode(child, depth + 1))}
              </div>
            )}
          </div>
        </Space>
      </div>
    );
  };

  return (
    <div>
      <Space size={8} style={{ marginBottom: 16 }}>
        <MessageOutlined />
        <Text strong>评论 ({comments.length})</Text>
      </Space>

      <Form layout="vertical" style={{ marginBottom: 16 }}>
        <Form.Item style={{ marginBottom: 8 }}>
          <TextArea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isAuthenticated ? '说点什么吧…' : '登录后即可发表评论'}
            maxLength={1000}
            showCount
            disabled={!isAuthenticated}
          />
        </Form.Item>
        <Button
          type="primary"
          loading={submitting}
          disabled={!isAuthenticated}
          onClick={handleSubmit}
        >
          发表评论
        </Button>
      </Form>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin />
        </div>
      ) : tree.length === 0 ? (
        <Empty description="暂无评论，快来抢沙发" />
      ) : (
        <div>{tree.map((n) => renderNode(n, 0))}</div>
      )}
    </div>
  );
}
