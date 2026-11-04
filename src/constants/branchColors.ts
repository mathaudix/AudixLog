import { stableBranchColor } from '../components/stats/branchChartData';

export function branchHex(code: string): string {
  return stableBranchColor(code.trim().toUpperCase());
}
