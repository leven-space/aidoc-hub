import type { APIRequestContext } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api';

export interface AuthSession {
  jwt: string;
  userId: string;
}

export interface PatToken {
  id: string;
  plaintext: string;
  scope: 'READ' | 'READ_WRITE';
}

export interface Workspace {
  id: string;
  name: string;
}

export interface Repo {
  id: string;
  name: string;
}

export interface VersionInfo {
  oid: string;
  version: number;
  message: string;
  author: string;
  timestamp: number;
}

export interface VersionDiffResult {
  filePath: string;
  fromVersion: string;
  toVersion: string;
  fromContent: string;
  toContent: string;
  diff: Array<{ type: 'add' | 'remove' | 'same'; line: string; lineNumber: number }>;
}

async function unwrap<T>(response: {
  ok: () => boolean;
  status: () => number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}): Promise<T> {
  const body = (await response.json()) as {
    success?: boolean;
    data?: T;
    message?: string;
    errorCode?: string;
  };
  if (!response.ok() || body.success === false) {
    throw new Error(
      `API ${response.status()}: ${body.errorCode || body.message || JSON.stringify(body)}`,
    );
  }
  return body.data as T;
}

export async function registerUser(
  request: APIRequestContext,
  phone: string,
  password: string,
): Promise<AuthSession> {
  const response = await request.post(`${API_BASE}/auth/register`, {
    data: { phone, password },
  });
  const data = await unwrap<{
    accessToken: string;
    user: { id: string };
  }>(response);
  return { jwt: data.accessToken, userId: data.user.id };
}

export async function createPat(
  request: APIRequestContext,
  jwt: string,
  name: string,
  scope: 'READ' | 'READ_WRITE',
): Promise<PatToken> {
  const response = await request.post(`${API_BASE}/tokens`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { name, scope },
  });
  const data = await unwrap<PatToken>(response);
  return data;
}

export async function createWorkspace(
  request: APIRequestContext,
  jwt: string,
  name: string,
): Promise<Workspace> {
  const response = await request.post(`${API_BASE}/workspaces`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { name },
  });
  return unwrap<Workspace>(response);
}

export async function createRepo(
  request: APIRequestContext,
  jwt: string,
  workspaceId: string,
  name: string,
): Promise<Repo> {
  const response = await request.post(
    `${API_BASE}/workspaces/${workspaceId}/repos`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { name },
    },
  );
  return unwrap<Repo>(response);
}

export async function commitFiles(
  request: APIRequestContext,
  jwt: string,
  workspaceId: string,
  repoId: string,
  files: { filePath: string; content: string }[],
  message: string,
): Promise<{ oid: string }> {
  const response = await request.post(
    `${API_BASE}/workspaces/${workspaceId}/repos/${repoId}/commits`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { files, message },
    },
  );
  return unwrap<{ oid: string }>(response);
}

export async function getVersionHistory(
  request: APIRequestContext,
  jwt: string,
  workspaceId: string,
  repoId: string,
): Promise<VersionInfo[]> {
  const response = await request.get(
    `${API_BASE}/workspaces/${workspaceId}/repos/${repoId}/versions`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  return unwrap<VersionInfo[]>(response);
}

export async function restoreVersion(
  request: APIRequestContext,
  jwt: string,
  workspaceId: string,
  repoId: string,
  versionOid: string,
): Promise<VersionInfo> {
  const response = await request.post(
    `${API_BASE}/workspaces/${workspaceId}/repos/${repoId}/versions/restore`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { version: versionOid },
    },
  );
  return unwrap<VersionInfo>(response);
}

export async function getVersionDiff(
  request: APIRequestContext,
  jwt: string,
  workspaceId: string,
  repoId: string,
  filePath: string,
  fromVersion: string,
  toVersion: string,
): Promise<VersionDiffResult> {
  const params = new URLSearchParams({
    path: filePath,
    from: fromVersion,
    to: toVersion,
  });
  const response = await request.get(
    `${API_BASE}/workspaces/${workspaceId}/repos/${repoId}/versions/diff?${params}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  return unwrap<VersionDiffResult>(response);
}

export async function readFile(
  request: APIRequestContext,
  jwt: string,
  workspaceId: string,
  repoId: string,
  filePath: string,
  version?: string,
): Promise<string> {
  const params = new URLSearchParams({ path: filePath });
  if (version) params.set('version', version);
  const response = await request.get(
    `${API_BASE}/workspaces/${workspaceId}/repos/${repoId}/file?${params}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  return unwrap<string>(response);
}

export async function mcpExecute<T = unknown>(
  request: APIRequestContext,
  token: string,
  tool: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const response = await request.post(`${API_BASE}/mcp/execute`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { tool, arguments: args },
  });
  const data = await unwrap<{ result: T }>(response);
  return data.result;
}

export async function mcpTools(
  request: APIRequestContext,
  token: string,
): Promise<{ tools: { name: string }[] }> {
  const response = await request.get(`${API_BASE}/mcp/tools`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<{ tools: { name: string }[] }>(response);
}

export async function apiRaw(
  request: APIRequestContext,
  method: 'GET' | 'POST',
  path: string,
  token?: string,
  data?: Record<string, unknown>,
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${API_BASE}${path}`;
  const response =
    method === 'GET'
      ? await request.get(url, { headers })
      : await request.post(url, { headers, data: data ?? {} });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status(), body };
}
