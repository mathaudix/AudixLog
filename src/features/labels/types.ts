export type LabelFormat = '100x150' | '150x100' | '100x50' | '100x30 (2Col)';
export type IconType = 'box' | 'truck' | 'fragile' | 'up' | 'umbrella' | 'thermometer' | 'recycle' | 'pallet' | 'warning' | 'forklift' | 'filial' | 'cidade' | 'perecivel' | 'flammable' | 'glass' | 'heavy' | 'fragile' | 'this-side-up' | 'keep-dry' | 'protect-heat' | 'stack-limit' | 'do-not-stack' | 'center-gravity' | 'no-hooks' | 'do-not-roll' | 'forklift-here' | 'tie-down' | 'temperature-limit' | 'truck-box' | 'truck-trailer' | 'van' | 'forklift' | 'pallet-boxes' | 'closed-box' | 'open-box' | 'containers' | 'warehouse' | 'loading-dock' | 'barcode-scanner' | 'checklist' | 'invoice' | 'route-pin' | 'deadline' | 'scale' | 'return-box' | 'delivered'
interface ElementBase { id: string; x: number; y: number; zIndex: number; hidden?: boolean; locked?: boolean; rotation?: number; groupId?: string }
export interface TextElement extends ElementBase { type: 'text'; text: string; fontSize: number; fill: string; fontFamily: string; fontWeight: 'normal' | 'bold'; fontStyle: 'normal' | 'italic'; textDecoration: 'none' | 'underline'; textAlign: 'left' | 'center' | 'right'; bgColor: string; width?: number; height?: number }
export interface BarcodeElement extends ElementBase { type: 'barcode'; value: string; width: number; height: number }
export interface RectElement extends ElementBase { type: 'rect'; width: number; height: number; fill: string; stroke: string; strokeWidth: number }
export interface CircleElement extends ElementBase { type: 'circle'; width: number; height: number; fill: string; stroke: string; strokeWidth: number }
export interface TriangleElement extends ElementBase { type: 'triangle'; width: number; height: number; fill: string; stroke: string; strokeWidth: number }
export interface HexagonElement extends ElementBase { type: 'hexagon'; width: number; height: number; fill: string; stroke: string; strokeWidth: number }
export interface StarElement extends ElementBase { type: 'star'; width: number; height: number; fill: string; stroke: string; strokeWidth: number }
export type ShapeElement = RectElement | CircleElement | TriangleElement | HexagonElement | StarElement;
export interface LineElement extends ElementBase { type: 'line'; width: number; height: number; fill: string; rotation: number }
export interface IconElement extends ElementBase { type: 'icon'; iconType: IconType; size: number; fill: string }
export type CanvasElement = TextElement | BarcodeElement | ShapeElement | LineElement | IconElement;
export type NewCanvasElement = CanvasElement extends infer Element ? Element extends CanvasElement ? Omit<Element, 'id' | 'zIndex'> : never : never;
export type CanvasElementPatch = CanvasElement extends infer Element ? Element extends CanvasElement ? Partial<Element> : never : never;
export interface LabelData { formato: LabelFormat; elements: CanvasElement[] }
export interface SavedLabel { id: string; name: string; labelData: LabelData; createdAt?: unknown; createdBy?: string }
export interface LabelNfContext { numero: string; fornecedor: string; filial?: string; chaveAcesso?: string; volumes: number; peso: number; valor: number }
