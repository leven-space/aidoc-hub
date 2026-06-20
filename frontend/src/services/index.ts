import api from '../services/api';
import type {
  AuthResponse,
  User,
  Workspace,
  WorkspaceMember,
  Repository,
  VersionInfo,
  AccessToken,
  AuditLog,
  ShareInfo,
  ShareView,
  SharePasswordRequired,
  SystemConfig,
  SetupInitResponse,
  McpSetupSnippets,
} from '../types';

export const setupApi = {
  status: () => api.get<{ initialized: boolean }>('/setup/status').then((r) => r.data),
  initialize: (data: {
    phone: string;
    password: string;
    name?: string;
    siteName: string;
    publicApiUrl: string;
  }) => api.post<SetupInitResponse>('/setup/initialize', data).then((r) => r.data),
};

export const systemApi = {
  getConfig: () => api.get<SystemConfig>('/system/config').then((r) => r.data),
  updateConfig: (data: Partial<SystemConfig>) =>
    api.patch<SystemConfig>('/system/config', data).then((r) => r.data),
};

export const mcpApi = {
  listTools: () =>
    api.get<{ tools: McpSetupSnippets['tools'] }>('/mcp/tools').then((r) => r.data),
  getSetupSnippets: () => api.get<McpSetupSnippets>('/mcp/setup-snippets').then((r) => r.data),
};

