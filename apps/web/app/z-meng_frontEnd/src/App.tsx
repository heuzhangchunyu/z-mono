import { ConfigProvider } from 'antd';
import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthHero from './components/AuthHero/AuthHero';
import AuthPanel from './components/AuthPanel/AuthPanel';
import HomeShell from './components/HomeShell/HomeShell';
import { PushChannelProvider } from './contexts/PushChannelContext';
import type { AuthSuccessPayload } from './types/auth';

const theme = {
  token: {
    colorPrimary: '#2dd4bf',
    colorText: '#e8eefb',
    colorTextSecondary: '#aac0df',
    colorBgContainer: 'rgba(8, 15, 28, 0.84)',
    colorBorder: 'rgba(148, 163, 184, 0.18)',
    borderRadius: 16,
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif"
  }
} as const;

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<{ userId: number; username: string } | null>(null);

  const handleAuthSuccess = ({ mode, userId, username }: AuthSuccessPayload) => {
    if (mode === 'login') {
      setAuthenticatedUser({
        userId,
        username
      });
    }
  };

  if (authenticatedUser) {
    return (
      <ConfigProvider theme={theme}>
        <PushChannelProvider enabled={Boolean(authenticatedUser.userId)}>
          <Routes>
            <Route path="/" element={<Navigate to="/creation" replace />} />
            <Route path="/creation/*" element={<HomeShell username={authenticatedUser.username} />} />
            <Route path="/canvas/*" element={<HomeShell username={authenticatedUser.username} />} />
            <Route path="*" element={<Navigate to="/creation" replace />} />
          </Routes>
        </PushChannelProvider>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={theme}>
      <Routes>
        <Route
          path="*"
          element={(
            <main className="zmeng-shell">
              <AuthHero />
              <AuthPanel onAuthSuccess={handleAuthSuccess} />
            </main>
          )}
        />
      </Routes>
    </ConfigProvider>
  );
}
