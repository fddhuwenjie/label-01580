'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout, Menu, Button, Space, Dropdown, Avatar, Typography } from 'antd';
import {
  HomeOutlined,
  EditOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/context/AuthContext';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.username || '用户',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'my-posts',
      icon: <EditOutlined />,
      label: '我的文章',
      onClick: () => router.push('/posts/my'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 50px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ marginRight: 40 }}>
          <Text
            strong
            style={{
              color: '#fff',
              fontSize: 20,
              letterSpacing: 1,
            }}
          >
            📝 博客系统
          </Text>
        </Link>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['home']}
          style={{ flex: 1, minWidth: 200, background: 'transparent' }}
          items={[
            {
              key: 'home',
              icon: <HomeOutlined />,
              label: <Link href="/">首页</Link>,
            },
          ]}
        />
      </div>

      <Space>
        {isAuthenticated ? (
          <>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => router.push('/posts/create')}
            >
              写文章
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </>
        ) : (
          <>
            <Button
              type="text"
              icon={<LoginOutlined />}
              style={{ color: '#fff' }}
              onClick={() => router.push('/auth/login')}
            >
              登录
            </Button>
            <Button type="primary" onClick={() => router.push('/auth/register')}>
              注册
            </Button>
          </>
        )}
      </Space>
    </AntHeader>
  );
}
