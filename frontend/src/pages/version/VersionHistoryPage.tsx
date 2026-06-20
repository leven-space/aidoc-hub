import { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import { VersionHistory } from './VersionHistory';
import { VersionDiff } from '../../components/VersionDiff';
import { repoApi, versionApi, workspaceApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { pickDefaultPreviewFile } from '../../utils/pickPreviewFile';
import type { VersionInfo } from '../../types';

export function VersionHistoryPage() {
  const { workspaceId, repoId } = useParams<{ workspaceId: string; repoId: string }>();
  const { user } = useAuth();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [canRestore, setCanRestore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState<unknown>(null);

  useEffect(() => {
    if (!workspaceId || !repoId) return;
    setLoading(true);
    Promise.all([
      versionApi.history(workspaceId, repoId),
      repoApi.listFiles(workspaceId, repoId),
      workspaceApi.get(workspaceId),
    ])
      .then(([versionList, fileList, workspace]) => {
        setVersions(versionList);
        setFiles(fileList);
        setSelectedFile(pickDefaultPreviewFile(fileList));
        const member = workspace.members?.find((m) => m.userId === user?.id);
        setCanRestore(member?.role === 'ADMIN' || member?.role === 'EDITOR');
      })
      .catch((err) => message.error(err.message))
      .finally(() => setLoading(false));
  }, [workspaceId, repoId, user?.id]);

  const handleRestore = async (oid: string) => {
    if (!workspaceId || !repoId) return;
    try {
      await versionApi.restore(workspaceId, repoId, oid);
      message.success('版本已恢复');
      const [updated, fileList] = await Promise.all([
        versionApi.history(workspaceId, repoId),
        repoApi.listFiles(workspaceId, repoId),
      ]);
      setVersions(updated);
      setFiles(fileList);
      setSelectedFile(pickDefaultPreviewFile(fileList));
    } catch (err) {
      message.error(err instanceof Error ? err.message : '恢复失败');
    }
  };

  const handleDiff = async (fromOid: string, toOid: string, filePath?: string) => {
    if (!workspaceId || !repoId) return;
    const path = filePath || selectedFile;
    if (!path) {
      message.warning('暂无可对比的文件');
      return;
    }
    try {
      const data = await versionApi.diff(workspaceId, repoId, {
        path,
        from: fromOid,
        to: toOid,
      });
      setDiffData(data);
      setShowDiff(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '对比失败');
    }
  };

  const handleFileChange = (filePath: string) => {
    setSelectedFile(filePath);
    const data = diffData as { fromVersion?: string; toVersion?: string } | null;
    if (data?.fromVersion && data?.toVersion) {
      handleDiff(data.fromVersion, data.toVersion, filePath);
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
        workspaceId={workspaceId}
        repoId={repoId}
        versions={versions}
        files={files}
        selectedFile={selectedFile || undefined}
        onFileChange={handleFileChange}
        onSelectVersions={(from, to) => handleDiff(from, to)}
        onBack={() => setShowDiff(false)}
      />
    );
  }

  return (
    <VersionHistory
      versions={versions}
      canRestore={canRestore}
      onRestore={handleRestore}
      onDiff={(from, to) => handleDiff(from, to)}
    />
  );
}
