import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { livestockApi } from '@/services/api';

const animalTypes = [
  { key: 'sheep', label: 'Хонь', emoji: '\uD83D\uDC11' },
  { key: 'goat', label: 'Ямаа', emoji: '\uD83D\uDC10' },
  { key: 'cattle', label: 'Үхэр', emoji: '\uD83D\uDC02' },
  { key: 'horse', label: 'Адуу', emoji: '\uD83D\uDC0E' },
  { key: 'camel', label: 'Тэмээ', emoji: '\uD83D\uDC2A' },
];

const eventTypes = [
  { key: 'birth', label: 'Төрсөн', emoji: '\uD83C\uDF89' },
  { key: 'death', label: 'Үхсэн', emoji: '\u2620\uFE0F' },
  { key: 'sold', label: 'Зарсан', emoji: '\uD83D\uDCB0' },
  { key: 'purchased', label: 'Авсан', emoji: '\uD83D\uDED2' },
];

export default function LivestockScreen() {
  const [loading, setLoading] = useState(true);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState('sheep');
  const [count, setCount] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('birth');
  const [eventQuantity, setEventQuantity] = useState('');
  const [eventNote, setEventNote] = useState('');

  const userId = 1;

  const loadData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.allSettled([
        livestockApi.getStats(userId),
        livestockApi.getEvents(userId),
      ]);
      if (statsRes.status === 'fulfilled') {
        setLivestock(statsRes.value.livestock || []);
        setTotalAnimals(statsRes.value.total_animals || 0);
      }
      if (eventsRes.status === 'fulfilled') {
        setEvents((eventsRes.value || []).slice(0, 10));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    const num = parseInt(count);
    if (!num || num <= 0) { Alert.alert('Алдаа', 'Тоо оруулна уу'); return; }
    try {
      await livestockApi.add({ user_id: userId, animal_type: selectedAnimal, total_count: num });
      setShowAddModal(false);
      setCount('');
      loadData();
    } catch {
      Alert.alert('Алдаа', 'Мал нэмэхэд алдаа гарлаа');
    }
  };

  const handleEvent = async () => {
    const num = parseInt(eventQuantity);
    if (!num || num <= 0) { Alert.alert('Алдаа', 'Тоо оруулна уу'); return; }
    try {
      await livestockApi.addEvent({
        user_id: userId,
        animal_type: selectedAnimal,
        event_type: selectedEvent,
        quantity: num,
        note: eventNote,
      });
      setShowEventModal(false);
      setEventQuantity('');
      setEventNote('');
      loadData();
    } catch {
      Alert.alert('Алдаа', 'Үйл явдал бүртгэхэд алдаа гарлаа');
    }
  };

  const getAnimalInfo = (type: string) => animalTypes.find(a => a.key === type) || { label: type, emoji: '\uD83D\uDC3E' };
  const getEventInfo = (type: string) => eventTypes.find(e => e.key === type) || { label: type, emoji: '\uD83D\uDCCB' };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{'\uD83D\uDC11'} Мал бүртгэл</Text>
          <Text style={styles.subtitle}>Нийт: {totalAnimals} толгой</Text>
        </View>

        {/* Малын жагсаалт */}
        <View style={styles.grid}>
          {animalTypes.map((animal) => {
            const data = livestock.find((l: any) => l.animal_type === animal.key);
            const animalCount = data?.total_count || 0;
            return (
              <View key={animal.key} style={styles.animalCard}>
                <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                <Text style={styles.animalCount}>{animalCount}</Text>
                <Text style={styles.animalLabel}>{animal.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtnText}>+ Мал нэмэх</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, styles.eventBtn]} onPress={() => setShowEventModal(true)}>
            <Text style={styles.addBtnText}>{'\uD83D\uDCCB'} Үйл явдал</Text>
          </TouchableOpacity>
        </View>

        {/* Сүүлийн үйл явдлууд */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сүүлийн үйл явдлууд</Text>
          {events.length > 0 ? events.map((event: any, idx: number) => {
            const animal = getAnimalInfo(event.animal_type);
            const evt = getEventInfo(event.event_type);
            return (
              <View key={idx} style={styles.eventItem}>
                <Text style={styles.eventEmoji}>{evt.emoji}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventText}>
                    {animal.emoji} {animal.label} - {evt.label} ({event.quantity})
                  </Text>
                  {event.note ? <Text style={styles.eventNote}>{event.note}</Text> : null}
                  <Text style={styles.eventDate}>{event.date}</Text>
                </View>
              </View>
            );
          }) : (
            <Text style={styles.emptyText}>Үйл явдал бүртгэгдээгүй байна</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Мал нэмэх Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Мал нэмэх</Text>

            <Text style={styles.label}>Малын төрөл</Text>
            <View style={styles.typeSelector}>
              {animalTypes.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.typeBtn, selectedAnimal === a.key && styles.typeBtnActive]}
                  onPress={() => setSelectedAnimal(a.key)}
                >
                  <Text style={styles.typeBtnEmoji}>{a.emoji}</Text>
                  <Text style={[styles.typeBtnLabel, selectedAnimal === a.key && styles.typeBtnLabelActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Тоо толгой</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={count}
              onChangeText={setCount}
              placeholder="Жнь: 50"
              placeholderTextColor={AppColors.gray}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Хадгалах</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Үйл явдал Modal */}
      <Modal visible={showEventModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Үйл явдал бүртгэх</Text>

            <Text style={styles.label}>Малын төрөл</Text>
            <View style={styles.typeSelector}>
              {animalTypes.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.typeBtn, selectedAnimal === a.key && styles.typeBtnActive]}
                  onPress={() => setSelectedAnimal(a.key)}
                >
                  <Text style={styles.typeBtnEmoji}>{a.emoji}</Text>
                  <Text style={[styles.typeBtnLabel, selectedAnimal === a.key && styles.typeBtnLabelActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Үйл явдлын төрөл</Text>
            <View style={styles.typeSelector}>
              {eventTypes.map((e) => (
                <TouchableOpacity
                  key={e.key}
                  style={[styles.typeBtn, selectedEvent === e.key && styles.typeBtnActive]}
                  onPress={() => setSelectedEvent(e.key)}
                >
                  <Text style={styles.typeBtnEmoji}>{e.emoji}</Text>
                  <Text style={[styles.typeBtnLabel, selectedEvent === e.key && styles.typeBtnLabelActive]}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Тоо</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={eventQuantity}
              onChangeText={setEventQuantity}
              placeholder="Жнь: 5"
              placeholderTextColor={AppColors.gray}
            />

            <Text style={styles.label}>Тэмдэглэл</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={eventNote}
              onChangeText={setEventNote}
              placeholder="Нэмэлт тэмдэглэл..."
              placeholderTextColor={AppColors.gray}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEventModal(false)}>
                <Text style={styles.cancelBtnText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEvent}>
                <Text style={styles.saveBtnText}>Бүртгэх</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: AppColors.black },
  subtitle: { fontSize: 14, color: AppColors.grayDark, marginTop: 4 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginTop: 12,
  },
  animalCard: {
    backgroundColor: AppColors.white, borderRadius: 16, padding: 16,
    alignItems: 'center', width: '30%', flexGrow: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  animalEmoji: { fontSize: 36 },
  animalCount: { fontSize: 22, fontWeight: '800', color: AppColors.black, marginTop: 6 },
  animalLabel: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  addBtn: {
    flex: 1, backgroundColor: AppColors.primary, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  eventBtn: { backgroundColor: AppColors.accent },
  addBtnText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black, marginBottom: 12 },
  eventItem: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: AppColors.white,
    borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  eventEmoji: { fontSize: 24, marginRight: 12 },
  eventInfo: { flex: 1 },
  eventText: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  eventNote: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  eventDate: { fontSize: 11, color: AppColors.gray, marginTop: 4 },
  emptyText: { fontSize: 14, color: AppColors.gray, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark, marginBottom: 8, marginTop: 12 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center',
  },
  typeBtnActive: { borderColor: AppColors.primary, backgroundColor: '#E8F5E9' },
  typeBtnEmoji: { fontSize: 20 },
  typeBtnLabel: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  typeBtnLabelActive: { color: AppColors.primary, fontWeight: '600' },
  input: {
    borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12,
    padding: 12, fontSize: 16, color: AppColors.black,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: AppColors.grayDark },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: AppColors.primary, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: AppColors.white },
});
