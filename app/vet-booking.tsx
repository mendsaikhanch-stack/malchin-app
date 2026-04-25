import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

type Vet = {
  id: string;
  name: string;
  phone: string;
  specialties: string[];
  distance: number; // km
  rating: number;
  reviewCount: number;
  priceRange: string;
  available: boolean;
  verified: boolean;
};

const MOCK_VETS: Vet[] = [
  {
    id: '1', name: 'Баатар.Д', phone: '99112233',
    specialties: ['Бог мал', 'Вакцин', 'Хээлтүүлэг'],
    distance: 12, rating: 4.8, reviewCount: 47,
    priceRange: '80,000-250,000₮', available: true, verified: true },
  {
    id: '2', name: 'Цэцэгмаа.Б', phone: '88223344',
    specialties: ['Бод мал', 'Төллөлт'],
    distance: 28, rating: 4.6, reviewCount: 32,
    priceRange: '100,000-300,000₮', available: true, verified: true },
  {
    id: '3', name: 'Ганбаатар.Н', phone: '99556677',
    specialties: ['Мэс засал', 'Цочмог эмчилгээ'],
    distance: 45, rating: 4.9, reviewCount: 89,
    priceRange: '150,000-500,000₮', available: false, verified: true },
  {
    id: '4', name: 'Оюунбилэг.Т', phone: '99778899',
    specialties: ['Адуу', 'Тэмээ'],
    distance: 65, rating: 4.5, reviewCount: 18,
    priceRange: '120,000-280,000₮', available: true, verified: false },
];

const SERVICES = [
  { id: 'vaccine', label: 'Вакцинжуулалт', emoji: '💉' },
  { id: 'checkup', label: 'Ерөнхий үзлэг', emoji: '🩺' },
  { id: 'birth', label: 'Төллөлтийн туслалцаа', emoji: '🐑' },
  { id: 'surgery', label: 'Мэс засал', emoji: '🏥' },
  { id: 'disease', label: 'Өвчний эмчилгээ', emoji: '💊' },
  { id: 'breeding', label: 'Хээлтүүлэг', emoji: '❤️' },
];

