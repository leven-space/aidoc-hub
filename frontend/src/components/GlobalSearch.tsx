import { useState, useCallback } from 'react';
import { AutoComplete, Typography } from 'antd';
import { TeamOutlined, FolderOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { workspaceApi, repoApi } from '../services';
import type { SearchResult } from '../types';

let cachedWorkspaces: SearchResult[] | null = null;

async function fetchSearchData(): Promise<SearchResult[]> {
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

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#1677ff', fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function GlobalSearch() {
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setOptions([]);
      return;
    }
    try {
      const data = await fetchSearchData();
      const filtered = data.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase()),
      );
      setOptions(
        filtered.slice(0, 10).map((item) => ({
          value: `${item.type}:${item.id}`,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.type === 'workspace' ? (
                <TeamOutlined style={{ color: '#1677ff' }} />
              ) : (
                <FolderOutlined style={{ color: '#52c41a' }} />
              )}
              <div>
                <div>{highlightMatch(item.name, value)}</div>
                {item.type === 'repo' && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {item.workspaceName}
                  </Typography.Text>
                )}
              </div>
            </div>
          ),
        })),
      );
    } catch {
      setOptions([]);
    }
  }, []);

  const handleSelect = async (value: string) => {
    const data = await fetchSearchData();
    const [type, id] = value.split(':');
    const item = data.find((d) => d.type === type && d.id === id);
    if (!item) return;

    if (item.type === 'workspace') {
      navigate(`/workspaces/${item.id}`);
    } else if (item.workspaceId) {
      navigate(`/workspaces/${item.workspaceId}/repos/${item.id}`);
    }
    setQuery('');
    setOptions([]);
  };

  return (
    <AutoComplete
      value={query}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      style={{ width: 280 }}
    >
      <input
        placeholder="搜索空间、仓库..."
        style={{
          width: '100%',
          padding: '4px 11px 4px 32px',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          outline: 'none',
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024' width='14' height='14' fill='%23bfbfbf'%3E%3Cpath d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132.2-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.7 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'/%3E%3C/svg%3E") no-repeat 10px center`,
        }}
      />
    </AutoComplete>
  );
}
