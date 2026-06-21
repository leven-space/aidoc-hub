import { useState } from 'react';
import { Button, Empty, Input, List, Modal, Typography } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PendingSelection, ReviewAnnotation } from '../../review/types';

interface AnnotationEditorProps {
  pending: PendingSelection | null;
  draftNote: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function AnnotationEditor({
  pending,
  draftNote,
  onDraftChange,
  onSave,
  onCancel,
}: AnnotationEditorProps) {
  const { t } = useTranslation();

  if (!pending) {
    return (
      <div style={{ padding: 16, color: '#999', fontSize: 13 }}>
        <div>{t('review.selectElementHint')}</div>
        <div style={{ marginTop: 8, fontSize: 12 }}>{t('review.altBrowseHint')}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {t('review.selectedElement')}
      </Typography.Text>
      <Typography.Paragraph
        code
        style={{ marginTop: 4, marginBottom: 12, fontSize: 12, wordBreak: 'break-all' }}
      >
        {pending.locator.descriptor}
      </Typography.Paragraph>
      <Input.TextArea
        rows={4}
        value={draftNote}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={t('review.notePlaceholder')}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <Button size="small" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          size="small"
          type="primary"
          disabled={!draftNote.trim()}
          onClick={onSave}
        >
          {t('review.addNote')}
        </Button>
      </div>
    </div>
  );
}

interface AnnotationListProps {
  annotations: ReviewAnnotation[];
  activeId: string | null;
  pending: PendingSelection | null;
  draftNote: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancelPending: () => void;
  onSelect: (id: string) => void;
  onEdit: (id: string, note: string) => void;
  onDelete: (id: string) => void;
}

export function AnnotationList({
  annotations,
  activeId,
  pending,
  draftNote,
  onDraftChange,
  onSave,
  onCancelPending,
  onSelect,
  onEdit,
  onDelete,
}: AnnotationListProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const editingAnnotation = editingId
    ? annotations.find((item) => item.id === editingId)
    : undefined;

  const openEditModal = (item: ReviewAnnotation) => {
    setEditingId(item.id);
    setEditDraft(item.userNote);
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const submitEdit = () => {
    if (!editingId || !editDraft.trim()) return;
    onEdit(editingId, editDraft.trim());
    closeEditModal();
  };

  return (
    <div
      data-tour="review-annotations"
      style={{
        width: 320,
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        background: '#fafafa',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          fontWeight: 600,
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
        }}
      >
        {t('review.annotationList')} ({annotations.length})
      </div>

      <AnnotationEditor
        pending={pending}
        draftNote={draftNote}
        onDraftChange={onDraftChange}
        onSave={onSave}
        onCancel={onCancelPending}
      />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {annotations.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('review.emptyAnnotations')}
            style={{ marginTop: 48 }}
          />
        ) : (
          <List
            dataSource={annotations}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: activeId === item.id ? '#e6f4ff' : '#fff',
                  padding: '12px 16px',
                }}
                onClick={() => onSelect(item.id)}
                actions={[
                  <Button
                    key="edit"
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(item);
                    }}
                  />,
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Typography.Text strong style={{ fontSize: 13 }}>
                      #{index + 1} {item.locator.descriptor}
                    </Typography.Text>
                  }
                  description={
                    <Typography.Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ marginBottom: 0, fontSize: 12 }}
                    >
                      {item.userNote}
                    </Typography.Paragraph>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      <Modal
        title={t('review.editNoteTitle')}
        open={Boolean(editingId)}
        onCancel={closeEditModal}
        onOk={submitEdit}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        okButtonProps={{ disabled: !editDraft.trim() }}
        destroyOnHidden
      >
        {editingAnnotation && (
          <>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {editingAnnotation.locator.descriptor}
            </Typography.Text>
            <Input.TextArea
              rows={5}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              placeholder={t('review.notePlaceholder')}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
