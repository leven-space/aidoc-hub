import { useEffect, useState } from 'react';
import { Table, Form, Input, DatePicker, Button, Space, message, Select } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '../../components/PageContainer';
import { auditApi, workspaceApi } from '../../services';
import type { AuditLog, Workspace } from '../../types';

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filters, setFilters] = useState<{
    workspaceId?: string;
    action?: string;
    from?: string;
    to?: string;
  }>({});
  const [form] = Form.useForm();

  useEffect(() => {
    workspaceApi.list().then(setWorkspaces).catch(() => {});
  }, []);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const result = await auditApi.list({ ...filters, page: p, pageSize: 20 });
      setLogs(result.items);
      setTotal(result.total);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, filters]);

  const handleSearch = (values: {
    workspaceId?: string;
    action?: string;
    dateRange?: [unknown, unknown];
  }) => {
    setPage(1);
    setFilters({
      workspaceId: values.workspaceId,
      action: values.action,
      from: values.dateRange?.[0]
        ? new Date(values.dateRange[0] as string).toISOString()
        : undefined,
      to: values.dateRange?.[1]
        ? new Date(values.dateRange[1] as string).toISOString()
        : undefined,
    });
  };

  const handleExport = () => {
    const header = '时间,操作人,操作,目标类型,目标ID,详情,IP\n';
    const rows = logs
      .map(
        (log) =>
          `${log.createdAt},${log.user?.name || '-'},${log.action},${log.targetType},${log.targetId || '-'},${log.details.replace(/,/g, ';')},${log.ip}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作人',
      key: 'user',
      width: 120,
      render: (_: unknown, record: AuditLog) => record.user?.name || '-',
    },
    { title: '操作', dataIndex: 'action', key: 'action', ellipsis: true },
    { title: '目标类型', dataIndex: 'targetType', key: 'targetType', width: 100 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 120 },
  ];

  return (
    <PageContainer
      title="审计日志"
      subtitle="查看系统操作记录（管理员可见）"
      extra={
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出 CSV
        </Button>
      }
    >
      <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="workspaceId">
          <Select
            placeholder="选择空间"
            allowClear
            style={{ width: 180 }}
            options={workspaces.map((ws) => ({ label: ws.name, value: ws.id }))}
          />
        </Form.Item>
        <Form.Item name="action">
          <Input placeholder="操作类型" prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="dateRange">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              筛选
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                setFilters({});
                setPage(1);
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
        expandable={{
          expandedRowRender: (record) => (
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {record.details || '无详情'}
            </pre>
          ),
        }}
      />
    </PageContainer>
  );
}
