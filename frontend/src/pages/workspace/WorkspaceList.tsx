import { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Button, Modal, Form, Input, Empty, Spin, message } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { workspaceApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import type { Workspace } from '../../types';

export function WorkspaceList() {
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await workspaceApi.list();
      setWorkspaces(data);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'common.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (values: { name: string; description?: string }) => {
    setCreating(true);
    try {
      const ws = await workspaceApi.create(values);
      message.success(t('workspace.createSuccess'));
      setModalOpen(false);
      navigate(`/workspaces/${ws.id}`);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'common.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageContainer
      title={t('workspace.title')}
      subtitle={t('workspace.subtitle')}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('workspace.create')}
        </Button>
      }
    >
      {workspaces.length === 0 ? (
        <Empty description={t('workspace.empty')}>
          <Button type="primary" onClick={() => setModalOpen(true)}>
            {t('workspace.createFirst')}
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {workspaces.map((ws) => {
            const isTeam = (ws._count?.members || 1) > 1;
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={ws.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/workspaces/${ws.id}`)}
                  style={{
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  styles={{ body: { padding: 20 } }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    {isTeam ? <TeamOutlined style={{ fontSize: 20, color: '#1677ff' }} /> : <UserOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
                    <Tag color={isTeam ? 'blue' : 'green'}>{isTeam ? t('workspace.teamSpace') : t('workspace.personalSpace')}</Tag>
                  </div>
                  <Card.Meta
                    title={ws.name}
                    description={
                      <div>
                        <div style={{ marginBottom: 8, minHeight: 40 }}>
                          {ws.description || t('common.noDescription')}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {t('common.membersRepos', {
                            members: ws._count?.members || 0,
                            repos: ws._count?.repositories || 0,
                          })}
                          <br />
                          {t('common.updatedAt')} {new Date(ws.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal
        title={t('workspace.createModalTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label={t('workspace.name')}
            rules={[{ required: true, message: t('validation.workspaceNameRequired') }]}
          >
            <Input placeholder={t('workspace.namePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('workspace.description')}>
            <Input.TextArea rows={3} placeholder={t('workspace.descPlaceholder')} />
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
    </PageContainer>
  );
}
