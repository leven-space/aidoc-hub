import { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Button, Modal, Form, Input, Empty, Spin, message } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/PageContainer';
import { workspaceApi } from '../../services';
import type { Workspace } from '../../types';

export function WorkspaceList() {
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
      message.error(err instanceof Error ? err.message : '加载失败');
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
      message.success('空间创建成功');
      setModalOpen(false);
      navigate(`/workspaces/${ws.id}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败');
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
      title="工作空间"
      subtitle="管理您的文档协作空间"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          创建空间
        </Button>
      }
    >
      {workspaces.length === 0 ? (
        <Empty description="暂无工作空间">
          <Button type="primary" onClick={() => setModalOpen(true)}>
            创建第一个空间
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
                    <Tag color={isTeam ? 'blue' : 'green'}>{isTeam ? '团队空间' : '个人空间'}</Tag>
                  </div>
                  <Card.Meta
                    title={ws.name}
                    description={
                      <div>
                        <div style={{ marginBottom: 8, minHeight: 40 }}>
                          {ws.description || '暂无描述'}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {ws._count?.members || 0} 成员 · {ws._count?.repositories || 0} 仓库
                          <br />
                          更新于 {new Date(ws.updatedAt).toLocaleDateString()}
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
        title="创建团队空间"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="空间名称"
            rules={[{ required: true, message: '请输入空间名称' }]}
          >
            <Input placeholder="例如：产品文档团队" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="简要描述空间用途" />
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
    </PageContainer>
  );
}
