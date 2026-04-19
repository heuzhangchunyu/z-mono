import { App, Button, Form, Input, Segmented, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithPassword, persistAuthSession, registerWithPassword } from '@/services/auth/auth';
import type { LoginPayload, RegisterPayload } from '@/types/auth';
import './index.less';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginForm] = Form.useForm<LoginPayload>();
  const [registerForm] = Form.useForm<RegisterPayload>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const handleFinish = async (values: LoginPayload) => {
    try {
      const response = await loginWithPassword({
        username: values.username.trim(),
        password: values.password
      });

      persistAuthSession(response);
      message.success('登录成功，欢迎进入剧场工作台');
      navigate('/episode', { replace: true });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : '登录失败，请稍后重试';
      message.error(nextMessage);
    }
  };

  const handleRegister = async (values: RegisterPayload) => {
    try {
      const response = await registerWithPassword({
        username: values.username.trim(),
        nickname: values.nickname.trim(),
        password: values.password
      });

      persistAuthSession(response);
      message.success('注册成功，已为你自动登录');
      navigate('/episode', { replace: true });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : '注册失败，请稍后重试';
      message.error(nextMessage);
    }
  };

  return (
    <div className="zmd-login">
      <div className="zmd-login__bg zmd-login__bg--violet" />
      <div className="zmd-login__bg zmd-login__bg--cyan" />
      <div className="zmd-login__bg zmd-login__bg--sunrise" />

      <div className="zmd-login__shell">
        <section className="zmd-login__hero">
          <Typography.Title className="zmd-login__title" level={1}>
            开启你的
            <span> 剧场 Agent 模式</span>
          </Typography.Title>
        </section>

        <section className="zmd-login__panel">
          <div className="zmd-login__panel-inner">
            <div className="zmd-login__panel-copy">
              <Typography.Title level={2}>{mode === 'login' ? '登录工作台' : '创建账号'}</Typography.Title>
            </div>

            <Segmented<'login' | 'register'>
              block
              className="zmd-login__mode-switch"
              value={mode}
              onChange={(value) => setMode(value)}
              options={[
                { label: '登录', value: 'login' },
                { label: '注册', value: 'register' }
              ]}
            />

            {mode === 'login' ? (
              <Form<LoginPayload>
                form={loginForm}
                layout="vertical"
                requiredMark={false}
                onFinish={(values) => void handleFinish(values)}
                initialValues={{
                  username: 'demo_admin',
                  password: 'demo123456'
                }}
              >
                <Form.Item<LoginPayload>
                  label="用户名"
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input size="large" placeholder="请输入用户名" autoComplete="username" />
                </Form.Item>

                <Form.Item<LoginPayload>
                  label="密码"
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password size="large" placeholder="请输入密码" autoComplete="current-password" />
                </Form.Item>

                <Button type="primary" htmlType="submit" size="large" block className="zmd-login__submit">
                  进入创作工作台
                </Button>
              </Form>
            ) : (
              <Form<RegisterPayload>
                form={registerForm}
                layout="vertical"
                requiredMark={false}
                onFinish={(values) => void handleRegister(values)}
              >
                <Form.Item<RegisterPayload>
                  label="用户名"
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, max: 24, message: '用户名长度需在 3 到 24 个字符之间' },
                    { pattern: /^[a-zA-Z0-9_-]+$/, message: '仅支持字母、数字、下划线和中划线' }
                  ]}
                >
                  <Input size="large" placeholder="例如：new_creator" autoComplete="username" />
                </Form.Item>

                <Form.Item<RegisterPayload>
                  label="昵称"
                  name="nickname"
                  rules={[
                    { required: true, message: '请输入昵称' },
                    { max: 32, message: '昵称长度不能超过 32 个字符' }
                  ]}
                >
                  <Input size="large" placeholder="给你的工作台起个名字" autoComplete="nickname" />
                </Form.Item>

                <Form.Item<RegisterPayload>
                  label="密码"
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 8, max: 64, message: '密码长度需在 8 到 64 个字符之间' }
                  ]}
                >
                  <Input.Password size="large" placeholder="至少 8 位密码" autoComplete="new-password" />
                </Form.Item>

                <Form.Item<RegisterPayload>
                  label="确认密码"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请再次输入密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }

                        return Promise.reject(new Error('两次输入的密码不一致'));
                      }
                    })
                  ]}
                >
                  <Input.Password size="large" placeholder="再次输入密码" autoComplete="new-password" />
                </Form.Item>

                <Button type="primary" htmlType="submit" size="large" block className="zmd-login__submit">
                  创建账号并进入工作台
                </Button>
              </Form>
            )}

          </div>
        </section>
      </div>
    </div>
  );
}
