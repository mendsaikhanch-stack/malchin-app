import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SCREEN_ART, type ScreenTopic } from '@/constants/screen-art';

// Дэлгэц бүрийн бүдэг, сэдэвт холбоотой дэвсгэр.
//
// Текстийн харагдацанд нөлөөлөхгүйгээр (opacity маш бага) сэдвийн томоохон
// watermark icon + зөөлөн өнгөт gradient харуулна. Offline-first — зураг
// bundle хийхгүй, вектор тул хэмжээ ач холбогдолгүй.
//
// Хэрэглээ (хамгийн энгийн — SafeAreaView-ийн ЭХНИЙ хүүхэд болгон оруул):
//   <SafeAreaView style={styles.container}>
//     <ScreenBackdrop topic="weather" />
//     <ScrollView>...</ScrollView>
//   </SafeAreaView>
//
// `pointerEvents="none"` тул scroll/touch-д огт нөлөөлөхгүй, доор нь хэвтэнэ.

function Art({ topic }: { topic: ScreenTopic }) {
  const art = SCREEN_ART[topic];
  return (
    <>
      {/* Зөөлөн өнгөт gradient — дээрээс доош бүдгэрнэ */}
      <LinearGradient
        colors={[art.tintTop, 'rgba(0,0,0,0)']}
        style={styles.gradient}
        pointerEvents="none"
      />
      {/* Том бүдэг watermark icon — баруун доод буланд, хэсэгчлэн гарсан */}
      <MaterialCommunityIcons
        name={art.icon}
        size={300}
        color={art.tintIcon}
        style={styles.watermark}
        pointerEvents="none"
      />
    </>
  );
}

// Absolute-fill дэвсгэр — SafeAreaView дотор эхний хүүхэд болгон оруулна.
export function ScreenBackdrop({ topic }: { topic: ScreenTopic }) {
  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Art topic={topic} />
    </View>
  );
}

// Wrapper хувилбар — контентыг ороож, ард нь дэвсгэр зурна (хэрэгцээтэй үед).
export function ScreenBackground({
  topic,
  children,
  style,
}: {
  topic: ScreenTopic;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.root, style]}>
      <Art topic={topic} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  backdrop: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  watermark: {
    position: 'absolute',
    bottom: -40,
    right: -50,
  },
});
