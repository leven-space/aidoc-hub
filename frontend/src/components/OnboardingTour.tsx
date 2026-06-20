import { useEffect, useMemo, useState } from 'react';
import { Tour, type TourProps } from 'antd';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_PREFIX = 'onboarding.completed.';

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function OnboardingTourHost() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

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
        title: '工作空间',
        description: '在这里创建和管理工作空间，每个空间可包含多个 HTML 资产仓库。',
        target: () => document.querySelector('[data-tour="nav-workspaces"]') as HTMLElement,
      },
      {
        title: '全局搜索',
        description: '快速搜索工作空间、仓库和文件，跨空间定位内容。',
        target: () => document.querySelector('[data-tour="global-search"]') as HTMLElement,
      },
      {
        title: 'Token 管理',
        description: '创建 Personal Access Token，用于 API 与 MCP 接入鉴权。',
        target: () => document.querySelector('[data-tour="nav-tokens"]') as HTMLElement,
      },
      {
        title: 'MCP 接入',
        description: '获取自动生成的配置与 Prompt，发给 Cursor / Claude Code / Codex 即可快速接入。',
        target: () => document.querySelector('[data-tour="nav-mcp"]') as HTMLElement,
      },
      {
        title: '新手引导',
        description: '随时点击此按钮重新查看功能引导。',
        target: () => document.querySelector('[data-tour="help-button"]') as HTMLElement,
      },
    ],
    [],
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
