'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ConfigProvider, Layout } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const { Content } = Layout;

interface AntdProviderProps {
  children: React.ReactNode;
}

export default function AntdProvider({ children }: AntdProviderProps) {
  const pathname = usePathname();
  
  // 登录和注册页面不显示头部和底部
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return (
      <ConfigProvider locale={zhCN}>
        <AuthProvider>
          <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content>{children}</Content>
          </Layout>
        </AuthProvider>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Layout style={{ minHeight: '100vh' }}>
          <Header />
          <Content style={{ padding: '24px 50px' }}>{children}</Content>
          <Footer />
        </Layout>
      </AuthProvider>
    </ConfigProvider>
  );
}
