'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Avatar,
  Button,
  Input,
  Space,
  Typography,
  message,
  Spin,
  Empty,
  Divider,
} from 'antd';
import { UserOutlined, DeleteOutlined, CommentOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Comment } from '@/types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  postId: string;
  currentUserId: string | null;
  depth: number;
  onReply: (parentId: string, replyToUserId: string, replyToUsername: string) => void;
  onDelete: (commentId: string) => void;
  replyingTo: string | null;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CommentItem({
  comment,
  allComments,
  postId: _postId,
  currentUserId,
  depth,
  onReply,
  onDelete,
  replyingTo,
}: CommentItemProps) {
  const replies = allComments.filter((c) => c.parentId === comment.id);
  const isAuthor = currentUserId === comment.author.id;
  const isReplying = replyingTo === comment.id;

  return (
    <div
      style={{
        marginLeft: depth > 0 ? 40 : 0,
        paddingTop: 16,
        paddingBottom: 16,
        borderLeft: depth > 0 ? '2px solid #f0f0f0' : 'none',
        paddingLeft: depth > 0 ? 16 : 0,
      }}
    >
      <Space align="start" size={12} style={{ width: '100%' }}>
        <Avatar
          size={depth > 0 ? 'small' : 'default'}
          icon={<UserOutlined />}
          style={{ backgroundColor: '#1890ff', flexShrink: 0, marginTop: 2 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={8} wrap>
            <Text strong style={{ fontSize: depth > 0 ? 13 : 14 }}>
              {comment.author.username}
            </Text>
            {comment.replyTo && (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>回复</Text>
                <Text type="secondary" strong style={{ fontSize: 13 }}>
                  @{comment.replyTo.username}
                </Text>
              </>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatTime(comment.createdAt)}
            </Text>
          </Space>
          <Paragraph
            style={{
              margin: '4px 0 8px',
              fontSize: depth > 0 ? 13 : 14,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {comment.content}
          </Paragraph>
          <Space size={4}>
            {currentUserId && (
              <Button
                type="text"
                size="small"
                icon={<CommentOutlined />}
                onClick={() =>
                  onReply(comment.id, comment.author.id, comment.author.username)
                }
              >
                回复
              </Button>
            )}
            {isAuthor && (
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(comment.id)}
              >
                删除
              </Button>
            )}
          </Space>
        </div>
      </Space>

      {replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              allComments={allComments}
              postId={_postId}
              currentUserId={currentUserId}
              depth={depth + 1}
              onReply={onReply}
              onDelete={onDelete}
              replyingTo={isReplying ? replyingTo : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ userId: string; username: string } | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
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

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    setSubmitting(true);
    try {
      await api.createComment(postId, {
        content: newComment.trim(),
        parentId: replyingTo || undefined,
        replyTo: replyTarget?.userId || undefined,
      });
      setNewComment('');
      setReplyingTo(null);
      setReplyTarget(null);
      message.success('评论发表成功');
      fetchComments();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '发表评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: string, replyToUserId: string, replyToUsername: string) => {
    setReplyingTo(parentId);
    setReplyTarget({ userId: replyToUserId, username: replyToUsername });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyTarget(null);
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.deleteComment(postId, commentId);
      message.success('评论已删除');
      fetchComments();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const rootComments = comments.filter((c) => !c.parentId);

  return (
    <div style={{ marginTop: 24 }}>
      <Divider />
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        评论 {comments.length > 0 && `(${comments.length})`}
      </Typography.Title>

      {user && (
        <div style={{ marginBottom: 24 }}>
          {replyingTo && replyTarget && (
            <div style={{ marginBottom: 8 }}>
              <Space>
                <Text type="secondary">
                  回复 <Text strong>@{replyTarget.username}</Text>
                </Text>
                <Button type="link" size="small" onClick={cancelReply}>
                  取消回复
                </Button>
              </Space>
            </div>
          )}
          <TextArea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? `回复 @${replyTarget?.username}...` : '写下你的评论...'}
            maxLength={1000}
            showCount
            style={{ marginBottom: 8 }}
          />
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!newComment.trim()}
            >
              发表{replyingTo ? '回复' : '评论'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      ) : comments.length === 0 ? (
        <Empty description="暂无评论，快来抢沙发吧" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div>
          {rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={comments}
              postId={postId}
              currentUserId={user?.id || null}
              depth={0}
              onReply={handleReply}
              onDelete={handleDelete}
              replyingTo={replyingTo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
