import { useEffect, useState } from 'react';
import { Table, Form, Input, DatePicker, Button, Space, message, Select } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { auditApi, workspaceApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import type { AuditLog, Workspace } from '../../types';

export function AuditLogPage() {
  const { t } = useTranslation();
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
      message.error(getApiErrorMessage(err, 'common.loadFailed'));
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
    const header = `${t('audit.csvHeader')}\n`;
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
      title: t('audit.columnTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('audit.columnUser'),
      key: 'user',
      width: 120,
      render: (_: unknown, record: AuditLog) => record.user?.name || '-',
    },
    { title: t('audit.columnAction'), dataIndex: 'action', key: 'action', ellipsis: true },
    { title: t('audit.columnTargetType'), dataIndex: 'targetType', key: 'targetType', width: 100 },
    { title: t('audit.columnIp'), dataIndex: 'ip', key: 'ip', width: 120 },
  ];

  return (
    <PageContainer
      title={t('audit.title')}
      subtitle={t('audit.subtitle')}
      extra={
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          {t('audit.exportCsv')}
        </Button>
      }
    >
      <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="workspaceId">
          <Select
            placeholder={t('audit.workspacePlaceholder')}
            allowClear
            style={{ width: 180 }}
            options={workspaces.map((ws) => ({ label: ws.name, value: ws.id }))}
          />
        </Form.Item>
        <Form.Item name="action">
          <Input placeholder={t('audit.actionPlaceholder')} prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="dateRange">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {t('common.filter')}
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                setFilters({});
                setPage(1);
              }}
            >
              {t('common.reset')}
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
          showTotal: (count) => t('audit.total', { total: count }),
        }}
        expandable={{
          expandedRowRender: (record) => (
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {record.details || t('audit.noDetail')}
            </pre>
          ),
        }}
      />
    </PageContainer>
  );
}
