import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Empty,
  Spin,
  message,
  Segmented,
  Table,
} from 'antd';
import {
  PlusOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { repoApi } from '../../services';
import type { Repository } from '../../types';

interface RepoListProps {
  workspaceId: string;
  isAdmin: boolean;
}

export function RepoList({ workspaceId, isAdmin }: RepoListProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await repoApi.list(workspaceId);
      setRepos(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const handleCreate = async (values: { name: string; description?: string }) => {
    setCreating(true);
    try {
      const repo = await repoApi.create(workspaceId, values);
      message.success('仓库创建成功');
      setModalOpen(false);
      navigate(`/workspaces/${workspaceId}/repos/${repo.id}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (repoId: string, name: string) => {
    Modal.confirm({
      title: '确认删除仓库',
      content: `确定将「${name}」移入回收站？`,
      okType: 'danger',
      onOk: async () => {
        await repoApi.delete(workspaceId, repoId);
        message.success('仓库已移入回收站');
        load();
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as 'card' | 'list')}
          options={[
            { value: 'card', icon: <AppstoreOutlined /> },
            { value: 'list', icon: <UnorderedListOutlined /> },
          ]}
        />
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            创建仓库
          </Button>
        )}
      </div>

      {repos.length === 0 ? (
        <Empty description="暂无仓库">
          {isAdmin && (
            <Button type="primary" onClick={() => setModalOpen(true)}>
              创建第一个仓库
            </Button>
          )}
        </Empty>
      ) : viewMode === 'card' ? (
        <Row gutter={[16, 16]}>
          {repos.map((repo) => (
            <Col xs={24} sm={12} lg={8} key={repo.id}>
              <Card
                hoverable
                onClick={() => navigate(`/workspaces/${workspaceId}/repos/${repo.id}`)}
                actions={
                  isAdmin
                    ? [
                        <span
                          key="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(repo.id, repo.name);
                          }}
                          style={{ color: '#ff4d4f' }}
                        >
                          删除
                        </span>,
                      ]
                    : undefined
                }
              >
                <Card.Meta
                  avatar={<FolderOpenOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                  title={repo.name}
                  description={
                    <div>
                      <div style={{ minHeight: 40 }}>{repo.description || '暂无描述'}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                        更新于 {new Date(repo.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Table
          rowKey="id"
          dataSource={repos}
          onRow={(record) => ({
            onClick: () => navigate(`/workspaces/${workspaceId}/repos/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          columns={[
            { title: '名称', dataIndex: 'name', key: 'name' },
            { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
            {
              title: '更新时间',
              dataIndex: 'updatedAt',
              key: 'updatedAt',
              render: (v: string) => new Date(v).toLocaleString(),
            },
            ...(isAdmin
              ? [
                  {
                    title: '操作',
                    key: 'action',
                    render: (_: unknown, record: Repository) => (
                      <Button
                        type="link"
                        danger
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(record.id, record.name);
                        }}
                      >
                        删除
                      </Button>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}

      <Modal
        title="创建仓库"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="仓库名称"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          >
            <Input placeholder="例如：产品说明书" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="简要描述仓库用途" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalOpen(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
