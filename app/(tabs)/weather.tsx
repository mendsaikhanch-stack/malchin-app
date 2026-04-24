import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '@/constants/theme';
import { weatherApi } from '@/services/api';
import { getAimagList, getSumsByAimag } from '@/services/mongolia-geo';
import {
  parseOnboardingSnapshot,
  toUserFallback,
} from '@/services/onboarding-fallback';

const ONBOARDING_DATA_KEY = '@malchin_onboarding_data';
const aimags = getAimagList();

export default function WeatherScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userAimag, setUserAimag] = useState<string | null>(null);
  const [userSum, setUserSum] = useState<string | null>(null);
  const [selectedAimag, setSelectedAimag] = useState('Төв');
  const [selectedSum, setSelectedSum] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const initialAimagRef = useRef<string | null>(null);

  const sums = useMemo(() => getSumsByAimag(selectedAimag), [selectedAimag]);

  const loadUserLocation = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      const user = toUserFallback(parseOnboardingSnapshot(raw));
      if (user?.aimag) {
        initialAimagRef.current = user.aimag;
        setUserAimag(user.aimag);
        setSelectedAimag(user.aimag);
        if (user.sum) {
          setUserSum(user.sum);
          setSelectedSum(user.sum);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { loadUserLocation(); }, [loadUserLocation]);

  const loadWeather = async (aimag: string) => {
    try {
      const data = await weatherApi.getByAimag(aimag);
      setWeatherData(data);
      setForecast(data.forecast || []);
    } catch {
      setWeatherData(null);
      setForecast([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadWeather(selectedAimag); }, [selectedAimag]);
  // Аймаг солих үед сум reset — гэхдээ onboarding-оос анх set хийх үед reset хийхгүй
  useEffect(() => {
    if (initialAimagRef.current && initialAimagRef.current !== selectedAimag) {
      setSelectedSum(null);
    }
  }, [selectedAimag]);

  const onRefresh = () => { setRefreshing(true); loadWeather(selectedAimag); };

  const dzudColor = (risk: string) => {
    if (risk === 'high') return AppColors.danger;
    if (risk === 'medium') return AppColors.warning;
    return AppColors.success;
  };

  const dzudLabel = (risk: string) => {
    if (risk === 'high') return 'Өндөр эрсдэлтэй';
    if (risk === 'medium') return 'Дунд эрсдэлтэй';
    return 'Бага эрсдэлтэй';
  };

  const conditionMn = (condition: string) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('clear') || c.includes('sunny')) return 'Цэлмэг';
    if (c.includes('cloud') && c.includes('partly')) return 'Багавтар үүлтэй';
    if (c.includes('cloud')) return 'Үүлэрхэг';
    if (c.includes('rain')) return 'Бороотой';
    if (c.includes('snow')) return 'Цастай';
    if (c.includes('wind')) return 'Салхитай';
    if (c.includes('fog') || c.includes('mist')) return 'Манантай';
    return condition;
  };

  const weatherIcon = (condition: string) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('clear') || c.includes('sunny')) return '☀️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('snow')) return '🌨️';
    if (c.includes('wind')) return '🌬️';
    return '⛅';
  };

  const isOwnLocation = userAimag === selectedAimag && userSum === selectedSum;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{'⛅'} Цаг агаар</Text>
          <Text style={styles.subtitle}>
            {'📍'} {selectedAimag}{selectedSum ? ` / ${selectedSum}` : ''}
            {isOwnLocation && userAimag ? '  (таны байршил)' : ''}
          </Text>
        </View>

        {/* "Өөр газар үзэх" toggle — default хаалттай, malchin өөрийн байршлаа харна */}
        <View style={styles.pickerToggleRow}>
          <TouchableOpacity
            style={styles.pickerToggle}
            onPress={() => setShowPicker(!showPicker)}
          >
            <Text style={styles.pickerToggleText}>
              {showPicker ? '▲ Газрын сонголт хаах' : '▼ Өөр газрын цаг агаар'}
            </Text>
          </TouchableOpacity>
          {userAimag && !isOwnLocation && (
            <TouchableOpacity
              onPress={() => {
                setSelectedAimag(userAimag);
                setSelectedSum(userSum);
                setLoading(true);
              }}
              style={styles.resetLocationBtn}
            >
              <Text style={styles.resetLocationText}>↩ Миний байршил</Text>
            </TouchableOpacity>
          )}
        </View>

        {showPicker && (
          <>
            {/* Аймаг сонгох — wrap (2+ эгнээ) */}
            <Text style={styles.sectionLabel}>Аймаг</Text>
            <View style={styles.aimagWrap}>
              {aimags.map((aimag) => (
                <TouchableOpacity
                  key={aimag}
                  style={[styles.aimagChip, selectedAimag === aimag && styles.aimagChipActive]}
                  onPress={() => { setSelectedAimag(aimag); setLoading(true); }}
                >
                  <Text style={[styles.aimagChipText, selectedAimag === aimag && styles.aimagChipTextActive]}>
                    {aimag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Сум сонгох — wrap */}
            {sums.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Сум</Text>
                <View style={styles.sumWrap}>
                  {sums.map((sum) => (
                    <TouchableOpacity
                      key={sum}
                      style={[styles.sumChip, selectedSum === sum && styles.sumChipActive]}
                      onPress={() => setSelectedSum(selectedSum === sum ? null : sum)}
                    >
                      <Text style={[styles.sumChipText, selectedSum === sum && styles.sumChipTextActive]}>
                        {sum}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {selectedSum && (
          <View style={styles.sumBanner}>
            <Text style={styles.sumBannerText}>
              {'ℹ️'} Одоогоор <Text style={styles.sumBannerNote}>аймгийн ерөнхий мэдээ</Text> харуулж байна. Сум тус бүрийн нарийн мэдээ удахгүй нэмэгдэнэ.
            </Text>
          </View>
        )}

        {weatherData ? (
          <>
            {/* Current weather */}
            <View style={styles.currentCard}>
              <Text style={styles.currentIcon}>{weatherIcon(weatherData.condition)}</Text>
              <Text style={styles.currentTemp}>{weatherData.temp}°C</Text>
              <Text style={styles.currentCondition}>{conditionMn(weatherData.condition)}</Text>
              {weatherData.feels_like != null && (
                <Text style={styles.feelsLike}>Мэдрэгдэх: {weatherData.feels_like}°C</Text>
              )}
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Салхи</Text>
                  <Text style={styles.detailValue}>{weatherData.wind} м/с</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Чийгшил</Text>
                  <Text style={styles.detailValue}>{weatherData.humidity || '-'}%</Text>
                </View>
                {weatherData.temp_min != null && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Хамгийн бага</Text>
                    <Text style={styles.detailValue}>{weatherData.temp_min}°C</Text>
                  </View>
                )}
                {weatherData.temp_max != null && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Хамгийн их</Text>
                    <Text style={styles.detailValue}>{weatherData.temp_max}°C</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Зудын эрсдэл */}
            <View style={[styles.dzudCard, { borderColor: dzudColor(weatherData.dzud_risk) }]}>
              <View style={styles.dzudHeader}>
                <Text style={styles.dzudTitle}>{'🌨️'} Зудын эрсдэл</Text>
                <View style={[styles.dzudBadge, { backgroundColor: dzudColor(weatherData.dzud_risk) }]}>
                  <Text style={styles.dzudBadgeText}>{weatherData.dzud_risk?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.dzudDescription}>{dzudLabel(weatherData.dzud_risk)}</Text>
              {weatherData.dzud_risk === 'high' && (
                <Text style={styles.dzudWarning}>
                  {'⚠️'} Малаа дулаан хашаанд оруулж, тэжээл нөөцлөхийг зөвлөж байна!
                </Text>
              )}
            </View>

            {/* 5 өдрийн урьдчилсан мэдээ */}
            {forecast.length > 0 && (
              <View style={styles.forecastSection}>
                <Text style={styles.sectionTitle}>5 өдрийн урьдчилсан мэдээ</Text>
                {forecast.map((day: any, idx: number) => (
                  <View key={idx} style={styles.forecastItem}>
                    <Text style={styles.forecastDate}>{day.date || `${idx + 1}-р өдөр`}</Text>
                    <Text style={styles.forecastIcon}>{weatherIcon(day.condition)}</Text>
                    <View style={styles.forecastTempCol}>
                      <Text style={styles.forecastTempHigh}>{day.temp_max ?? day.temp}°</Text>
                      <Text style={styles.forecastTempLow}>{day.temp_min != null ? `${day.temp_min}°` : ''}</Text>
                    </View>
                    <Text style={styles.forecastCondition}>{conditionMn(day.condition)}</Text>
                    <Text style={styles.forecastWind}>{day.wind} м/с</Text>
                    <View style={[styles.forecastDzud, { backgroundColor: dzudColor(day.dzud_risk) }]}>
                      <Text style={styles.forecastDzudText}>{day.dzud_risk === 'low' ? 'Бага' : day.dzud_risk === 'medium' ? 'Дунд' : 'Өндөр'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Цаг агаарын мэдээ ачааллаж чадсангүй</Text>
            <TouchableOpacity onPress={() => loadWeather(selectedAimag)}>
              <Text style={styles.retryText}>Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: AppColors.black },
  subtitle: { fontSize: 13, color: AppColors.grayDark, marginTop: 4 },
  pickerToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 4,
  },
  pickerToggle: { paddingVertical: 6, paddingHorizontal: 8 },
  pickerToggleText: { fontSize: 13, fontWeight: '600', color: AppColors.primary },
  resetLocationBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: AppColors.primary + '14',
  },
  resetLocationText: { fontSize: 12, fontWeight: '700', color: AppColors.primary },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: AppColors.gray,
    paddingHorizontal: 16, marginTop: 8, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  aimagWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 8,
  },
  aimagChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18,
    backgroundColor: AppColors.white, borderWidth: 1.5, borderColor: AppColors.grayMedium,
  },
  aimagChipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  aimagChipText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  aimagChipTextActive: { color: AppColors.white },
  sumWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 6,
  },
  sumChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.grayMedium,
  },
  sumChipActive: { backgroundColor: AppColors.accent, borderColor: AppColors.accent },
  sumChipText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  sumChipTextActive: { color: AppColors.white },
  sumBanner: {
    marginHorizontal: 16, marginTop: 8, padding: 10, borderRadius: 10,
    backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFE082',
  },
  sumBannerText: { fontSize: 12, color: '#6D4C00', fontWeight: '600' },
  sumBannerNote: { fontWeight: '400', fontStyle: 'italic', color: '#8D6E00' },
  currentCard: {
    backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  currentIcon: { fontSize: 64 },
  currentTemp: { fontSize: 48, fontWeight: '800', color: AppColors.black, marginTop: 8 },
  currentCondition: { fontSize: 16, color: AppColors.grayDark, marginTop: 4 },
  feelsLike: { fontSize: 13, color: AppColors.gray, marginTop: 4 },
  detailRow: { flexDirection: 'row', gap: 20, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 12, color: AppColors.gray },
  detailValue: { fontSize: 16, fontWeight: '700', color: AppColors.black, marginTop: 2 },
  dzudCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16,
    backgroundColor: AppColors.white, borderWidth: 2,
  },
  dzudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dzudTitle: { fontSize: 16, fontWeight: '700', color: AppColors.black },
  dzudBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  dzudBadgeText: { color: AppColors.white, fontSize: 12, fontWeight: '800' },
  dzudDescription: { fontSize: 14, color: AppColors.grayDark, marginTop: 8 },
  dzudWarning: { fontSize: 13, color: AppColors.danger, marginTop: 8, fontWeight: '600' },
  forecastSection: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black, marginBottom: 12 },
  forecastItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white,
    borderRadius: 12, padding: 12, marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  forecastDate: { fontSize: 12, color: AppColors.grayDark, width: 72 },
  forecastIcon: { fontSize: 22 },
  forecastTempCol: { alignItems: 'center' as const, width: 50 },
  forecastTempHigh: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  forecastTempLow: { fontSize: 12, color: AppColors.gray },
  forecastCondition: { fontSize: 11, color: AppColors.grayDark, width: 60 },
  forecastWind: { fontSize: 11, color: AppColors.grayDark, flex: 1 },
  forecastDzud: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  forecastDzudText: { color: AppColors.white, fontSize: 10, fontWeight: '700' },
  errorCard: {
    marginHorizontal: 16, marginTop: 16, padding: 32, borderRadius: 16,
    backgroundColor: AppColors.white, alignItems: 'center',
  },
  errorText: { fontSize: 14, color: AppColors.grayDark },
  retryText: { fontSize: 14, color: AppColors.primary, fontWeight: '600', marginTop: 12 },
});
