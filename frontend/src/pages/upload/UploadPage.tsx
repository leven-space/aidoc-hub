import { useEffect, useRef, useState } from 'react';
import { Upload, Form, Input, Button, message, Progress, Typography, Space, Radio } from 'antd';
import { InboxOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { repoApi } from '../../services';
import type { Repository } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { shouldReadUploadFileAsText } from '../../utils/uploadFile';

const { Dragger } = Upload;

interface FileEntry {
  filePath: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export function UploadPage() {
  const { t } = useTranslation();
  const { workspaceId, repoId } = useParams<{ workspaceId: string; repoId: string }>();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspaceId && repoId) {
      repoApi.get(workspaceId, repoId).then(setRepo).catch(() => {});
    }
  }, [workspaceId, repoId]);

  const readFileEntry = (file: File, relativePath: string): Promise<FileEntry> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(t('upload.readFileFailed', { path: relativePath })));
      if (shouldReadUploadFileAsText(relativePath)) {
        reader.onload = (e) => {
          resolve({ filePath: relativePath, content: e.target?.result as string });
        };
        reader.readAsText(file);
        return;
      }
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ filePath: relativePath, content: base64, encoding: 'base64' });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = (fileList: File[]) => {
    if (fileList.length === 0) {
      message.warning(t('upload.noFilesSelected'));
      return;
    }

    Promise.all(
      fileList.map((file) => {
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        return readFileEntry(file, relativePath);
      }),
    ).then((entries) => {
      setFiles((prev) => {
        const map = new Map(prev.map((f) => [f.filePath, f]));
        entries.forEach((e) => map.set(e.filePath, e));
        return Array.from(map.values());
      });
    });
  };

  const handleFolderSelect = () => {
    folderInputRef.current?.click();
  };

  const onFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      handleFiles(Array.from(fileList));
    }
    // Reset so the same folder can be selected again
    e.target.value = '';
  };

  const handleSubmit = async (values: { message: string }) => {
    if (!workspaceId || !repoId || files.length === 0) {
      message.warning(t('upload.uploadFirst'));
      return;
    }
    setUploading(true);
    setProgress(30);
    try {
      await repoApi.commit(workspaceId, repoId, {
        files,
        message: values.message,
        baseVersion: repo?.latestVersion?.oid,
      });
      setProgress(100);
      message.success(t('upload.commitSuccess'));
      navigate(`/workspaces/${workspaceId}/repos/${repoId}`);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'upload.commitFailed'));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <PageContainer
      title={t('upload.title')}
      breadcrumb={[
        { title: t('workspace.breadcrumb'), href: '/' },
        { title: repo?.name ?? t('workspace.tabsRepos'), href: `/workspaces/${workspaceId}/repos/${repoId}` },
        { title: t('upload.breadcrumb') },
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label={t('upload.uploadMode')}>
          <Radio.Group
            value={uploadMode}
            onChange={(e) => {
              setUploadMode(e.target.value);
              setFiles([]);
            }}
          >
            <Radio.Button value="files">{t('upload.selectFile')}</Radio.Button>
            <Radio.Button value="folder">{t('upload.selectFolder')}</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label={t('upload.uploadFiles')}>
          {uploadMode === 'files' ? (
            <Dragger
              multiple
              beforeUpload={(file) => {
                handleFiles([file]);
                return false;
              }}
              showUploadList={false}
              style={{ background: '#fafafa' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{t('upload.dropHint')}</p>
              <p className="ant-upload-hint">{t('upload.dropHintDetail')}</p>
            </Dragger>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Button
                icon={<FolderOpenOutlined />}
                size="large"
                onClick={handleFolderSelect}
                style={{ height: 120, width: '100%', borderStyle: 'dashed' }}
              >
                <div>
                  <p style={{ fontSize: 16, margin: '8px 0' }}>{t('upload.folderHint')}</p>
                  <p style={{ color: '#999', fontSize: 13 }}>{t('upload.folderHintDetail')}</p>
                </div>
              </Button>
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error non-standard attribute for folder selection
                webkitdirectory=""
                directory=""
                multiple
                style={{ display: 'none' }}
                onChange={onFolderInputChange}
              />
            </div>
          )}
        </Form.Item>

        {files.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Typography.Text type="secondary">
                {t('upload.selectedCount', { count: files.length })}
              </Typography.Text>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => setFiles([])}
              >
                {t('upload.clearAll')}
              </Button>
            </Space>
            <ul style={{ maxHeight: 300, overflow: 'auto', marginTop: 8 }}>
              {files.map((f) => (
                <li key={f.filePath} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <Typography.Text ellipsis style={{ maxWidth: 400 }}>{f.filePath}</Typography.Text>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setFiles((prev) => prev.filter((x) => x.filePath !== f.filePath))}
                  >
                    {t('common.remove')}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploading && <Progress percent={progress} style={{ marginBottom: 16 }} />}

        <Form.Item
          name="message"
          label={t('upload.commitMessage')}
          rules={[{ required: true, message: t('validation.commitMessageRequired') }]}
        >
          <Input.TextArea rows={3} placeholder={t('upload.commitMessagePlaceholder')} />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button
            onClick={() => navigate(`/workspaces/${workspaceId}/repos/${repoId}`)}
            style={{ marginRight: 8 }}
          >
            {t('common.cancel')}
          </Button>
          <Button type="primary" htmlType="submit" loading={uploading}>
            {t('upload.title')}
          </Button>
        </Form.Item>
      </Form>
    </PageContainer>
  );
}
