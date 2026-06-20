import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { setupApi } from '../services';

export function SetupGuard({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    setInitialized(null);
    setupApi
      .status()
      .then((res) => {
        if (!cancelled) setInitialized(res.initialized);
      })
      .catch(() => {
        if (!cancelled) setInitialized(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (initialized === null) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!initialized && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  if (initialized && location.pathname === '/setup') {
    const hasToken = !!localStorage.getItem('accessToken');
    return <Navigate to={hasToken ? '/' : '/login'} replace />;
  }

  return children;
}
