import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Spin, message } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnnotationList } from '../../components/review/AnnotationList';
import { ReviewToolbar } from '../../components/review/ReviewToolbar';
import { repoApi, versionApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import { getReviewBridgeScriptUrl, injectReviewBridge } from '../../review/inject-bridge';
import {
  REVIEW_MESSAGE_SOURCE,
  ReviewMessageType,
  isTrustedReviewOrigin,
  parseBridgeToShellMessage,
  postToBridge,
} from '../../review/messages';
import { buildReviewPrompt } from '../../review/prompt-builder';
import {
  getReviewStorageKey,
  loadReviewAnnotations,
  saveReviewAnnotations,
} from '../../review/review-storage';
import type { PendingSelection, ReviewAnnotation, ReviewContext } from '../../review/types';

const BRIDGE_READY_TIMEOUT_MS = 8000;

function createAnnotationId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ReviewPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { workspaceId, repoId } = useParams<{ workspaceId: string; repoId: string }>();
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path') ?? '';
  const versionOidParam = searchParams.get('version') ?? undefined;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [bridgeError, setBridgeError] = useState(false);
  const [srcDoc, setSrcDoc] = useState('');
  const [repoName, setRepoName] = useState('');
  const [resolvedVersionOid, setResolvedVersionOid] = useState<string | undefined>();
  const [versionLabel, setVersionLabel] = useState<string | undefined>();
  const [commitMessage, setCommitMessage] = useState<string | undefined>();
  const [annotations, setAnnotations] = useState<ReviewAnnotation[]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bannerClosed, setBannerClosed] = useState(false);
  const [storageKey, setStorageKey] = useState('');
  const [iframeReloadKey, setIframeReloadKey] = useState(0);

  const parentOrigin = window.location.origin;
  const promptLanguage = i18n.language === 'en-US' ? 'en' : 'zh';

  const reviewContext = useMemo<ReviewContext | null>(() => {
    if (!workspaceId || !repoId || !filePath) return null;
    return {
      workspaceId,
      repoId,
      repoName,
      filePath,
      versionOid: resolvedVersionOid,
      versionLabel,
      commitMessage,
    };
  }, [
    workspaceId,
    repoId,
    filePath,
    repoName,
    resolvedVersionOid,
    versionLabel,
    commitMessage,
  ]);

  const loadPage = useCallback(async () => {
    if (!workspaceId || !repoId || !filePath) return;
    setLoading(true);
    setBridgeReady(false);
    setBridgeError(false);
    try {
      const [repo, versions] = await Promise.all([
        repoApi.get(workspaceId, repoId),
        versionApi.history(workspaceId, repoId),
      ]);
      setRepoName(repo.name);

      let effectiveVersionOid = versionOidParam;
      if (versionOidParam) {
        const matched = versions.find((v) => v.oid === versionOidParam);
        if (!matched) {
          message.warning(t('review.versionNotFound'));
          effectiveVersionOid = versions[0]?.oid;
        }
      } else {
        effectiveVersionOid = versions[0]?.oid;
      }
      setResolvedVersionOid(effectiveVersionOid);

      const version = versions.find((v) => v.oid === effectiveVersionOid);
      if (version) {
        setVersionLabel(`v${version.version}`);
        setCommitMessage(version.message);
      } else {
        setVersionLabel(undefined);
        setCommitMessage(undefined);
      }

      const key = getReviewStorageKey(workspaceId, repoId, filePath, effectiveVersionOid);
      setStorageKey(key);
      setAnnotations(loadReviewAnnotations(key));

      const html = await repoApi.readFile(
        workspaceId,
        repoId,
        filePath,
        effectiveVersionOid,
      );

      const bridgeUrl = getReviewBridgeScriptUrl(parentOrigin);
      const injected = injectReviewBridge(
        typeof html === 'string' ? html : String(html),
        bridgeUrl,
        parentOrigin,
      );
      setSrcDoc(injected);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'review.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, repoId, filePath, versionOidParam, parentOrigin, t]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!storageKey) return;
    saveReviewAnnotations(storageKey, annotations);
  }, [annotations, storageKey]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isTrustedReviewOrigin(event.origin, parentOrigin)) return;

      const bridgeMessage = parseBridgeToShellMessage(event.data);
      if (!bridgeMessage) return;

      if (bridgeMessage.type === ReviewMessageType.BRIDGE_READY) {
        setBridgeReady(true);
        setBridgeError(false);
        return;
      }

      if (bridgeMessage.type === ReviewMessageType.ELEMENT_SELECTED) {
        setPending(bridgeMessage.payload);
        setDraftNote('');
        setActiveId(null);
        postToBridge(
          iframeRef.current,
          {
            source: REVIEW_MESSAGE_SOURCE,
            type: ReviewMessageType.CLEAR_HIGHLIGHT,
          },
          parentOrigin,
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [parentOrigin]);

  useEffect(() => {
    if (loading || !srcDoc || bridgeReady || bridgeError) return undefined;

    const timer = window.setTimeout(() => {
      setBridgeError(true);
    }, BRIDGE_READY_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [loading, srcDoc, bridgeReady, bridgeError]);

  const handleBack = () => {
    navigate(`/workspaces/${workspaceId}/repos/${repoId}`);
  };

  const handleSaveNote = () => {
    if (!pending || !draftNote.trim()) return;
    const annotation: ReviewAnnotation = {
      id: createAnnotationId(),
      action: 'modify',
      userNote: draftNote.trim(),
      locator: pending.locator,
      htmlSnippet: pending.htmlSnippet,
      createdAt: Date.now(),
    };
    setAnnotations((prev) => [...prev, annotation]);
    setPending(null);
    setDraftNote('');
    message.success(t('review.noteAdded'));
  };

  const handleSelectAnnotation = (id: string) => {
    setActiveId(id);
    const annotation = annotations.find((a) => a.id === id);
    if (!annotation) return;
    postToBridge(
      iframeRef.current,
      {
        source: REVIEW_MESSAGE_SOURCE,
        type: ReviewMessageType.HIGHLIGHT_ANNOTATION,
        payload: {
          annotationId: id,
          cssPath: annotation.locator.cssPath,
          nthOfTypePath: annotation.locator.nthOfTypePath,
        },
      },
      parentOrigin,
    );
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (activeId === id) {
      setActiveId(null);
      postToBridge(
        iframeRef.current,
        {
          source: REVIEW_MESSAGE_SOURCE,
          type: ReviewMessageType.CLEAR_HIGHLIGHT,
        },
        parentOrigin,
      );
    }
  };

  const handleEditAnnotation = (id: string, note: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, userNote: note } : a)),
    );
    message.success(t('review.noteUpdated'));
  };

  const handleCopyPrompt = async () => {
    if (!reviewContext || annotations.length === 0) {
      message.warning(t('review.copyEmpty'));
      return;
    }
    const prompt = buildReviewPrompt(annotations, reviewContext, promptLanguage);
    try {
      await navigator.clipboard.writeText(prompt);
      message.success(t('review.copySuccess'));
    } catch {
      message.error(t('review.copyFailed'));
    }
  };

  const handleRetryBridge = () => {
    setBridgeReady(false);
    setBridgeError(false);
    setIframeReloadKey((key) => key + 1);
  };

  if (!workspaceId || !repoId || !filePath) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        {t('review.missingParams')}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
      }}
    >
      <ReviewToolbar
        repoName={repoName}
        filePath={filePath}
        versionLabel={versionLabel}
        copyDisabled={annotations.length === 0}
        onBack={handleBack}
        onCopy={handleCopyPrompt}
      />

      {!bannerClosed && (
        <Alert
          type="info"
          showIcon
          closable
          onClose={() => setBannerClosed(true)}
          message={t('review.bannerTitle')}
          description={t('review.bannerDesc')}
          style={{ flexShrink: 0, borderRadius: 0 }}
        />
      )}

      {bridgeError && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setBridgeError(false)}
          message={t('review.bridgeErrorTitle')}
          description={t('review.bridgeErrorDesc')}
          action={
            <a onClick={handleRetryBridge} style={{ whiteSpace: 'nowrap' }}>
              {t('review.bridgeRetry')}
            </a>
          }
          style={{ flexShrink: 0, borderRadius: 0 }}
        />
      )}

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <AnnotationList
          annotations={annotations}
          activeId={activeId}
          pending={pending}
          draftNote={draftNote}
          onDraftChange={setDraftNote}
          onSave={handleSaveNote}
          onCancelPending={() => {
            setPending(null);
            setDraftNote('');
          }}
          onSelect={handleSelectAnnotation}
          onEdit={handleEditAnnotation}
          onDelete={handleDeleteAnnotation}
        />

        <div style={{ flex: 1, position: 'relative', background: '#f5f5f5' }}>
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                background: 'rgba(255,255,255,0.85)',
              }}
            >
              <Spin tip={t('common.loading')} size="large" />
            </div>
          )}
          {!loading && !bridgeReady && !bridgeError && srcDoc && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 2,
              }}
            >
              <Spin size="small" tip={t('review.bridgeLoading')} />
            </div>
          )}
          {srcDoc && (
            <iframe
              ref={iframeRef}
              key={`${filePath}:${resolvedVersionOid ?? 'latest'}:${iframeReloadKey}`}
              title={t('review.iframeTitle')}
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
