import { workspaceApi, repoApi } from '../services';
import type { SearchResult } from '../types';

let cachedWorkspaces: SearchResult[] | null = null;

export async function fetchSearchData(): Promise<SearchResult[]> {
  if (cachedWorkspaces) return cachedWorkspaces;

  const workspaces = await workspaceApi.list();
  const results: SearchResult[] = [];

  for (const ws of workspaces) {
    results.push({
      type: 'workspace',
      id: ws.id,
      name: ws.name,
    });
    try {
      const repos = await repoApi.list(ws.id);
      repos.forEach((repo) => {
        results.push({
          type: 'repo',
          id: repo.id,
          name: repo.name,
          workspaceId: ws.id,
          workspaceName: ws.name,
        });
      });
    } catch {
      // skip inaccessible repos
    }
  }

  cachedWorkspaces = results;
  return results;
}

export function invalidateSearchCache() {
  cachedWorkspaces = null;
}
