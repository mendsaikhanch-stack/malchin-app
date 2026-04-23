import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '@/constants/theme';
import { userApi } from '@/services/api';
import { clearCache, getCacheSize } from '@/services/offline';
import { useNetwork } from '@/hooks/use-network';

const ONBOARDING_DATA_KEY = '@malchin_onboarding_data';

const aimagList = [
  'Төв', 'Увс', 'Ховд', 'Баян-Өлгий', 'Завхан', 'Архангай',
  'Өвөрхангай', 'Дундговь', 'Өмнөговь', 'Дорнод', 'Хэнтий', 'Сүхбаатар', 'Булган',
];

export default function ProfileScreen() {
  const router = useRouter();
  const isConnected = useNetwork();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [aimag, setAimag] = useState('Төв');
  const [sum, setSum] = useState('');
  const [bag, setBag] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  // Онбординг-аас автомат нэвтрэлт. Таб focus болгонд дахин шалгана
  // (онбординг дуусаад профайл тавхад шилжихэд шинэ data-аа харна).
  const loadFromOnboarding = useCallback(async () => {
    if (isLoggedIn) return;
    try {
      const raw = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d?.phone) return;
      setUser({
        phone: d.phone,
        name: `${d.lastName || ''} ${d.firstName || ''}`.trim(),
        aimag: d.aimag,
        sum: d.sum,
        bag: d.bag,
        role: d.role,
      });
      setIsLoggedIn(true);
    } catch {
      // ignore
    }
  }, [isLoggedIn]);

  useEffect(() => { loadFromOnboarding(); }, [loadFromOnboarding]);
  useFocusEffect(useCallback(() => { loadFromOnboarding(); }, [loadFromOnboarding]));

  const handleLogin = async () => {
    if (!phone.trim() || phone.length < 8) {
      Alert.alert('Алдаа', 'Утасны дугаараа зөв оруулна уу');
      return;
    }
    setLoading(true);
    try {
      const res = await userApi.login(phone);
      if (res.user) {
        setUser(res.user);
        setIsLoggedIn(true);
        return;
      }
    } catch {
      // backend унасан эсвэл endpoint алга — local онбординг data-аас нэвтрүүлнэ
    }

    // Fallback: AsyncStorage-аас тухайн дугаараар нэвтрэх
    try {
      const raw = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.phone === phone) {
          setUser({
            phone: d.phone,
            name: `${d.lastName || ''} ${d.firstName || ''}`.trim(),
            aimag: d.aimag,
            sum: d.sum,
            bag: d.bag,
            role: d.role,
          });
          setIsLoggedIn(true);
          return;
        }
      }
    } catch {
      // ignore
    }

    setLoading(false);
    Alert.alert('Мэдэгдэл', 'Хэрэглэгч олдсонгүй. Бүртгүүлнэ үү.', [
      { text: 'Болих' },
      { text: 'Бүртгүүлэх', onPress: () => setIsRegistering(true) },
    ]);
  };

  const handleRegister = async () => {
    if (!phone.trim() || !name.trim()) {
      Alert.alert('Алдаа', 'Утас болон нэр оруулна уу');
      return;
    }
    setLoading(true);
    try {
      const res = await userApi.create({ phone, name, aimag, sum, bag });
      setUser(res.user);
      setIsLoggedIn(true);
      setIsRegistering(false);
    } catch {
      Alert.alert('Алдаа', 'Бүртгэлд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setPhone('');
    setName('');
  };

  // Login / Register screen
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.authContainer}>
          <Text style={styles.logoEmoji}>{'\uD83D\uDC0E'}</Text>
          <Text style={styles.logoText}>МАЛЧИН</Text>
          <Text style={styles.authSubtitle}>
            {isRegistering ? 'Шинэ бүртгэл' : 'Нэвтрэх'}
          </Text>

          <View style={styles.authForm}>
            <Text style={styles.label}>Утасны дугаар</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholder="99001122"
              placeholderTextColor={AppColors.gray}
              maxLength={8}
            />

            {isRegistering && (
              <>
                <Text style={styles.label}>Нэр</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Таны нэр"
                  placeholderTextColor={AppColors.gray}
                />

                <Text style={styles.label}>Аймаг</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.aimagScroll}>
                  {aimagList.map((a) => (
                    <TouchableOpacity
                      key={a}
                      style={[styles.aimagChip, aimag === a && styles.aimagChipActive]}
                      onPress={() => setAimag(a)}
                    >
                      <Text style={[styles.aimagChipText, aimag === a && styles.aimagChipTextActive]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Сум</Text>
                <TextInput
                  style={styles.input}
                  value={sum}
                  onChangeText={setSum}
                  placeholder="Сумын нэр"
                  placeholderTextColor={AppColors.gray}
                />

                <Text style={styles.label}>Баг</Text>
                <TextInput
                  style={styles.input}
                  value={bag}
                  onChangeText={setBag}
                  placeholder="Багийн нэр"
                  placeholderTextColor={AppColors.gray}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.authBtn, loading && { opacity: 0.7 }]}
              onPress={isRegistering ? handleRegister : handleLogin}
              disabled={loading}
            >
              <Text style={styles.authBtnText}>
                {loading ? 'Түр хүлээнэ үү...' : isRegistering ? 'Бүртгүүлэх' : 'Нэвтрэх'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
              <Text style={styles.switchText}>
                {isRegistering ? 'Нэвтрэх хуудас руу буцах' : 'Шинээр бүртгүүлэх'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Profile screen
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'М').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          <Text style={styles.userLocation}>
            {'\uD83D\uDCCD'} {user?.aimag}{user?.sum ? `, ${user.sum}` : ''}{user?.bag ? `, ${user.bag}` : ''}
          </Text>
        </View>

        {/* Menu items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>{'\uD83D\uDC11'}</Text>
            <Text style={styles.menuText}>Малын бүртгэл</Text>
            <Text style={styles.menuArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>{'\uD83D\uDCB0'}</Text>
            <Text style={styles.menuText}>Санхүүгийн тайлан</Text>
            <Text style={styles.menuArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>{'\uD83D\uDED2'}</Text>
            <Text style={styles.menuText}>Зах зээлийн зарууд</Text>
            <Text style={styles.menuArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>{'\uD83D\uDE9B'}</Text>
            <Text style={styles.menuText}>Тээврийн захиалга</Text>
            <Text style={styles.menuArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/privacy-settings' as any)}
          >
            <Text style={styles.menuIcon}>{'🔒'}</Text>
            <Text style={styles.menuText}>Нууцлал ба эрх</Text>
            <Text style={styles.menuArrow}>{'›'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/elder-content' as any)}
          >
            <Text style={styles.menuIcon}>{'👴'}</Text>
            <Text style={styles.menuText}>Ахмадын ухаан оруулах</Text>
            <Text style={styles.menuArrow}>{'›'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>{'\u2699\uFE0F'}</Text>
            <Text style={styles.menuText}>Тохиргоо</Text>
            <Text style={styles.menuArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>

        {/* Оффлайн удирдлага */}
        <View style={[styles.menuSection, { marginTop: 16 }]}>
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>{'\uD83D\uDCE1'}</Text>
            <Text style={styles.menuText}>Оффлайн горим</Text>
            <Text style={{ fontSize: 12, color: isConnected ? '#43A047' : '#E53935', fontWeight: '600' }}>
              {isConnected ? '\u2705 Онлайн' : '\uD83D\uDFE0 Оффлайн'}
            </Text>
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={async () => {
            const size = await getCacheSize();
            Alert.alert('Хадгалсан мэдээлэл', `${size.count} мэдээлэл хадгалагдсан`);
          }}>
            <Text style={styles.menuIcon}>{'\uD83D\uDCBE'}</Text>
            <Text style={styles.menuText}>Хадгалсан мэдээлэл</Text>
            <Text style={styles.menuArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={async () => {
            Alert.alert('Cache цэвэрлэх', 'Бүх хадгалсан мэдээлэл устгах уу?', [
              { text: 'Болих' },
              { text: 'Тийм', style: 'destructive', onPress: async () => {
                await clearCache();
                Alert.alert('Амжилттай', 'Cache цэвэрлэгдлээ');
              }},
            ]);
          }}>
            <Text style={styles.menuIcon}>{'\uD83D\uDDD1\uFE0F'}</Text>
            <Text style={styles.menuText}>Cache цэвэрлэх</Text>
            <Text style={styles.menuArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Гарах</Text>
        </TouchableOpacity>

        <Text style={styles.version}>МАЛЧИН v3.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  // Auth
  authContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  logoEmoji: { fontSize: 64, textAlign: 'center' },
  logoText: { fontSize: 32, fontWeight: '900', color: AppColors.primary, textAlign: 'center', marginTop: 8 },
  authSubtitle: { fontSize: 16, color: AppColors.grayDark, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  authForm: {},
  label: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12,
    padding: 14, fontSize: 16, color: AppColors.black, backgroundColor: AppColors.white,
  },
  aimagScroll: { maxHeight: 44 },
  aimagChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: AppColors.white, borderWidth: 1.5, borderColor: AppColors.grayMedium,
  },
  aimagChipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  aimagChipText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  aimagChipTextActive: { color: AppColors.white },
  authBtn: {
    backgroundColor: AppColors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  authBtnText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },
  switchText: { color: AppColors.primary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 16 },
  // Profile
  profileHeader: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: AppColors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: AppColors.white },
  userName: { fontSize: 22, fontWeight: '800', color: AppColors.black, marginTop: 12 },
  userPhone: { fontSize: 15, color: AppColors.grayDark, marginTop: 4 },
  userLocation: { fontSize: 14, color: AppColors.gray, marginTop: 4 },
  menuSection: { marginHorizontal: 16, backgroundColor: AppColors.white, borderRadius: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: AppColors.black },
  menuArrow: { fontSize: 22, color: AppColors.gray },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: AppColors.danger, alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: AppColors.danger },
  version: { textAlign: 'center', fontSize: 12, color: AppColors.gray, marginTop: 24 },
});
