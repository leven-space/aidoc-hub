import { useId } from 'react';
import { brandGradient } from '../theme/brand';

type AppLogoProps = {
  size?: number;
  showText?: boolean;
  text?: string;
  textSize?: number;
};

export function AppLogo({ size = 32, showText = false, text, textSize = 18 }: AppLogoProps) {
  const uid = useId().replace(/:/g, '');
  const gradMain = `grad-main-${uid}`;
  const gradGlow = `grad-glow-${uid}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: showText ? 10 : 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradMain} x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <linearGradient id={gradGlow} x1="30" y1="20" x2="110" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="132" height="132" rx="32" fill="#0f172a" stroke={`url(#${gradMain})`} strokeWidth="2" />
        <rect x="4" y="4" width="132" height="132" rx="32" fill={`url(#${gradGlow})`} />
        <path
          d="M44 28h36l20 20v64a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8V36a8 8 0 0 1 8-8z"
          fill="none"
          stroke={`url(#${gradMain})`}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M80 28v16a4 4 0 0 0 4 4h16"
          fill="none"
          stroke={`url(#${gradMain})`}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="70" cy="78" r="8" fill={`url(#${gradMain})`} opacity="0.9" />
        <circle cx="70" cy="78" r="4" fill="#0f172a" />
        <circle cx="70" cy="78" r="2.5" fill="#38bdf8" />
        <circle cx="70" cy="56" r="4" fill="#818cf8" opacity="0.8" />
        <line x1="70" y1="60" x2="70" y2="70" stroke="#818cf8" strokeWidth="1.5" opacity="0.6" />
        <circle cx="52" cy="96" r="4" fill="#c084fc" opacity="0.8" />
        <line x1="55" y1="93.5" x2="64" y2="83" stroke="#c084fc" strokeWidth="1.5" opacity="0.6" />
        <circle cx="88" cy="96" r="4" fill="#38bdf8" opacity="0.8" />
        <line x1="85" y1="93.5" x2="76" y2="83" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
      </svg>
      {showText && text ? (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 700,
            letterSpacing: -0.3,
            lineHeight: 1.2,
            background: brandGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
      ) : null}
    </div>
  );
}
