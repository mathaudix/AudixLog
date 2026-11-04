import type { ComponentProps } from 'react';
import { ElementProperties } from './ElementProperties';

export function PropertiesPanel(props: ComponentProps<typeof ElementProperties>) {
  return <ElementProperties {...props} />;
}
