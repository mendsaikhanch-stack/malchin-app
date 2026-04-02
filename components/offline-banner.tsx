import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{'\uD83D\uDCE1'} Оффлайн горим - Хадгалсан мэдээлэл харуулж байна</Text>
    </View>
  );
}

export function CacheBadge({ fromCache }: { fromCache: boolean }) {
  if (!fromCache) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{'\uD83D\uDCBE'} Хадгалсан</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF8F00',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  badge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 4,
  },
  badgeText: { fontSize: 10, color: '#E65100', fontWeight: '600' },
});
