// FR-SRCH-08 — pure image-search helpers for the mobile review screen.
// Deliberately free of React Native imports so the geometry, cart mapping and
// correction payload can be tested with node:test.

import type { CartLine } from './cart';
import type { SearchHit } from './queries';

export type PixelBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MobileImageRegion = {
  region: {
    text: string;
    label: string;
    ocrText: string;
    bbox: PixelBox;
    confidence: number;
    category: string | null;
  };
  query: string;
  topHits: SearchHit[];
};

export type MobileImageResult = {
  width: number;
  height: number;
  objectCount: number;
  regions: MobileImageRegion[];
  suggestions: string[];
  detectorKind: string;
  modelId: string | null;
  confidenceThreshold: number;
  tookMs: number;
};

export type ConfidenceTone = 'high' | 'medium' | 'low';

export const CORRECTION_REASONS = [
  'mislabeled',
  'wrong_box',
  'missed_item',
  'wrong_match',
  'other',
] as const;

export type CorrectionReason = (typeof CORRECTION_REASONS)[number];

export type MobileCorrectionBody = {
  reason: CorrectionReason;
  correctedLabel?: string;
  detection?: {
    label: string;
    query?: string;
    confidence?: number;
    bbox?: PixelBox;
    productId?: string;
  };
  detectorKind?: string;
  imageWidth?: number;
  imageHeight?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function resolveImageDimensions(
  result: { width: number; height: number },
  fallback: { width: number; height: number }
): { width: number; height: number } {
  if (result.width > 0 && result.height > 0) {
    return { width: result.width, height: result.height };
  }
  return fallback;
}

export function formatConfidence(confidence: number): string {
  if (!Number.isFinite(confidence)) return '—';
  const percent = Math.round(clamp(confidence, 0, 1) * 100);
  if (percent === 0 && confidence > 0) return '<1%';
  return `${percent}%`;
}

export function confidenceTone(confidence: number): ConfidenceTone {
  if (confidence >= 0.5) return 'high';
  if (confidence >= 0.2) return 'medium';
  return 'low';
}

export function regionTitle(region: MobileImageRegion): string {
  return region.region.label || region.region.text || region.region.ocrText;
}

export function isAddableProduct(hit: SearchHit): boolean {
  return (
    hit.kind === 'PRODUCT' &&
    hit.inStock &&
    typeof hit.priceSar === 'number' &&
    hit.priceSar > 0
  );
}

export function primaryProduct(region: MobileImageRegion): SearchHit | null {
  return region.topHits.find(isAddableProduct) ?? null;
}

export function cartInputFromHit(
  hit: SearchHit
): Omit<CartLine, 'id'> | null {
  if (!isAddableProduct(hit)) return null;
  return {
    listingId: hit.refId,
    kind: 'purchase',
    quantity: 1,
    title: hit.title,
    unitPrice: hit.priceSar ?? 0,
    unitLabel: 'unit',
    vendorName: hit.brand || 'ConstructsHub supplier',
  };
}

export function detectorI18nKey(kind: string): string {
  switch (kind) {
    case 'object-detection':
      return 'image.detector_object';
    case 'google-vision':
      return 'image.detector_vision';
    case 'classical-cv':
      return 'image.detector_classical';
    case 'offline':
      return 'image.detector_offline';
    default:
      return 'image.detector_unknown';
  }
}

export function buildCorrectionBody(
  input: MobileCorrectionBody
): MobileCorrectionBody {
  const body: MobileCorrectionBody = { reason: input.reason };
  const corrected = input.correctedLabel?.trim();
  if (corrected) body.correctedLabel = corrected;
  if (input.detection) {
    body.detection = {
      ...input.detection,
      label: input.detection.label.trim(),
      query: input.detection.query?.trim() || undefined,
    };
  }
  if (input.detectorKind) body.detectorKind = input.detectorKind;
  if (input.imageWidth && input.imageWidth > 0) body.imageWidth = input.imageWidth;
  if (input.imageHeight && input.imageHeight > 0) body.imageHeight = input.imageHeight;
  return body;
}