export const authApi = {
  register: (data: { phone: string; password: string; name?: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (data: { phone: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
  profile: () => api.get<User>('/auth/profile').then((r) => r.data),
};

export const workspaceApi = {
  list: () => api.get<Workspace[]>('/workspaces').then((r) => r.data),
  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    api.post<Workspace>('/workspaces', data).then((r) => r.data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<Workspace>(`/workspaces/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/workspaces/${id}`).then((r) => r.data),
  listDeleted: () => api.get<Workspace[]>('/workspaces/recycle/list').then((r) => r.data),
  restore: (id: string) => api.post(`/workspaces/${id}/restore`).then((r) => r.data),
  permanentDelete: (id: string) => api.delete(`/workspaces/${id}/permanent`).then((r) => r.data),
  listMembers: (id: string) =>
    api.get<WorkspaceMember[]>(`/workspaces/${id}/members`).then((r) => r.data),
  inviteMember: (id: string, data: { phone: string; role: string }) =>
    api.post<WorkspaceMember>(`/workspaces/${id}/members`, data).then((r) => r.data),
  updateMemberRole: (id: string, memberId: string, role: string) =>
    api.put(`/workspaces/${id}/members/${memberId}`, { role }).then((r) => r.data),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/workspaces/${id}/members/${memberId}`).then((r) => r.data),
};

export const repoApi = {
  list: (workspaceId: string) =>
    api.get<Repository[]>(`/workspaces/${workspaceId}/repos`).then((r) => r.data),
  get: (workspaceId: string, repoId: string) =>
    api.get<Repository>(`/workspaces/${workspaceId}/repos/${repoId}`).then((r) => r.data),
  create: (workspaceId: string, data: { name: string; description?: string }) =>
    api.post<Repository>(`/workspaces/${workspaceId}/repos`, data).then((r) => r.data),
  delete: (workspaceId: string, repoId: string) =>
    api.delete(`/workspaces/${workspaceId}/repos/${repoId}`).then((r) => r.data),
  listDeleted: (workspaceId: string) =>
    api.get<Repository[]>(`/workspaces/${workspaceId}/repos/recycle/list`).then((r) => r.data),
  restore: (workspaceId: string, repoId: string) =>
    api.post(`/workspaces/${workspaceId}/repos/${repoId}/restore`).then((r) => r.data),
  permanentDelete: (workspaceId: string, repoId: string) =>
    api.delete(`/workspaces/${workspaceId}/repos/${repoId}/permanent`).then((r) => r.data),
  listFiles: (workspaceId: string, repoId: string) =>
    api.get<string[]>(`/workspaces/${workspaceId}/repos/${repoId}/files`).then((r) => r.data),
  readFile: (workspaceId: string, repoId: string, path: string, version?: string) =>
    api
      .get<string>(`/workspaces/${workspaceId}/repos/${repoId}/file`, {
        params: { path, version },
      })
      .then((r) => r.data),
  getPreviewUrl: (
    workspaceId: string,
    repoId: string,
    filePath: string,
    version?: string,
  ) => {
    const params = new URLSearchParams();
    if (version) params.set('version', version);
    const token = localStorage.getItem('accessToken');
    if (token) params.set('token', token);
    const query = params.toString();
    const encodedPath = filePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `/api/workspaces/${workspaceId}/repos/${repoId}/preview/${encodedPath}${query ? `?${query}` : ''}`;
  },
  commit: (
    workspaceId: string,
    repoId: string,
    data: {
      files: { filePath: string; content: string; encoding?: 'utf-8' | 'base64' }[];
      message: string;
      baseVersion?: string;
      forceOverwrite?: boolean;
    },
  ) => api.post(`/workspaces/${workspaceId}/repos/${repoId}/commits`, data).then((r) => r.data),
};

export const versionApi = {
  history: (workspaceId: string, repoId: string) =>
    api
      .get<VersionInfo[]>(`/workspaces/${workspaceId}/repos/${repoId}/versions`)
      .then((r) => r.data),
  diff: (
    workspaceId: string,
    repoId: string,
    params: { path: string; from: string; to: string },
  ) => api.get(`/workspaces/${workspaceId}/repos/${repoId}/versions/diff`, { params }).then((r) => r.data),
  restore: (workspaceId: string, repoId: string, version: string) =>
    api
      .post(`/workspaces/${workspaceId}/repos/${repoId}/versions/restore`, { version })
      .then((r) => r.data),
};

export const tokenApi = {
  list: () => api.get<AccessToken[]>('/tokens').then((r) => r.data),
  create: (data: { name: string; scope: 'READ' | 'READ_WRITE'; expiresAt?: string }) =>
    api.post<AccessToken & { plaintext: string }>('/tokens', data).then((r) => r.data),
  revoke: (id: string) => api.delete(`/tokens/${id}`).then((r) => r.data),
};

export const auditApi = {
  list: (params?: {
    workspaceId?: string;
    action?: string;
    userId?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) =>
    api
      .get<{ items: AuditLog[]; total: number; page: number; pageSize: number }>(
        '/audit-logs',
        { params },
      )
      .then((r) => r.data),
};

export const shareApi = {
  create: (data: {
    workspaceId: string;
    repoId: string;
    type: 'VIEW_ONLY' | 'SOURCE_ACCESS';
    password?: string;
    expiresAt?: string;
    maxVisits?: number;
    version?: string;
  }) => api.post<ShareInfo>('/shares', data).then((r) => r.data),
  list: (workspaceId: string, repoId: string) =>
    api.get<ShareInfo[]>('/shares', { params: { workspaceId, repoId } }).then((r) => r.data),
  deactivate: (id: string) => api.delete(`/shares/${id}`).then((r) => r.data),
  getView: (token: string, password?: string) =>
    api
      .get<ShareView | SharePasswordRequired>(`/shares/${token}/view`, {
        params: password ? { password } : undefined,
      })
      .then((r) => r.data),
  readFile: (token: string, path: string, password?: string) =>
    api
      .get<string>(`/shares/${token}/file`, {
        params: { path, ...(password ? { password } : {}) },
      })
      .then((r) => r.data),
  getPreviewUrl: (token: string, filePath: string, password?: string) => {
    const params = new URLSearchParams();
    if (password) params.set('password', password);
    const query = params.toString();
    const encodedPath = filePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `/api/shares/${token}/preview/${encodedPath}${query ? `?${query}` : ''}`;
  },
};
