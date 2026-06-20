import { useEffect, useMemo, useState } from 'react';
import { Tour, type TourProps } from 'antd';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_PREFIX = 'onboarding.completed.';

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function OnboardingTourHost() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const markCompleted = () => {
    if (user?.id) {
      localStorage.setItem(getStorageKey(user.id), 'true');
    }
    setOpen(false);
  };

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('aidoc-hub:start-tour', handler);
    return () => window.removeEventListener('aidoc-hub:start-tour', handler);
  }, []);

  useEffect(() => {
    const state = location.state as { showOnboarding?: boolean } | null;
    if (!user?.id) return;
    const completed = localStorage.getItem(getStorageKey(user.id)) === 'true';
    if (state?.showOnboarding || !completed) {
      const timer = window.setTimeout(() => setOpen(true), 500);
      return () => window.clearTimeout(timer);
    }
  }, [user?.id, location.state]);

  const steps: TourProps['steps'] = useMemo(
    () => [
      {
        title: t('tour.workspaceTitle'),
        description: t('tour.workspaceDesc'),
        target: () => document.querySelector('[data-tour="nav-workspaces"]') as HTMLElement,
      },
      {
        title: t('tour.searchTitle'),
        description: t('tour.searchDesc'),
        target: () => document.querySelector('[data-tour="global-search"]') as HTMLElement,
      },
      {
        title: t('tour.tokenTitle'),
        description: t('tour.tokenDesc'),
        target: () => document.querySelector('[data-tour="nav-tokens"]') as HTMLElement,
      },
      {
        title: t('tour.mcpTitle'),
        description: t('tour.mcpDesc'),
        target: () => document.querySelector('[data-tour="nav-mcp"]') as HTMLElement,
      },
      {
        title: t('tour.helpTitle'),
        description: t('tour.helpDesc'),
        target: () => document.querySelector('[data-tour="help-button"]') as HTMLElement,
      },
    ],
    [t],
  );

  return (
    <Tour
      open={open}
      onClose={() => setOpen(false)}
      onFinish={markCompleted}
      steps={steps}
    />
  );
}
