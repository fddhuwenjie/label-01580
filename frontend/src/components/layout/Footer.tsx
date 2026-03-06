'use client';

import React from 'react';
import { Layout, Typography } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

export default function Footer() {
  return (
    <AntFooter
      style={{
        textAlign: 'center',
        background: '#f0f2f5',
        padding: '24px 50px',
      }}
    >
      <Text type="secondary">
        博客系统 ©{new Date().getFullYear()} Created with Next.js & NestJS
      </Text>
    </AntFooter>
  );
}
