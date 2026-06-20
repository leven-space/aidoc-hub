import { useEffect, useState, type ReactNode } from 'react';
import {
  Layout,
  Tree,
  Button,
  Space,
  Spin,
  message,
  Dropdown,
  type MenuProps,
} from 'antd';
import {
  UploadOutlined,
  HistoryOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  FileOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { HtmlPreview } from '../../components/HtmlPreview';
import { ShareModal } from '../../components/ShareModal';
import { repoApi, versionApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import type { Repository, VersionInfo } from '../../types';
import { pickDefaultPreviewFile } from '../../utils/pickPreviewFile';
import { getDownloadFilename, isFolderPath } from '../../utils/downloadPath';
import { triggerFileDownload } from '../../utils/triggerDownload';

const { Sider, Content } = Layout;

export function RepoDetail() {
  const { t } = useTranslation();
  const { workspaceId, repoId } = useParams<{ workspaceId: string; repoId: string }>();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>();
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const navigate = useNavigate();

  const isHtmlFile = (fp: string) => /\.(html|htm)$/i.test(fp);

  const previewUrl =
    workspaceId && repoId && selectedFile && isHtmlFile(selectedFile)
      ? repoApi.getPreviewUrl(workspaceId, repoId, selectedFile, selectedVersion)
      : undefined;

  const load = async () => {
    if (!workspaceId || !repoId) return;
    setLoading(true);
    try {
      const [repoData, fileList, versionList] = await Promise.all([
        repoApi.get(workspaceId, repoId),
        repoApi.listFiles(workspaceId, repoId),
        versionApi.history(workspaceId, repoId),
      ]);
      setRepo(repoData);
      setFiles(fileList);
      setVersions(versionList);
      if (versionList.length > 0) {
        setSelectedVersion(versionList[0].oid);
      }
      const defaultFile = pickDefaultPreviewFile(fileList);
      if (defaultFile) {
        setSelectedFile(defaultFile);
      }
    } catch (err) {
      message.error(getApiErrorMessage(err, 'common.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId, repoId]);

  useEffect(() => {
    const loadPreview = async () => {
      if (!workspaceId || !repoId || !selectedFile) {
        setPreviewContent('');
        return;
      }
      if (isHtmlFile(selectedFile)) {
        setPreviewContent('');
        return;
      }
      setPreviewLoading(true);
      try {
        const content = await repoApi.readFile(
          workspaceId,
          repoId,
          selectedFile,
          selectedVersion,
        );
        setPreviewContent(typeof content === 'string' ? content : String(content));
      } catch {
        setPreviewContent('');
      } finally {
        setPreviewLoading(false);
      }
    };
    loadPreview();
  }, [workspaceId, repoId, selectedFile, selectedVersion]);

  const handleDownload = async () => {
    if (!selectedFile || !workspaceId || !repoId) return;
    const url = repoApi.getDownloadUrl(
      workspaceId,
      repoId,
      selectedFile,
      selectedVersion,
    );
    const filename = getDownloadFilename(selectedFile, files);
    try {
      await triggerFileDownload(url, filename);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'repo.downloadFailed'));
    }
  };

  const selectedIsFolder = selectedFile ? isFolderPath(selectedFile, files) : false;

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: selectedIsFolder ? t('repo.downloadFolder') : t('repo.downloadFile'),
      disabled: !selectedFile,
      onClick: handleDownload,
    },
  ];

  if (loading || !repo || !workspaceId || !repoId) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Build tree data from flat file paths
  type TreeNode = {
    key: string;
    title: string;
    icon: ReactNode;
    isLeaf?: boolean;
    children?: TreeNode[];
  };

  const buildTreeData = (filePaths: string[]): TreeNode[] => {
    const root: Record<string, Record<string, unknown> | null> = {};
    for (const fp of filePaths) {
      const parts = fp.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = i === parts.length - 1 ? null : {};
        }
        if (current[part] !== null) {
          current = current[part] as Record<string, Record<string, unknown> | null>;
        }
      }
    }

    const buildNode = (obj: Record<string, unknown>, prefix: string): TreeNode[] => {
      return Object.keys(obj)
        .sort((a, b) => {
          // Folders first, then files
          const aIsFolder = obj[a] !== null;
          const bIsFolder = obj[b] !== null;
          if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
          return a.localeCompare(b);
        })
        .map((key) => {
          const fullPath = prefix ? `${prefix}/${key}` : key;
          if (obj[key] === null) {
            // File node
            return {
              key: fullPath,
              title: key,
              icon: <FileOutlined />,
              isLeaf: true,
            };
          }
          // Folder node
          return {
            key: fullPath,
            title: key,
            icon: <FolderOutlined />,
            children: buildNode(obj[key] as Record<string, unknown>, fullPath),
          };
        });
    };

    return buildNode(root, '');
  };

  const treeData = buildTreeData(files);

  return (
    <PageContainer
      title={repo.name}
      subtitle={repo.description}
      breadcrumb={[
        { title: t('workspace.breadcrumb'), href: '/' },
        { title: t('workspace.detailSpace'), href: `/workspaces/${workspaceId}` },
        { title: repo.name },
      ]}
      extra={
        <Space>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/workspaces/${workspaceId}/repos/${repoId}/versions`)}
          >
            {t('repo.versionHistory')}
          </Button>
          <Button icon={<ShareAltOutlined />} onClick={() => setShareOpen(true)}>
            {t('repo.share')}
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => navigate(`/workspaces/${workspaceId}/repos/${repoId}/upload`)}
          >
            {t('repo.commitNew')}
          </Button>
          <Dropdown menu={{ items: moreMenuItems }}>
            <Button>{t('common.more')}</Button>
          </Dropdown>
        </Space>
      }
    >
      <Layout style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 6 }}>
        <Sider width={240} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div style={{ padding: '12px 16px', fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>
            {t('repo.fileList')}
          </div>
          {files.length === 0 ? (
            <div style={{ padding: 24, color: '#999', textAlign: 'center' }}>
              {t('repo.noFiles')}
            </div>
          ) : (
            <Tree
              showIcon
              treeData={treeData}
              selectedKeys={selectedFile ? [selectedFile] : []}
              onSelect={(keys) => {
                if (keys[0]) setSelectedFile(String(keys[0]));
              }}
              style={{ padding: 8 }}
            />
          )}
        </Sider>
        <Content style={{ padding: 16 }}>
          <HtmlPreview
            content={previewContent}
            previewUrl={previewUrl}
            loading={previewLoading}
            filePath={selectedFile || undefined}
            versions={versions}
            selectedVersion={selectedVersion}
            onVersionChange={setSelectedVersion}
          />
        </Content>
      </Layout>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        workspaceId={workspaceId}
        repoId={repoId}
        versions={versions}
      />
    </PageContainer>
  );
}
