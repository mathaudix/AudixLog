import { useState } from 'react';
import { Button } from '../ui/Button';
import {
  DEFAULT_CALIBRATION,
  OFFSET_RANGE_MM,
  OFFSET_STEP_MM,
  loadCalibration,
  normalizeCalibration,
  resetCalibration,
  saveCalibration,
  type DualCalibration,
  type PrintCalibration,
} from '../../utils/printCalibration';
import { openCalibrationTest } from '../../utils/calibrationTest';

type OffsetFormat = keyof PrintCalibration['offsets'];
const OFFSET_FORMATS: { key: OffsetFormat; label: string }[] = [
  { key: '100x30 (2Col)', label: '100x30 (2 colunas)' },
  { key: '100x50', label: '100x50' },
  { key: '150x100', label: '150x100' },
  { key: '100x150', label: '100x150' },
];
const DUAL_FIELDS: { key: keyof DualCalibration; label: string }[] = [
  { key: 'pageWidth', label: 'Largura da página (mm)' },
  { key: 'pageHeight', label: 'Altura da página (mm)' },
  { key: 'leftMargin', label: 'Margem esquerda (mm)' },
  { key: 'columnWidth', label: 'Largura de cada etiqueta (mm)' },
  { key: 'columnGap', label: 'Vão entre as colunas (mm)' },
];

export function PrintCalibrationSection(): JSX.Element {
  const [cal, setCal] = useState<PrintCalibration>(() => loadCalibration());

  const update = (next: PrintCalibration) => {
    const clean = normalizeCalibration(next);
    setCal(clean);
    saveCalibration(clean);
  };
  const setDual = (key: keyof DualCalibration, value: number) => update({ ...cal, dual: { ...cal.dual, [key]: value } });
  const setOffset = (format: OffsetFormat, axis: 'x' | 'y', value: number) =>
    update({ ...cal, offsets: { ...cal.offsets, [format]: { ...cal.offsets[format], [axis]: value } } });

  return (
    <section className="cfg-card">
      <h3 className="cfg-card-title">Calibração de impressão</h3>
      <p className="cfg-card-desc">Ajuste somente se a impressão sair cortada ou deslocada. Os valores valem apenas neste computador.</p>

      <h4 className="cfg-sub">100x30 (2 colunas)</h4>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DUAL_FIELDS.map(field => (
          <label key={field.key} className="ui-field">
            <span className="ui-field-label">{field.label}</span>
            <input type="number" step={0.5} className="ui-input" value={cal.dual[field.key]}
              onChange={e => setDual(field.key, Number(e.target.value))} />
          </label>
        ))}
      </div>

      <h4 className="cfg-sub">Ajuste fino por formato (mm)</h4>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OFFSET_FORMATS.map(item => (
          <div key={item.key} className="flex items-center gap-2 text-[13px]">
            <span className="w-32 font-medium">{item.label}</span>
            <label className="flex items-center gap-1">X <input type="number" aria-label={`${item.label} X`} min={-OFFSET_RANGE_MM} max={OFFSET_RANGE_MM} step={OFFSET_STEP_MM} className="ui-input ui-input-sm w-20"
              value={cal.offsets[item.key].x} onChange={e => setOffset(item.key, 'x', Number(e.target.value))} /></label>
            <label className="flex items-center gap-1">Y <input type="number" aria-label={`${item.label} Y`} min={-OFFSET_RANGE_MM} max={OFFSET_RANGE_MM} step={OFFSET_STEP_MM} className="ui-input ui-input-sm w-20"
              value={cal.offsets[item.key].y} onChange={e => setOffset(item.key, 'y', Number(e.target.value))} /></label>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => openCalibrationTest(cal)}>Imprimir teste de calibração</Button>
        <Button type="button" onClick={() => setCal(resetCalibration())}>Restaurar padrão</Button>
      </div>
      <p className="cfg-card-desc mt-2">Padrão: {DEFAULT_CALIBRATION.dual.pageWidth} × {DEFAULT_CALIBRATION.dual.pageHeight} mm, margem {DEFAULT_CALIBRATION.dual.leftMargin} mm, etiqueta {DEFAULT_CALIBRATION.dual.columnWidth} mm, vão {DEFAULT_CALIBRATION.dual.columnGap} mm.</p>
    </section>
  );
}
