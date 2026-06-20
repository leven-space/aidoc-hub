import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { WorkspaceList } from './pages/workspace/WorkspaceList';
import { WorkspaceDetail } from './pages/workspace/WorkspaceDetail';
import { RepoDetail } from './pages/repo/RepoDetail';
import { UploadPage } from './pages/upload/UploadPage';
import { RecyclePage } from './pages/recycle/RecyclePage';
import { TokenManage } from './pages/settings/TokenManage';
import { AuditLogPage } from './pages/settings/AuditLogPage';
import { VersionHistoryPage } from './pages/version/VersionHistoryPage';
import './styles/global.css';

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<WorkspaceList />} />
              <Route path="/workspaces/:workspaceId" element={<WorkspaceDetail />} />
              <Route path="/workspaces/:workspaceId/repos/:repoId" element={<RepoDetail />} />
              <Route path="/workspaces/:workspaceId/repos/:repoId/upload" element={<UploadPage />} />
              <Route path="/workspaces/:workspaceId/repos/:repoId/versions" element={<VersionHistoryPage />} />
              <Route path="/recycle" element={<RecyclePage />} />
              <Route path="/settings/tokens" element={<TokenManage />} />
              <Route path="/settings/audit" element={<AuditLogPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
