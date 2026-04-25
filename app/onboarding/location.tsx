import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { AppColors } from '@/constants/theme';
import { StepHeader, PrimaryButton } from '@/components/onboarding-ui';
import { useOnboarding } from './_layout';
import {
  getAimagList,
  getSumsByAimag,
  findNearestSum,
} from '@/services/mongolia-geo';
import { DEFAULT_BAG_OPTIONS } from '@/services/bag-id';

export default function LocationScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [aimag, setAimag] = useState(data.aimag);
  const [sum, setSum] = useState(data.sum);
  const [bag, setBag] = useState(data.bag);
  const [gpsLoading, setGpsLoading] = useState(false);

  const aimags = getAimagList();
  const sums = aimag ? getSumsByAimag(aimag) : [];

  const detectGps = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Зөвшөөрөл', 'GPS-ийн зөвшөөрөл шаардлагатай');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const loc = findNearestSum(pos.coords.latitude, pos.coords.longitude);
      setAimag(loc.aimag);
      setSum(loc.sum || '');
    } catch {
      Alert.alert('Алдаа', 'Байршил тогтоох боломжгүй боллоо');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleNext = () => {
    if (!aimag || !sum) {
      Alert.alert('Алдаа', 'Аймаг ба сумаа сонгоно уу');
      return;
    }
    update({ aimag, sum, bag: bag.trim() });
    router.push('/onboarding/seasonal' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StepHeader
          step={5}
          total={8}
          title="Таны байршил"
          subtitle="Аймаг, сум, багаа сонгоно уу"
        />

        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={detectGps}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <ActivityIndicator color={AppColors.primary} />
          ) : (
            <Text style={styles.gpsBtnText}>📍 GPS-ээр автоматаар тогтоох</Text>
          )}
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Аймаг</Text>
          <View style={styles.chipsWrap}>
            {aimags.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, aimag === a && styles.chipActive]}
                onPress={() => {
                  setAimag(a);
                  setSum('');
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    aimag === a && styles.chipTextActive,
                  ]}
                >
                  {a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {aimag ? (
            <>
              <Text style={styles.label}>Сум</Text>
              <View style={styles.chipsWrap}>
                {sums.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, sum === s && styles.chipActive]}
                    onPress={() => setSum(s)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        sum === s && styles.chipTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Баг (заавал биш)</Text>
          <View style={styles.chipsWrap}>
            {DEFAULT_BAG_OPTIONS.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.chip, bag === b && styles.chipActive]}
                onPress={() => setBag(bag === b ? '' : b)}
              >
                <Text
                  style={[
                    styles.chipText,
                    bag === b && styles.chipTextActive,
                  ]}
                >
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Бусад (жишээ: Найрамдал)"
            placeholderTextColor={AppColors.gray}
            value={DEFAULT_BAG_OPTIONS.includes(bag) ? '' : bag}
            onChangeText={setBag}
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Үргэлжлүүлэх"
            onPress={handleNext}
            disabled={!aimag || !sum}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  gpsBtn: {
    marginHorizontal: 24,
    marginVertical: 12,
    padding: 14,
    backgroundColor: '#F0F9F2',
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  gpsBtnText: { color: AppColors.primary, fontSize: 14, fontWeight: '700' },
  body: { paddingHorizontal: 24, paddingBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginBottom: 8,
    marginTop: 12,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    backgroundColor: AppColors.white,
  },
  chipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  chipTextActive: { color: AppColors.white },
  input: {
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.black,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
