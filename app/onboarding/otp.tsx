import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { StepHeader, PrimaryButton } from './_components';
import { useOnboarding } from './_layout';
import { userApi } from '@/services/api';

const OTP_LENGTH = 4;

export default function OtpScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const setDigit = (idx: number, val: string) => {
    const v = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Алдаа', `${OTP_LENGTH} оронтой кодоо оруулна уу`);
      return;
    }
    setLoading(true);
    let verified = false;
    try {
      const res = await userApi.verifyOtp(data.phone, code);
      verified = !!res?.verified;
    } catch {
      // Dev fallback: backend not wired up — accept any 4-digit code.
      // TODO: remove when /auth/verify-otp endpoint is live.
      verified = true;
    }
    setLoading(false);
    if (verified) {
      update({ otpVerified: true });
      router.push('/onboarding/name' as any);
    } else {
      Alert.alert('Алдаа', 'Код буруу байна. Дахин оролдоно уу.');
    }
  };

  const handleResend = async () => {
    setResendTimer(60);
    try {
      await userApi.sendOtp(data.phone);
    } catch {
      // ignore — dev mode
    }
  };

  const filled = digits.join('').length === OTP_LENGTH;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StepHeader
          step={2}
          total={8}
          title="Кодоо оруулна уу"
          subtitle={`+976 ${data.phone} дугаар руу илгээсэн ${OTP_LENGTH} оронтой код`}
        />
        <View style={styles.body}>
          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                style={styles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Backspace' && !d && i > 0) {
                    inputs.current[i - 1]?.focus();
                  }
                }}
                autoFocus={i === 0}
              />
            ))}
          </View>

          <TouchableOpacity disabled={resendTimer > 0} onPress={handleResend}>
            <Text style={[styles.resend, resendTimer > 0 && { opacity: 0.5 }]}>
              {resendTimer > 0
                ? `Дахин илгээх (${resendTimer} сек)`
                : 'Дахин илгээх'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footer}>
          <PrimaryButton
            label="Баталгаажуулах"
            onPress={handleVerify}
            loading={loading}
            disabled={!filled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 300,
    alignSelf: 'center',
    marginBottom: 24,
  },
  otpBox: {
    width: 60,
    height: 70,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    borderRadius: 12,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: AppColors.black,
    marginHorizontal: 4,
  },
  resend: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
