import { useEffect, useMemo, useState } from 'react';
import { Tour, type TourProps } from 'antd';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { START_TOUR_EVENT, TOURS, type TourDef } from '../content/tours';

const STORAGE_PREFIX = 'tour.completed.';

function getStorageKey(userId: string, tourStorageKey: string) {
  return `${STORAGE_PREFIX}${tourStorageKey}.${userId}`;
}

function buildSteps(def: TourDef, t: (key: string) => string): TourProps['steps'] {
  return def.steps.map((step) => ({
    title: t(step.titleKey),
    description: t(step.descriptionKey),
    placement: step.placement,
    target: () => document.querySelector(step.targetSelector) as HTMLElement,
  }));
}

export function OnboardingTourHost() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [activeTourId, setActiveTourId] = useState('onboarding');
  const { t } = useTranslation();

  const activeDef = TOURS[activeTourId] ?? TOURS.onboarding;

  const markCompleted = () => {
    if (user?.id && activeDef.storageKey) {
      localStorage.setItem(getStorageKey(user.id, activeDef.storageKey), 'true');
    }
    setOpen(false);
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ tourId?: string }>).detail;
      const tourId = detail?.tourId ?? 'onboarding';
      const def = TOURS[tourId];
      if (!def) return;

      if (def.routePattern && !def.routePattern.test(location.pathname)) {
        return;
      }

      setActiveTourId(tourId);
      setOpen(true);
    };
    window.addEventListener(START_TOUR_EVENT, handler);
    return () => window.removeEventListener(START_TOUR_EVENT, handler);
  }, [location.pathname]);

  useEffect(() => {
    const state = location.state as { showOnboarding?: boolean } | null;
    if (!user?.id) return;
    const completed =
      localStorage.getItem(getStorageKey(user.id, 'onboarding')) === 'true' ||
      localStorage.getItem(`onboarding.completed.${user.id}`) === 'true';
    if (state?.showOnboarding || !completed) {
      const timer = window.setTimeout(() => {
        setActiveTourId('onboarding');
        setOpen(true);
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [user?.id, location.state]);

  const steps = useMemo(() => buildSteps(activeDef, t), [activeDef, t]);

  return (
    <Tour
      open={open}
      onClose={() => setOpen(false)}
      onFinish={markCompleted}
      steps={steps}
    />
  );
}
