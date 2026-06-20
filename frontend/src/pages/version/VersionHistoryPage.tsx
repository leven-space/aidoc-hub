import { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import { VersionHistory } from './VersionHistory';
import { VersionDiff } from '../../components/VersionDiff';
import { versionApi } from '../../services';
import type { VersionInfo } from '../../types';

export function VersionHistoryPage() {
  const { workspaceId, repoId } = useParams<{ workspaceId: string; repoId: string }>();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState<unknown>(null);
  const [selectedFile] = useState('index.html');

  useEffect(() => {
    if (!workspaceId || !repoId) return;
    versionApi
      .history(workspaceId, repoId)
      .then(setVersions)
      .catch((err) => message.error(err.message))
      .finally(() => setLoading(false));
  }, [workspaceId, repoId]);

  const handleRestore = async (oid: string) => {
    if (!workspaceId || !repoId) return;
    try {
      await versionApi.restore(workspaceId, repoId, oid);
      message.success('版本已恢复');
      const updated = await versionApi.history(workspaceId, repoId);
      setVersions(updated);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '恢复失败');
    }
  };

  const handleDiff = async (fromOid: string, toOid: string) => {
    if (!workspaceId || !repoId) return;
    try {
      const data = await versionApi.diff(workspaceId, repoId, {
        path: selectedFile,
        from: fromOid,
        to: toOid,
      });
      setDiffData(data);
      setShowDiff(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '对比失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (showDiff && diffData) {
    return (
      <VersionDiff
        data={diffData as Parameters<typeof VersionDiff>[0]['data']}
        versions={versions}
        onSelectVersions={(from, to) => handleDiff(from, to)}
      />
    );
  }

  return (
    <VersionHistory
      versions={versions}
      onRestore={handleRestore}
      onDiff={handleDiff}
    />
  );
}
