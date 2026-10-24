import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCorrectionBody,
  cartInputFromHit,
  confidenceTone,
  detectorI18nKey,
  formatConfidence,
  isAddableProduct,
  primaryProduct,
  regionTitle,
  resolveImageDimensions,
  type MobileImageRegion,
} from '../lib/image-search';
import type { SearchHit } from '../lib/queries';

const product: SearchHit = {
  id: 'p1',
  kind: 'PRODUCT',
  refId: 'prod-1',
  title: 'Steel rebar 16 mm',
  body: null,
  brand: 'Riyadh Steel',
  category: 'Structural materials',
  city: 'Riyadh',
  priceSar: 42.5,
  rating: 4.6,
  verified: true,
  inStock: true,
  isSponsored: false,
  score: 0.9,
};

const region: MobileImageRegion = {
  region: {
    text: 'Steel rebar',
    label: 'Steel rebar',
    ocrText: '16 mm',
    bbox: { x: 100, y: 50, width: 200, height: 100 },
    confidence: 0.82,
    category: 'Structural',
  },
  query: 'steel rebar 16 mm',
  topHits: [product],
};

test('confidence formatting and tone are deterministic', () => {
  assert.equal(formatConfidence(0.82), '82%');
  assert.equal(formatConfidence(0.004), '<1%');
  assert.equal(formatConfidence(Number.NaN), '—');
  assert.equal(confidenceTone(0.9), 'high');
  assert.equal(confidenceTone(0.3), 'medium');
  assert.equal(confidenceTone(0.1), 'low');
});

test('server image dimensions win over local asset dimensions', () => {
  assert.deepEqual(
    resolveImageDimensions({ width: 1200, height: 900 }, { width: 300, height: 200 }),
    { width: 1200, height: 900 }
  );
  assert.deepEqual(
    resolveImageDimensions({ width: 0, height: 0 }, { width: 300, height: 200 }),
    { width: 300, height: 200 }
  );
});

test('detector kinds map to translation keys', () => {
  assert.equal(detectorI18nKey('object-detection'), 'image.detector_object');
  assert.equal(detectorI18nKey('google-vision'), 'image.detector_vision');
  assert.equal(detectorI18nKey('classical-cv'), 'image.detector_classical');
  assert.equal(detectorI18nKey('offline'), 'image.detector_offline');
  assert.equal(detectorI18nKey('mystery'), 'image.detector_unknown');
});

test('region titles fall back from label to text to OCR', () => {
  assert.equal(regionTitle(region), 'Steel rebar');
  assert.equal(regionTitle({ ...region, region: { ...region.region, label: '' } }), 'Steel rebar');
  assert.equal(
    regionTitle({ ...region, region: { ...region.region, label: '', text: '' } }),
    '16 mm'
  );
});

test('only purchasable products can be added to the cart', () => {
  assert.equal(isAddableProduct(product), true);
  assert.equal(isAddableProduct({ ...product, kind: 'SUPPLIER' }), false);
  assert.equal(isAddableProduct({ ...product, inStock: false }), false);
  assert.equal(isAddableProduct({ ...product, priceSar: null }), false);
  assert.equal(isAddableProduct({ ...product, priceSar: 0 }), false);
  assert.equal(primaryProduct(region)?.refId, 'prod-1');
});

test('cart mapping mirrors the mobile cart line shape', () => {
  assert.deepEqual(cartInputFromHit(product), {
    listingId: 'prod-1',
    kind: 'purchase',
    quantity: 1,
    title: 'Steel rebar 16 mm',
    unitPrice: 42.5,
    unitLabel: 'unit',
    vendorName: 'Riyadh Steel',
  });
  assert.equal(cartInputFromHit({ ...product, kind: 'WORKER' }), null);
});

test('correction payload only sends the label and box, never the image', () => {
  assert.deepEqual(
    buildCorrectionBody({
      reason: 'wrong_match',
      correctedLabel: '  Steel rebar 20 mm  ',
      detection: {
        label: '  Steel rebar ',
        query: '  rebar ',
        confidence: 0.4,
        bbox: { x: 1, y: 2, width: 3, height: 4 },
        productId: 'prod-1',
      },
      detectorKind: 'object-detection',
      imageWidth: 1000,
      imageHeight: 500,
    }),
    {
      reason: 'wrong_match',
      correctedLabel: 'Steel rebar 20 mm',
      detection: {
        label: 'Steel rebar',
        query: 'rebar',
        confidence: 0.4,
        bbox: { x: 1, y: 2, width: 3, height: 4 },
        productId: 'prod-1',
      },
      detectorKind: 'object-detection',
      imageWidth: 1000,
      imageHeight: 500,
    }
  );

  assert.deepEqual(
    buildCorrectionBody({ reason: 'missed_item', correctedLabel: 'PVC elbow' }),
    { reason: 'missed_item', correctedLabel: 'PVC elbow' }
  );
});
