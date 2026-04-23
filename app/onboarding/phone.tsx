import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { StepHeader, PrimaryButton } from './_components';
import { useOnboarding } from './_layout';
import { userApi } from '@/services/api';

export default function PhoneScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [phone, setPhone] = useState(data.phone);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (phone.length < 8) {
      Alert.alert('Алдаа', 'Утасны 8 оронтой дугаараа оруулна уу');
      return;
    }
    setLoading(true);
    update({ phone });
    try {
      await userApi.sendOtp(phone);
    } catch {
      // Backend may not be available — dev mode falls through
    } finally {
      setLoading(false);
      router.push('/onboarding/otp' as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StepHeader
          step={1}
          total={8}
          title="Утасны дугаар"
          subtitle="Бид таны утас руу 4 оронтой код илгээнэ"
        />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.phoneRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+976</Text>
            </View>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="99001122"
              placeholderTextColor={AppColors.gray}
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
              maxLength={8}
              autoFocus
            />
          </View>
          <Text style={styles.note}>
            Энэ дугаар зөвхөн нэвтрэх, мэдэгдэл хүлээн авахад ашиглагдана.
          </Text>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Код илгээх"
            onPress={handleNext}
            loading={loading}
            disabled={phone.length < 8}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32 },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  prefix: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: AppColors.grayLight,
    borderRadius: 12,
    marginRight: 8,
  },
  prefixText: { fontSize: 18, fontWeight: '600', color: AppColors.black },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: AppColors.black,
  },
  note: {
    fontSize: 12,
    color: AppColors.grayDark,
    marginTop: 16,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
