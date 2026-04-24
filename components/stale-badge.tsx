import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  getStaleState,
  staleTint,
  type CacheMeta,
} from '@/services/cache-state';

export type StaleBadgeProps = CacheMeta & {
  compact?: boolean; // зөвхөн icon + богино label
};

export function StaleBadge({
  fromCache,
  offline,
  expired,
  compact,
}: StaleBadgeProps) {
  const state = getStaleState({ fromCache, offline, expired });
  if (!state.show) return null;

  const color = staleTint(state.tone);

  return (
    <View
      style={[
        styles.container,
        { borderColor: color },
        compact && styles.compact,
      ]}
      accessibilityLabel={`${state.label} мэдээлэл`}
    >
      <Text style={[styles.icon, { color }]}>{state.icon}</Text>
      <Text style={[styles.label, { color }]}>{state.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  icon: {
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
