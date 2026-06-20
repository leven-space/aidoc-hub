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
} from '../types';

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
  commit: (
    workspaceId: string,
    repoId: string,
    data: {
      files: { filePath: string; content: string }[];
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
};
