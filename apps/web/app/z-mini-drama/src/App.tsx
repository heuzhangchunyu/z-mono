import { App as AntdApp, ConfigProvider } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicOnlyRoute from '@/components/PublicOnlyRoute';
import DashboardPage from '@/pages/Dashboard';
import EpisodeCreationPage from '@/pages/Dashboard/EpisodeCreationPage';
import InfiniteCanvasPage from '@/pages/Dashboard/InfiniteCanvasPage';
import LoginPage from '@/pages/Login';

const theme = {
  token: {
    colorPrimary: '#5a61ff',
    colorInfo: '#5a61ff',
    borderRadius: 20,
    colorBgLayout: '#f4f6ff',
    colorBgContainer: '#ffffff',
    colorText: '#131b39',
    colorTextSecondary: '#5a678c',
    boxShadowSecondary: '0 20px 60px rgba(24, 35, 84, 0.12)',
    fontFamily: "'Inter', 'SF Pro Display', 'PingFang SC', 'Microsoft YaHei', sans-serif"
  }
} as const;

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        <Routes>
          <Route
            path="/login"
            element={(
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            )}
          />
          <Route
            element={(
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            )}
          >
            <Route element={<DashboardPage />}>
              <Route path="/" element={<Navigate to="/episode" replace />} />
              <Route path="/episode" element={<EpisodeCreationPage />} />
              <Route path="/canvas" element={<InfiniteCanvasPage />} />
            </Route>
          </Route>
        </Routes>
      </AntdApp>
    </ConfigProvider>
  );
}
