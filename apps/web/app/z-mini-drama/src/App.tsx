import { ConfigProvider } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import DashboardPage from '@/pages/Dashboard';

const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 16,
    colorBgLayout: '#f5f7fb',
    colorBgContainer: '#ffffff',
    fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif"
  }
} as const;

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
}
