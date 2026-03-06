'use client';

import React from 'react';
import { Form, Input, Button, Switch, Card } from 'antd';
import type { CreatePostRequest, UpdatePostRequest } from '@/types';

const { TextArea } = Input;

interface PostFormProps {
  initialValues?: Partial<CreatePostRequest>;
  onSubmit: (values: CreatePostRequest) => Promise<void>;
  loading?: boolean;
  submitText?: string;
}

export default function PostForm({
  initialValues,
  onSubmit,
  loading = false,
  submitText = '发布文章',
}: PostFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = async (values: CreatePostRequest) => {
    await onSubmit(values);
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          published: true,
          ...initialValues,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="title"
          label="标题"
          rules={[
            { required: true, message: '请输入文章标题' },
            { max: 200, message: '标题最多200个字符' },
          ]}
        >
          <Input
            placeholder="请输入文章标题"
            size="large"
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          name="summary"
          label="摘要"
          rules={[{ max: 500, message: '摘要最多500个字符' }]}
        >
          <TextArea
            placeholder="请输入文章摘要（选填）"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="content"
          label="内容"
          rules={[{ required: true, message: '请输入文章内容' }]}
        >
          <TextArea
            placeholder="请输入文章内容..."
            rows={15}
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Form.Item
          name="published"
          label="发布状态"
          valuePropName="checked"
        >
          <Switch checkedChildren="已发布" unCheckedChildren="草稿" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            {submitText}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
