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
import { StepHeader, PrimaryButton } from '@/components/onboarding-ui';
import { useOnboarding } from './_layout';

export default function NameScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [lastName, setLastName] = useState(data.lastName);
  const [firstName, setFirstName] = useState(data.firstName);

  const handleNext = () => {
    if (!firstName.trim()) {
      Alert.alert('Алдаа', 'Нэрээ оруулна уу');
      return;
    }
    update({ lastName: lastName.trim(), firstName: firstName.trim() });
    router.push('/onboarding/role' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StepHeader
          step={3}
          total={8}
          title="Таны нэр"
          subtitle="Бид танд хандах нэрээ хэлээрэй"
        />
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Овог</Text>
          <TextInput
            style={styles.input}
            placeholder="Жишээ: Батын"
            placeholderTextColor={AppColors.gray}
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.label}>Нэр</Text>
          <TextInput
            style={styles.input}
            placeholder="Жишээ: Дорж"
            placeholderTextColor={AppColors.gray}
            value={firstName}
            onChangeText={setFirstName}
          />
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Үргэлжлүүлэх"
            onPress={handleNext}
            disabled={!firstName.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginBottom: 6,
    marginTop: 12,
  },
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
