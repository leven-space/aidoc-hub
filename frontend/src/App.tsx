import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import { SetupGuard } from './components/SetupGuard';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { SetupPage } from './pages/setup/SetupPage';
import { WorkspaceList } from './pages/workspace/WorkspaceList';
import { WorkspaceDetail } from './pages/workspace/WorkspaceDetail';
import { RepoDetail } from './pages/repo/RepoDetail';
import { UploadPage } from './pages/upload/UploadPage';
import { RecyclePage } from './pages/recycle/RecyclePage';
import { TokenManage } from './pages/settings/TokenManage';
import { AuditLogPage } from './pages/settings/AuditLogPage';
import { McpConfigPage } from './pages/settings/McpConfigPage';
import { SystemConfigPage } from './pages/settings/SystemConfigPage';
import { VersionHistoryPage } from './pages/version/VersionHistoryPage';
import { SharePage } from './pages/share/SharePage';
import './styles/global.css';

function AppRoutes() {
  return (
    <BrowserRouter>
      <SetupGuard>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />

          <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route path="/share/:token" element={<SharePage />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<WorkspaceList />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceDetail />} />
            <Route path="/workspaces/:workspaceId/repos/:repoId" element={<RepoDetail />} />
            <Route path="/workspaces/:workspaceId/repos/:repoId/upload" element={<UploadPage />} />
            <Route path="/workspaces/:workspaceId/repos/:repoId/versions" element={<VersionHistoryPage />} />
            <Route path="/recycle" element={<RecyclePage />} />
            <Route path="/settings/tokens" element={<TokenManage />} />
            <Route path="/settings/mcp" element={<McpConfigPage />} />
            <Route path="/settings/system" element={<SystemConfigPage />} />
            <Route path="/settings/audit" element={<AuditLogPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SetupGuard>
    </BrowserRouter>
  );
}

function App() {
  const { i18n } = useTranslation();
  const antdLocale = i18n.language === 'en-US' ? enUS : zhCN;

  return (
    <ConfigProvider theme={theme} locale={antdLocale}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