export default function VetBooking() {
  const router = useRouter();
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [form, setForm] = useState<{
    service?: string;
    date?: string;
    time?: string;
    animalCount?: string;
    note?: string;
  }>({});

  const submit = () => {
    if (!form.service || !form.date || !form.time) {
      Alert.alert('Алдаа', 'Үйлчилгээ, огноо, цаг заавал');
      return;
    }
    Alert.alert(
      'Захиалга илгээлээ',
      `${selectedVet?.name}-д захиалга хүргэлээ. Батлагдсан эсэхийг утсаар эсвэл чатаар мэдэгдэнэ.`
    );
    setBookingModal(false);
    setSelectedVet(null);
    setForm({});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Мал эмч захиалах</Text>
          <Text style={styles.headerSubtitle}>Миний байршлаас ойролцоох эмчүүд</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Filter info */}
        <View style={styles.filterCard}>
          <Text style={styles.filterEmoji}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.filterTitle}>Миний байршил</Text>
            <Text style={styles.filterSub}>Төв аймаг, Алтанбулаг сум — 100 км радиус</Text>
          </View>
        </View>

        {/* Vet list */}
        {MOCK_VETS.map((v) => (
          <View key={v.id} style={[styles.vet, !v.available && styles.vetUnavailable]}>
            <View style={styles.vetHead}>
              <View style={styles.vetAvatar}>
                <Text style={styles.vetAvatarText}>{v.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.vetName}>{v.name}</Text>
                  {v.verified && <Text style={styles.verifiedTag}>✓</Text>}
                </View>
                <Text style={styles.vetRating}>
                  ⭐ {v.rating} ({v.reviewCount} санал) · 📍 {v.distance} км
                </Text>
              </View>
              {!v.available && (
                <View style={styles.unavailableBadge}>
                  <Text style={styles.unavailableText}>Завгүй</Text>
                </View>
              )}
            </View>

            <View style={styles.specialties}>
              {v.specialties.map((sp) => (
                <View key={sp} style={styles.specialty}>
                  <Text style={styles.specialtyText}>{sp}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.priceRange}>💰 {v.priceRange}</Text>

            <View style={styles.vetActions}>
              <TouchableOpacity
                style={[styles.vetBtn, styles.vetBtnSecondary]}
                onPress={() => Linking.openURL(`tel:${v.phone}`)}
              >
                <Text style={styles.vetBtnSecondaryText}>📞 Залгах</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.vetBtn, styles.vetBtnPrimary, !v.available && { opacity: 0.5 }]}
                disabled={!v.available}
                onPress={() => {
                  setSelectedVet(v);
                  setBookingModal(true);
                }}
              >
                <Text style={styles.vetBtnPrimaryText}>📅 Захиалах</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Booking modal */}
      <Modal visible={bookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>{selectedVet?.name}-д захиалга</Text>

              <Text style={styles.label}>Үйлчилгээ *</Text>
              <View style={styles.chipRow}>
                {SERVICES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, form.service === s.id && styles.chipActive]}
                    onPress={() => setForm({ ...form, service: s.id })}
                  >
                    <Text style={[styles.chipText, form.service === s.id && styles.chipTextActive]}>
                      {s.emoji} {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Огноо *</Text>
              <TextInput
                style={styles.input}
                value={form.date || ''}
                onChangeText={(v) => setForm({ ...form, date: v })}
                placeholder="2026-04-25"
              />

              <Text style={styles.label}>Цаг *</Text>
              <TextInput
                style={styles.input}
                value={form.time || ''}
                onChangeText={(v) => setForm({ ...form, time: v })}
                placeholder="10:00"
              />

              <Text style={styles.label}>Малын тоо</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={form.animalCount || ''}
                onChangeText={(v) => setForm({ ...form, animalCount: v })}
                placeholder="Жишээ: 50"
              />

              <Text style={styles.label}>Тэмдэглэл</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={form.note || ''}
                onChangeText={(v) => setForm({ ...form, note: v })}
                placeholder="Нэмэлт мэдээлэл..."
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => {
                    setBookingModal(false);
                    setSelectedVet(null);
                  }}
                >
                  <Text style={styles.btnSecondaryText}>Цуцлах</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={submit}>
                  <Text style={styles.btnPrimaryText}>Илгээх</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: AppColors.white, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: AppColors.black, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black },
  headerSubtitle: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  body: { padding: 16 },
  filterCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FFF4', borderRadius: 10, padding: 12, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: AppColors.primary },
  filterEmoji: { fontSize: 24 },
  filterTitle: { fontSize: 13, fontWeight: '700', color: AppColors.black },
  filterSub: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  vet: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 10,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.05)',     elevation: 1 },
  vetUnavailable: { opacity: 0.7 },
  vetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vetAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: AppColors.primary,
    alignItems: 'center', justifyContent: 'center' },
  vetAvatarText: { color: AppColors.white, fontSize: 20, fontWeight: '800' },
  vetName: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  verifiedTag: {
    fontSize: 10, color: AppColors.white, fontWeight: '700',
    backgroundColor: AppColors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  vetRating: { fontSize: 12, color: AppColors.grayDark, marginTop: 3 },
  unavailableBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: AppColors.gray },
  unavailableText: { color: AppColors.white, fontSize: 10, fontWeight: '700' },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  specialty: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F0FFF4',
    borderWidth: 1, borderColor: '#C6F6D5' },
  specialtyText: { fontSize: 11, color: AppColors.primaryDark, fontWeight: '600' },
  priceRange: { fontSize: 13, color: AppColors.grayDark, marginTop: 10, fontWeight: '600' },
  vetActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  vetBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  vetBtnPrimary: { backgroundColor: AppColors.primary },
  vetBtnPrimaryText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
  vetBtnSecondary: { backgroundColor: AppColors.grayLight },
  vetBtnSecondaryText: { color: AppColors.black, fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: AppColors.grayMedium, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: AppColors.grayMedium, backgroundColor: AppColors.white },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, color: AppColors.black },
  chipTextActive: { color: AppColors.white, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: AppColors.primary },
  btnSecondary: { backgroundColor: AppColors.grayLight },
  btnPrimaryText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  btnSecondaryText: { color: AppColors.black, fontSize: 15, fontWeight: '600' } });
