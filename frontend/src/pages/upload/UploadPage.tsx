import { useEffect, useRef, useState } from 'react';
import { Upload, Form, Input, Button, message, Progress, Typography, Space, Radio } from 'antd';
import { InboxOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/PageContainer';
import { repoApi } from '../../services';
import type { Repository } from '../../types';

const { Dragger } = Upload;

interface FileEntry {
  filePath: string;
  content: string;
}

export function UploadPage() {
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

  const readFileAsText = (file: File, relativePath: string): Promise<FileEntry> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({ filePath: relativePath, content: e.target?.result as string });
      };
      reader.readAsText(file);
    });
  };

  const handleFiles = (fileList: File[]) => {
    if (fileList.length === 0) {
      message.warning('未选择任何文件');
      return;
    }

    Promise.all(
      fileList.map((file) => {
        // Use webkitRelativePath if available (folder upload), otherwise use file name
        const relativePath = (file as any).webkitRelativePath || file.name;
        return readFileAsText(file, relativePath);
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
      message.warning('请先上传文件');
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
      message.success('提交成功');
      navigate(`/workspaces/${workspaceId}/repos/${repoId}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '提交失败');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <PageContainer
      title="提交新版本"
      breadcrumb={[
        { title: '工作空间', href: '/' },
        { title: '仓库', href: `/workspaces/${workspaceId}/repos/${repoId}` },
        { title: '提交新版本' },
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="上传方式">
          <Radio.Group
            value={uploadMode}
            onChange={(e) => {
              setUploadMode(e.target.value);
              setFiles([]);
            }}
          >
            <Radio.Button value="files">选择文件</Radio.Button>
            <Radio.Button value="folder">选择文件夹</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="上传文件">
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
              <p className="ant-upload-text">点击或拖拽文件到此区域</p>
              <p className="ant-upload-hint">
                支持批量上传 HTML 工程中的所有文件（HTML、CSS、JS、图片等）
              </p>
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
                  <p style={{ fontSize: 16, margin: '8px 0' }}>点击选择文件夹</p>
                  <p style={{ color: '#999', fontSize: 13 }}>
                    将自动读取文件夹内所有文件，保留目录结构
                  </p>
                </div>
              </Button>
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error non-standard attribute for folder selection
                webkitdirectory=""
                // @ts-expect-error non-standard attribute
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
                已选择 {files.length} 个文件：
              </Typography.Text>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => setFiles([])}
              >
                清空全部
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
                    移除
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploading && <Progress percent={progress} style={{ marginBottom: 16 }} />}

        <Form.Item
          name="message"
          label="提交说明"
          rules={[{ required: true, message: '请输入提交说明' }]}
        >
          <Input.TextArea rows={3} placeholder="描述本次更新的内容" />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button
            onClick={() => navigate(`/workspaces/${workspaceId}/repos/${repoId}`)}
            style={{ marginRight: 8 }}
          >
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={uploading}>
            提交新版本
          </Button>
        </Form.Item>
      </Form>
    </PageContainer>
  );
}
import { useEffect, useState } from 'react';
import { Upload, Form, Input, Button, message, Progress, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/PageContainer';
import { repoApi } from '../../services';
import type { Repository } from '../../types';

const { Dragger } = Upload;

interface FileEntry {
  filePath: string;
  content: string;
}

export function UploadPage() {
  const { workspaceId, repoId } = useParams<{ workspaceId: string; repoId: string }>();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    if (workspaceId && repoId) {
      repoApi.get(workspaceId, repoId).then(setRepo).catch(() => {});
    }
  }, [workspaceId, repoId]);

  const handleFiles = (fileList: File[]) => {
    const htmlFiles = fileList.filter(
      (f) => f.name.endsWith('.html') || f.name.endsWith('.htm'),
    );
    if (htmlFiles.length === 0) {
      message.warning('仅支持 .html / .htm 文件');
      return;
    }

    Promise.all(
      htmlFiles.map(
        (file) =>
          new Promise<FileEntry>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({ filePath: file.name, content: e.target?.result as string });
            };
            reader.readAsText(file);
          }),
      ),
    ).then((entries) => {
      setFiles((prev) => {
        const map = new Map(prev.map((f) => [f.filePath, f]));
        entries.forEach((e) => map.set(e.filePath, e));
        return Array.from(map.values());
      });
    });
  };

  const handleSubmit = async (values: { message: string }) => {
    if (!workspaceId || !repoId || files.length === 0) {
      message.warning('请先上传文件');
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
      message.success('提交成功');
      navigate(`/workspaces/${workspaceId}/repos/${repoId}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '提交失败');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <PageContainer
      title="提交新版本"
      breadcrumb={[
        { title: '工作空间', href: '/' },
        { title: '仓库', href: `/workspaces/${workspaceId}/repos/${repoId}` },
        { title: '提交新版本' },
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="上传文件">
          <Dragger
            multiple
            accept=".html,.htm"
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
            <p className="ant-upload-text">点击或拖拽 HTML 文件到此区域</p>
            <p className="ant-upload-hint">支持批量上传，仅接受 .html / .htm 格式</p>
          </Dragger>
        </Form.Item>

        {files.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">已选择 {files.length} 个文件：</Typography.Text>
            <ul>
              {files.map((f) => (
                <li key={f.filePath}>
                  {f.filePath}
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setFiles((prev) => prev.filter((x) => x.filePath !== f.filePath))}
                  >
                    移除
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploading && <Progress percent={progress} style={{ marginBottom: 16 }} />}

        <Form.Item
          name="message"
          label="提交说明"
          rules={[{ required: true, message: '请输入提交说明' }]}
        >
          <Input.TextArea rows={3} placeholder="描述本次更新的内容" />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button
            onClick={() => navigate(`/workspaces/${workspaceId}/repos/${repoId}`)}
            style={{ marginRight: 8 }}
          >
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={uploading}>
            提交新版本
          </Button>
        </Form.Item>
      </Form>
    </PageContainer>
  );
}
