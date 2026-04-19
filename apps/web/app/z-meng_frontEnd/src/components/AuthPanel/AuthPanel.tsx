import { Alert, Button, Card, Form, Input, Tabs, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { TabsProps } from 'antd';
import axios from 'axios';
import { submitAuth } from '../../services/auth/auth';
import type { AuthCopy, AuthFormValues, AuthMode, AuthSuccessPayload } from '../../types/auth';
import './AuthPanel.less';

const modeCopy: Record<AuthMode, AuthCopy> = {
  login: {
    title: 'Sign in to z-meng',
    subtitle: 'Use your username and password to continue your AI comic drama workflow.',
    submit: 'Login',
    success: 'Login form is ready. Connect this action to your backend auth endpoint next.'
  },
  register: {
    title: 'Create a new account',
    subtitle: 'Register a studio account and start building your first AI comic drama project.',
    submit: 'Register',
    success: 'Registration form is ready. Connect this action to your backend signup endpoint next.'
  }
};

interface AuthPanelProps {
  onAuthSuccess?: (payload: AuthSuccessPayload) => void;
}

export default function AuthPanel({ onAuthSuccess }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'error'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<AuthFormValues>();

  const currentCopy = useMemo(() => modeCopy[mode], [mode]);

  const tabItems: TabsProps['items'] = [
    { key: 'login', label: 'Login' },
    { key: 'register', label: 'Register' }
  ];

  const handleModeChange = (activeKey: string) => {
    setMode(activeKey as AuthMode);
    setMessage('');
    setMessageType('info');
    form.resetFields(['password', 'confirmPassword']);
  };

  const handleSubmit = async (values: AuthFormValues) => {
    const trimmedUsername = values.username.trim();

    if (!trimmedUsername || !values.password) {
      setMessageType('error');
      setMessage('Username and password are required.');
      return;
    }

    if (mode === 'register') {
      if (!values.confirmPassword) {
        setMessageType('error');
        setMessage('Please confirm your password.');
        return;
      }

      if (values.password !== values.confirmPassword) {
        setMessageType('error');
        setMessage('The two passwords do not match.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const result = await submitAuth(mode, {
        username: trimmedUsername,
        password: values.password
      });

      setMessageType('info');
      if (mode === 'register') {
        setMode('login');
        form.setFieldsValue({
          username: trimmedUsername,
          password: '',
          confirmPassword: ''
        });
        setMessage(result.message ?? 'Account created successfully. You can sign in now.');
      } else {
        setMessage(result.message ?? currentCopy.success);
        onAuthSuccess?.({
          mode,
          userId: result.data?.userId ?? 0,
          username: trimmedUsername
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;
        setMessageType('error');
        setMessage(serverMessage ?? 'Request failed. Please check the backend auth endpoint.');
        return;
      }

      setMessageType('error');
      setMessage('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="zmeng-auth" bordered={false}>
      <Tabs activeKey={mode} items={tabItems} onChange={handleModeChange} className="zmeng-auth__tabs" />

      <div className="zmeng-auth__header">
        <Typography.Title level={2}>{currentCopy.title}</Typography.Title>
        <Typography.Paragraph>{currentCopy.subtitle}</Typography.Paragraph>
      </div>

      <Form<AuthFormValues>
        className="zmeng-form"
        layout="vertical"
        form={form}
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item<AuthFormValues> label="Username" name="username">
          <Input size="large" placeholder="Enter your username" autoComplete="username" />
        </Form.Item>

        <Form.Item<AuthFormValues> label="Password" name="password">
          <Input.Password
            size="large"
            placeholder="Enter your password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </Form.Item>

        {mode === 'register' ? (
          <Form.Item<AuthFormValues> label="Confirm password" name="confirmPassword">
            <Input.Password size="large" placeholder="Confirm your password" autoComplete="new-password" />
          </Form.Item>
        ) : null}

        {message ? (
          <Alert className="zmeng-form__message" type={messageType} showIcon message={message} />
        ) : null}

        <Button
          className="zmeng-form__submit"
          type="primary"
          size="large"
          htmlType="submit"
          block
          loading={submitting}
        >
          {currentCopy.submit}
        </Button>
      </Form>
    </Card>
  );
}
