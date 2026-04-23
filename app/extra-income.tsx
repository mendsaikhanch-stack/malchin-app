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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

type Category = 'ger' | 'dairy' | 'meat' | 'craft' | 'tour' | 'service';

type Listing = {
  id: string;
  cat: Category;
  title: string;
  price: string;
  description: string;
  status: 'active' | 'paused';
};

const CATEGORIES: { id: Category; emoji: string; label: string; desc: string }[] = [
  { id: 'ger', emoji: '🏕️', label: 'Гэр буудал', desc: 'Жуулчдад гэр түрээслэх' },
  { id: 'dairy', emoji: '🥛', label: 'Цагаан идээ', desc: 'Айраг, ааруул, шар тос' },
  { id: 'meat', emoji: '🥩', label: 'Мах борц', desc: 'Амьд, хөлдөөсөн, борц' },
  { id: 'craft', emoji: '🧶', label: 'Гар урлал', desc: 'Эсгий, ширмэл, хатгамал' },
  { id: 'tour', emoji: '🐎', label: 'Морин аялал', desc: '1-3 өдрийн аялал' },
  { id: 'service', emoji: '🛠️', label: 'Үйлчилгээ', desc: 'Мал тээвэр, үйлчилгээ' },
];

const MOCK: Listing[] = [];

export default function ExtraIncome() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(MOCK);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Partial<Listing>>({});

  const openNew = (cat: Category) => {
    setForm({ cat, status: 'active' });
    setModalVisible(true);
  };

  const submit = () => {
    if (!form.title || !form.price) {
      Alert.alert('Алдаа', 'Гарчиг, үнэ заавал');
      return;
    }
    setListings([
      {
        id: Date.now().toString(),
        cat: form.cat as Category,
        title: form.title,
        price: form.price,
        description: form.description || '',
        status: 'active',
      },
      ...listings,
    ]);
    setModalVisible(false);
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
          <Text style={styles.headerTitle}>Нэмэлт орлого</Text>
          <Text style={styles.headerSubtitle}>Малаас гадна бусад эх үүсвэр</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Боломжит ангилал */}
        <Text style={styles.sectionTitle}>Орлогын эх үүсвэрүүд</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.gridItem}
              onPress={() => openNew(c.id)}
            >
              <Text style={styles.gridEmoji}>{c.emoji}</Text>
              <Text style={styles.gridLabel}>{c.label}</Text>
              <Text style={styles.gridDesc}>{c.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Таны зар */}
        <Text style={styles.sectionTitle}>Таны идэвхтэй зарууд</Text>
        {listings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Одоогоор зарласан зүйл алга</Text>
            <Text style={styles.emptyHint}>
              Дээрээс нэг ангилал сонгож зар оруул
            </Text>
          </View>
        ) : (
          listings.map((l) => {
            const c = CATEGORIES.find((x) => x.id === l.cat);
            return (
              <View key={l.id} style={styles.listingCard}>
                <Text style={styles.listingEmoji}>{c?.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listingTitle}>{l.title}</Text>
                  <Text style={styles.listingDesc}>{l.description}</Text>
                  <Text style={styles.listingPrice}>💰 {l.price}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Санаа */}
        <Text style={styles.sectionTitle}>Амжилтын жишээ</Text>
        <View style={styles.storyCard}>
          <Text style={styles.storyEmoji}>🏕️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.storyTitle}>Оюуна — Хархорум</Text>
            <Text style={styles.storyBody}>
              5 гэртэй буудал үүсгээд зунд 3 сард 15 сая₮ орлого олж байна. Фэйсбүүк, аяллын агентлагтай хамтрах нь чухал.
            </Text>
          </View>
        </View>
        <View style={styles.storyCard}>
          <Text style={styles.storyEmoji}>🥛</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.storyTitle}>Бат-Эрдэнэ — Төв</Text>
            <Text style={styles.storyBody}>
              Ааруулаа брэндлэж сарын 800,000₮ нэмэлт орлого. Улаанбаатарт 3 дэлгүүрт тогтмол нийлүүлнэ.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Form modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {CATEGORIES.find((c) => c.id === form.cat)?.emoji}{' '}
              {CATEGORIES.find((c) => c.id === form.cat)?.label} — шинэ зар
            </Text>

            <Text style={styles.label}>Гарчиг *</Text>
            <TextInput
              style={styles.input}
              value={form.title || ''}
              onChangeText={(v) => setForm({ ...form, title: v })}
              placeholder="Жишээ: Цэнгэг хөндий гэр буудал"
            />

            <Text style={styles.label}>Тайлбар</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              value={form.description || ''}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Юу санал болгож байна?"
            />

            <Text style={styles.label}>Үнэ / Нөхцөл *</Text>
            <TextInput
              style={styles.input}
              value={form.price || ''}
              onChangeText={(v) => setForm({ ...form, price: v })}
              placeholder="Жишээ: Хоногт 80,000₮ / Хэлэлцье"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnSecondaryText}>Цуцлах</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={submit}>
                <Text style={styles.btnPrimaryText}>Хадгалах</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: AppColors.white, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: AppColors.black, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black },
  headerSubtitle: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  body: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: AppColors.grayDark, marginTop: 10, marginBottom: 10, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    width: '48%', backgroundColor: AppColors.white, borderRadius: 14, padding: 14,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  gridEmoji: { fontSize: 36 },
  gridLabel: { fontSize: 14, fontWeight: '700', color: AppColors.black, marginTop: 6 },
  gridDesc: { fontSize: 11, color: AppColors.grayDark, marginTop: 3, textAlign: 'center' },
  emptyCard: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: AppColors.grayLight, borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, color: AppColors.grayDark, marginTop: 10, fontWeight: '600' },
  emptyHint: { fontSize: 12, color: AppColors.gray, marginTop: 4 },
  listingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  listingEmoji: { fontSize: 32 },
  listingTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  listingDesc: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  listingPrice: { fontSize: 13, color: AppColors.primary, fontWeight: '700', marginTop: 4 },
  storyCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: '#FFFBEA', borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: AppColors.secondary,
  },
  storyEmoji: { fontSize: 28 },
  storyTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  storyBody: { fontSize: 12, color: AppColors.grayDark, marginTop: 4, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: AppColors.grayMedium, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: AppColors.primary },
  btnSecondary: { backgroundColor: AppColors.grayLight },
  btnPrimaryText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  btnSecondaryText: { color: AppColors.black, fontSize: 15, fontWeight: '600' },
});
