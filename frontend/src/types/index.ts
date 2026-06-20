export interface User {
  id: string;
  phone: string;
  name: string;
  avatar: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; repositories: number };
  isDeleted?: boolean;
  deletedAt?: string | null;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  user: Pick<User, 'id' | 'name' | 'avatar' | 'phone'>;
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  latestVersion?: VersionInfo | null;
  deletedAt?: string | null;
}

export interface VersionInfo {
  oid: string;
  version: number;
  message: string;
  author: string;
  timestamp: number;
}

export interface AccessToken {
  id: string;
  name: string;
  scope: 'READ' | 'READ_WRITE';
  expiresAt: string | null;
  lastUsedAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string;
  ip: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'phone'> | null;
}

export interface ShareInfo {
  id: string;
  token: string;
  type: 'VIEW_ONLY' | 'SOURCE_ACCESS';
  url: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface SearchResult {
  type: 'workspace' | 'repo';
  id: string;
  name: string;
  workspaceId?: string;
  workspaceName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
