'use client';

import React, { useState, useEffect } from 'react';
import {
  List,
  Avatar,
  Input,
  Button,
  message,
  Space,
  Typography,
  Popconfirm,
  Divider,
} from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Comment as CommentType } from '@/types';
import { useRouter } from 'next/navigation';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface CommentSectionProps {
  postId: string;
}

interface CommentItemProps {
  comment: CommentType;
  postId: string;
  onRefresh: () => void;
  depth?: number;
}

function CommentItem({ comment, postId, onRefresh, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const [replyVisible, setReplyVisible] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user && (user.id || user._id) === comment.author._id;

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      message.warning('回复内容不能为空');
      return;
    }

    setSubmitting(true);
    try {
      await api.createComment(postId, {
        content: replyContent,
        parentId: comment._id,
        replyTo: comment.author._id,
      });
      message.success('回复成功');
      setReplyContent('');
      setReplyVisible(false);
      onRefresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteComment(postId, comment._id);
      message.success('删除成功');
      onRefresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ marginLeft: depth > 0 ? 48 : 0, padding: '12px 0' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text strong>{comment.author.username}</Text>
            {comment.replyTo && (
              <>
                <Text type="secondary">回复</Text>
                <Text strong>@{comment.replyTo.username}</Text>
              </>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(comment.createdAt).toLocaleString('zh-CN')}
            </Text>
          </div>
          <Paragraph style={{ marginBottom: 8, whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </Paragraph>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="link" size="small" onClick={() => setReplyVisible(!replyVisible)}>
              回复
            </Button>
            {isAuthor && (
              <Popconfirm
                title="确定要删除这条评论吗？"
                description="删除后无法恢复"
                onConfirm={handleDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} loading={deleting}>
                  删除
                </Button>
              </Popconfirm>
            )}
          </div>

          {replyVisible && (
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <TextArea
                rows={3}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="写下你的回复..."
                maxLength={1000}
                showCount
              />
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Space>
                  <Button size="small" onClick={() => setReplyVisible(false)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    onClick={handleSubmitReply}
                    loading={submitting}
                  >
                    回复
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  onRefresh={onRefresh}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {depth === 0 && <Divider style={{ margin: '12px 0' }} />}
    </div>
  );
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await api.getComments(postId);
      setComments(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取评论失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录后再评论');
      router.push('/auth/login');
      return;
    }

    if (!content.trim()) {
      message.warning('评论内容不能为空');
      return;
    }

    setSubmitting(true);
    try {
      await api.createComment(postId, { content });
      message.success('评论成功');
      setContent('');
      fetchComments();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const countTotalComments = (commentsList: CommentType[]): number => {
    let count = 0;
    commentsList.forEach((comment) => {
      count++;
      if (comment.replies) {
        count += countTotalComments(comment.replies);
      }
    });
    return count;
  };

  return (
    <div>
      <h3 style={{ marginBottom: 16, marginTop: 0 }}>
        评论 ({countTotalComments(comments)})
      </h3>

      {isAuthenticated ? (
        <div style={{ marginBottom: 24 }}>
          <TextArea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的评论..."
            maxLength={1000}
            showCount
          />
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
            >
              发表评论
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24, padding: '20px', background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
          <Text type="secondary">
            请先<a onClick={() => router.push('/auth/login')} style={{ margin: '0 4px' }}>登录</a>后发表评论
          </Text>
        </div>
      )}

      <List
        loading={loading}
        dataSource={comments}
        locale={{ emptyText: '暂无评论，快来抢沙发吧~' }}
        renderItem={(comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            postId={postId}
            onRefresh={fetchComments}
          />
        )}
      />
    </div>
  );
}
