import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { AppColors } from '@/constants/theme';
import { adsApi } from '@/services/api';

type Props = {
  placement: string;
  style?: any;
};

const catEmojis: Record<string, string> = {
  cashmere: '\uD83E\uDDF6', loan: '\uD83C\uDFE6', wool: '\uD83D\uDC11', vet: '\uD83E\uDE7A',
  government: '\uD83C\uDFDB\uFE0F', feed: '\uD83C\uDF3E', insurance: '\uD83D\uDEE1\uFE0F',
  event: '\uD83C\uDFC7', savings: '\uD83D\uDCB0', export: '\uD83C\uDF0D', general: '\uD83D\uDCE2',
};

export function AdBanner({ placement, style }: Props) {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    adsApi.get(placement, 1).then(ads => {
      if (ads && ads.length > 0) setAd(ads[0]);
    }).catch(() => {});
  }, [placement]);

  if (!ad) return null;

  const handlePress = async () => {
    try {
      await adsApi.click(ad.id);
      if (ad.link_url) Linking.openURL(ad.link_url);
    } catch {}
  };

  const emoji = catEmojis[ad.category] || '\uD83D\uDCE2';

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>AD</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{ad.title}</Text>
          <Text style={styles.description} numberOfLines={1}>{ad.description}</Text>
          <Text style={styles.advertiser}>{ad.advertiser}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function AdBannerLarge({ placement, style }: Props) {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    adsApi.get(placement, 1).then(ads => {
      if (ads && ads.length > 0) setAd(ads[0]);
    }).catch(() => {});
  }, [placement]);

  if (!ad) return null;

  const handlePress = async () => {
    try {
      await adsApi.click(ad.id);
      if (ad.link_url) Linking.openURL(ad.link_url);
    } catch {}
  };

  const emoji = catEmojis[ad.category] || '\uD83D\uDCE2';

  return (
    <TouchableOpacity style={[styles.largeContainer, style]} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>Сурталчилгаа</Text>
      </View>
      <Text style={styles.largeEmoji}>{emoji}</Text>
      <Text style={styles.largeTitle}>{ad.title}</Text>
      <Text style={styles.largeDesc}>{ad.description}</Text>
      <View style={styles.ctaBtn}>
        <Text style={styles.ctaBtnText}>Дэлгэрэнгүй {'\u27A4'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Small banner
  container: {
    marginHorizontal: 16, marginTop: 10, backgroundColor: '#FFFDE7',
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FFF9C4',
  },
  adLabel: { position: 'absolute', top: 6, right: 8, backgroundColor: '#FFD54F', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  adLabelText: { fontSize: 8, fontWeight: '800', color: '#F57F17' },
  content: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: 10 },
  textContainer: { flex: 1, paddingRight: 20 },
  title: { fontSize: 13, fontWeight: '700', color: AppColors.black },
  description: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  advertiser: { fontSize: 10, color: AppColors.gray, marginTop: 2 },
  // Large banner
  largeContainer: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#E8F5E9',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#C8E6C9', alignItems: 'center',
  },
  largeEmoji: { fontSize: 36, marginTop: 4 },
  largeTitle: { fontSize: 16, fontWeight: '800', color: AppColors.primaryDark, textAlign: 'center', marginTop: 8 },
  largeDesc: { fontSize: 13, color: AppColors.grayDark, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  ctaBtn: { marginTop: 10, backgroundColor: AppColors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  ctaBtnText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
});
