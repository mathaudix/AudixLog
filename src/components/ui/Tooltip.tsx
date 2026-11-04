import type { ReactNode } from 'react';
export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return <span className="ui-tooltip" data-tooltip={content}>{children}<span role="tooltip" className="ui-tooltip-content">{content}</span></span>;
}
