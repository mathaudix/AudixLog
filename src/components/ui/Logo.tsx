import { forwardRef, type SVGProps, useId } from 'react';

/**
 * Logo Monograma "AL" — AudixLog
 * Variantes: horizontal | vertical | icon
 * Tamanhos: sm (24px) | md (32px) | lg (40px) | xl (48px) | custom (number)
 */
export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  variant?: 'horizontal' | 'vertical' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  animated?: boolean;
  className?: string;
}

const ANIMATION_STYLES = `@keyframes logoFadeIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes logoSlideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}`;

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
} as const;

function getSize(val: LogoProps['size']): number {
  if (typeof val === 'number') return val;
  return sizeMap[val ?? 'md'];
}

export const Logo = forwardRef<SVGSVGElement, LogoProps>(
  ({ variant = 'horizontal', size = 'md', animated = false, className = '', style, ...props }, ref) => {
    const px = getSize(size);
    const isIcon = variant === 'icon';
    const isVertical = variant === 'vertical';

    // Unique IDs for gradients to avoid conflicts
    const gradId = useId();
    const logoGradId = `logoGrad-${gradId}`;
    const textGradId = `textGrad-${gradId}`;

    const containerStyle: React.CSSProperties = {
      width: isIcon ? px : isVertical ? px * 1.6 : px * 2.8,
      height: isIcon ? px : isVertical ? px * 1.4 : px,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: isVertical ? 'center' : 'flex-start',
      gap: isVertical ? px * 0.15 : px * 0.18,
      flexDirection: isVertical ? 'column' : 'row',
      ...style,
    };

    const markSize = isIcon ? px : isVertical ? px : px;
    const textSize = isVertical ? px * 0.9 : px;

    return (
      <svg
        ref={ref}
        viewBox={isIcon ? '0 0 64 64' : isVertical ? '0 0 64 100' : '0 0 180 64'}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        className={className}
        style={containerStyle}
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        <defs>
          {/* Logo gradient */}
          <linearGradient id={logoGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2A3F38" />
            <stop offset="100%" stop-color="#562F54" />
          </linearGradient>

          {/* Wordmark gradient */}
          {!isIcon && (
            <linearGradient id={textGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#1A1A1A" />
              <stop offset="100%" stop-color="#71717A" />
            </linearGradient>
          )}

          {/* Animation styles */}
          {animated && (
            <style>{`${ANIMATION_STYLES}
              svg > g:first-child { animation: logoFadeIn 0.5s var(--transition-base) both; }
              svg > svg:last-child { animation: logoSlideIn 0.4s var(--transition-base) 0.1s both; }
            `}</style>
          )}
        </defs>

        {/* Mark / Monograma */}
        <g transform={isVertical ? `translate(0, ${isIcon ? 0 : 4})` : `translate(0, 0)`}>
          <svg viewBox="0 0 64 64" width={`${markSize}`} height={`${markSize}`}>
            <rect width="100%" height="100%" rx="0.22" fill={`url(#${logoGradId})`} />
            <text
              x="50%"
              y="54%"
              dominant-baseline="middle"
              text-anchor="middle"
              font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              font-weight="700"
              font-size="0.44"
              fill="white"
              letter-spacing="-0.02em"
            >
              AL
            </text>
          </svg>
        </g>

        {/* Wordmark */}
        {!isIcon && (
          <svg viewBox="0 0 116 64" width={`${textSize}`} height={`${textSize}`}>
            <text
              x="0"
              y="52%"
              dominant-baseline="middle"
              font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              font-weight="600"
              font-size="22"
              fill={`url(#${textGradId})`}
              letter-spacing="-0.015em"
            >
              AudixLog
            </text>
          </svg>
        )}
      </svg>
    );
  }
);

Logo.displayName = 'Logo';

/* Sub-componentes de conveniência */
export const LogoHorizontal = forwardRef<SVGSVGElement, Omit<LogoProps, 'variant'>>(
  (props, ref) => <Logo ref={ref} variant="horizontal" {...props} />
);
LogoHorizontal.displayName = 'LogoHorizontal';

export const LogoVertical = forwardRef<SVGSVGElement, Omit<LogoProps, 'variant'>>(
  (props, ref) => <Logo ref={ref} variant="vertical" {...props} />
);
LogoVertical.displayName = 'LogoVertical';

export const LogoIcon = forwardRef<SVGSVGElement, Omit<LogoProps, 'variant'>>(
  (props, ref) => <Logo ref={ref} variant="icon" {...props} />
);
LogoIcon.displayName = 'LogoIcon';

/* Helper para favicon / apple-touch-icon */
export function generateFaviconSvg(size: number = 64): string {
  const s = size / 64;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2A3F38"/>
      <stop offset="100%" stop-color="#562F54"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#logoGrad)"/>
  <text x="32" y="36" dominant-baseline="middle" text-anchor="middle"
        font-family="Inter, -apple-system, sans-serif" font-weight="700"
        font-size="${28 * s}" fill="white" letter-spacing="-0.02em">AL</text>
</svg>`;
}