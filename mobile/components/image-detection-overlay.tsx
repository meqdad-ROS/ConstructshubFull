// FR-SRCH-12 — per-frame bounding-box overlay for image search results.
//
// Renders the uploaded image at its displayed size, lays absolute-positioned
// coloured boxes over each detector region, and shows the label + confidence.
// Tapping a box commits that region's search query to the parent so the
// marketplace results update.
//
// No new deps — just RN primitives (`Image`, `View`, `Pressable`). Uses
// `Image.getSize` to compute the aspect-ratio-correct render size so the
// server-returned pixel bboxes scale correctly to screen coordinates.

import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

export type DetectionRegion = {
  region: {
    text: string;
    label?: string;
    ocrText?: string;
    bbox: { x: number; y: number; width: number; height: number };
    confidence: number;
    category?: string | null;
  };
  query: string;
};

export type ImageDetectionOverlayProps = {
  imageUri: string;
  // Dimensions as reported by the server (pixel space the bboxes live in).
  imageWidth: number;
  imageHeight: number;
  regions: DetectionRegion[];
  // Which region to highlight (its query match in the parent list).
  selectedIndex?: number | null;
  onSelect?: (index: number, region: DetectionRegion) => void;
};

// A short, high-contrast palette the user can tell apart on a cream UI. The
// index wraps so a crowded image stays readable.
const BOX_COLORS = ['#D43D3D', '#2E6AD1', '#2E8B57', '#C96B20', '#7A3DA7', '#1F7F8F'];

export function ImageDetectionOverlay({
  imageUri,
  imageWidth,
  imageHeight,
  regions,
  selectedIndex = null,
  onSelect,
}: ImageDetectionOverlayProps) {
  // Keep the server's aspect ratio even when the server didn't ship dims
  // (defensively fall back to a square so we never render NaN).
  const aspect = imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1;
  const [renderWidth, setRenderWidth] = useState(0);
  const renderHeight = renderWidth / aspect;
  const scale = imageWidth > 0 ? renderWidth / imageWidth : 0;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - renderWidth) > 1) setRenderWidth(w);
  };

  // Pre-scale once — avoids running six multiplications per frame per box.
  const scaledBoxes = useMemo(
    () =>
      regions.map((r) => ({
        left: r.region.bbox.x * scale,
        top: r.region.bbox.y * scale,
        width: Math.max(2, r.region.bbox.width * scale),
        height: Math.max(2, r.region.bbox.height * scale),
      })),
    [regions, scale],
  );

  return (
    <View style={styles.wrapper} onLayout={onLayout} accessibilityRole="image">
      {renderWidth > 0 ? (
        <View style={{ width: renderWidth, height: renderHeight }}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: renderWidth, height: renderHeight, borderRadius: radius.md }}
            accessibilityLabel="search source"
            resizeMode="contain"
          />
          {scale > 0 &&
            regions.map((r, i) => {
              const box = scaledBoxes[i]!;
              const color = BOX_COLORS[i % BOX_COLORS.length]!;
              const selected = selectedIndex === i;
              const confPct = Math.round(r.region.confidence * 100);
              return (
                <Pressable
                  key={`box-${i}`}
                  onPress={() => onSelect?.(i, r)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.region.text} ${confPct}%`}
                  style={[
                    styles.box,
                    {
                      left: box.left,
                      top: box.top,
                      width: box.width,
                      height: box.height,
                      borderColor: color,
                      borderWidth: selected ? 3 : 2,
                    },
                  ]}
                >
                  <View style={[styles.labelPill, { backgroundColor: color }]}>
                    <Text style={styles.labelText} numberOfLines={1}>
                      {r.region.text} · {confPct}%
                    </Text>
                  </View>
                </Pressable>
              );
            })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  box: {
    position: 'absolute',
    borderStyle: 'solid',
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
  },
  labelPill: {
    position: 'absolute',
    top: -1,
    left: -1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderTopLeftRadius: radius.sm,
    maxWidth: '100%',
  },
  labelText: {
    color: colors.paper ?? '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
