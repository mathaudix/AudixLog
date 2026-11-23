import type { AppConfig } from '../types';
const DEFAULT_TEAM_MEMBERS = ['Antonio', 'Coleta', 'Diego', 'Fernando', 'Francisco', 'Jean', 'João', 'Matheus'];
const DEFAULT_BRANCH_MAP: Record<string, string> = {
  '03790896000148': 'L1', '03790896000229': 'L2', '03790896000300': 'L3', '03790896000490': 'L4',
  '03790896000571': 'L5', '03790896000652': 'L6', '13338773000205': 'L56', '13338773000396': 'L59',
  '03790896001039': 'L10', '03790896001110': 'L11', '13338773000124': 'ATC',
};
const DEFAULT_STALE_HOURS = 24;
export const DEFAULT_CONFIG: AppConfig = { teamMembers: DEFAULT_TEAM_MEMBERS, branchMap: DEFAULT_BRANCH_MAP, staleHours: DEFAULT_STALE_HOURS, weightTolerancePct: 2, volumeTolerance: 0 };
export const ITEMS_PER_PAGE = 20;
export const STORAGE_KEYS = {
  theme: 'audixlog_theme', sidebarCollapsed: 'audixlog_sidebar_collapsed', nfeFormat: 'audixlog_nfe_format',
  nfeFontAdjust: 'audixlog_nfe_font_adjust', labelFormat: 'audixlog_avulsa_format', labelQuantity: 'audixlog_avulsa_qty',
} as const;
