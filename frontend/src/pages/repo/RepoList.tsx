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
import { useTranslation } from 'react-i18next';
import { repoApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import type { Repository } from '../../types';
import { brandColors } from '../../theme/brand';

interface RepoListProps {
  workspaceId: string;
  isAdmin: boolean;
}

export function RepoList({ workspaceId, isAdmin }: RepoListProps) {
  const { t } = useTranslation();
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
      message.error(getApiErrorMessage(err, 'common.loadFailed'));
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
      message.success(t('repo.createSuccess'));
      setModalOpen(false);
      navigate(`/workspaces/${workspaceId}/repos/${repo.id}`);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'common.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (repoId: string, name: string) => {
    Modal.confirm({
      title: t('repo.deleteConfirmTitle'),
      content: t('repo.deleteConfirmContent', { name }),
      okType: 'danger',
      onOk: async () => {
        await repoApi.delete(workspaceId, repoId);
        message.success(t('repo.deleteSuccess'));
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
            {t('repo.create')}
          </Button>
        )}
      </div>

      {repos.length === 0 ? (
        <Empty description={t('repo.empty')}>
          {isAdmin && (
            <Button type="primary" onClick={() => setModalOpen(true)}>
              {t('repo.createFirst')}
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
                          {t('common.delete')}
                        </span>,
                      ]
                    : undefined
                }
              >
                <Card.Meta
                  avatar={<FolderOpenOutlined style={{ fontSize: 24, color: brandColors.primary }} />}
                  title={repo.name}
                  description={
                    <div>
                      <div style={{ minHeight: 40 }}>{repo.description || t('common.noDescription')}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                        {t('common.updatedAt')} {new Date(repo.updatedAt).toLocaleDateString()}
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
            { title: t('repo.columnName'), dataIndex: 'name', key: 'name' },
            { title: t('repo.columnDesc'), dataIndex: 'description', key: 'description', ellipsis: true },
            {
              title: t('repo.columnUpdated'),
              dataIndex: 'updatedAt',
              key: 'updatedAt',
              render: (v: string) => new Date(v).toLocaleString(),
            },
            ...(isAdmin
              ? [
                  {
                    title: t('repo.columnAction'),
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
                        {t('common.delete')}
                      </Button>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}

      <Modal
        title={t('repo.createModalTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label={t('repo.name')}
            rules={[{ required: true, message: t('validation.repoNameRequired') }]}
          >
            <Input placeholder={t('repo.namePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('repo.description')}>
            <Input.TextArea rows={3} placeholder={t('repo.descPlaceholder')} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalOpen(false)} style={{ marginRight: 8 }}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              {t('common.create')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
