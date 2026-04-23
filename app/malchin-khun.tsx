import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

type Section = 'health' | 'insurance' | 'safety' | 'mental' | 'habits';

const SECTIONS: { id: Section; emoji: string; title: string; desc: string }[] = [
  { id: 'health', emoji: '🩺', title: 'Эрүүл мэнд', desc: 'Үзлэг, эмийн сануулга' },
  { id: 'insurance', emoji: '🏥', title: 'ЭМД / НДШ', desc: 'Шимтгэл, тэтгэвэр' },
  { id: 'safety', emoji: '⚠️', title: 'Хөдөлмөрийн аюулгүй байдал', desc: 'Мал угсарч, авралын гарын авлага' },
  { id: 'mental', emoji: '🧘', title: 'Сэтгэл санаа', desc: 'Стресс, ганцаардал, өрхийн харилцаа' },
  { id: 'habits', emoji: '🌅', title: 'Өдрийн зуршил', desc: 'Унтах, хооллох, биеийн дасгал' },
];

export default function MalchinKhun() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('health');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Малчин хүн</Text>
          <Text style={styles.headerSubtitle}>Өөрийн эрүүл мэнд, нийгмийн хамгаалал</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.tab, section === s.id && styles.tabActive]}
            onPress={() => setSection(s.id)}
          >
            <Text style={styles.tabEmoji}>{s.emoji}</Text>
            <Text style={[styles.tabText, section === s.id && styles.tabTextActive]}>
              {s.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body}>
        {section === 'health' && <HealthView />}
        {section === 'insurance' && <InsuranceView />}
        {section === 'safety' && <SafetyView />}
        {section === 'mental' && <MentalView />}
        {section === 'habits' && <HabitsView />}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function HealthView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>⏰ Хуваарийн сануулга</Text>
        <Reminder title="Жил тутмын биеийн үзлэг" date="2026-06-01" type="due" />
        <Reminder title="Цусны даралт хэмжих" date="Сар бүр" type="ongoing" />
        <Reminder title="Шүдний үзлэг" date="2026-09-15" type="upcoming" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>💊 Эмийн сануулга</Text>
        <Text style={styles.empty}>Бичигдсэн эм байхгүй</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Удахгүй', 'Эмийн сануулга нэмэх функц Phase 2-д')}
        >
          <Text style={styles.addBtnText}>+ Эм нэмэх</Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>⚠ Онцлох эрсдэл (нас/нутаг)</Text>
        <Tip
          emoji="🫀"
          title="Цусны даралт"
          body="45+ нас, малчны ачаалал өндөр тул жил бүр шалгах"
        />
        <Tip
          emoji="🦴"
          title="Нуруу-үе мөчний өвчин"
          body="Хүнд даалгавар → зөв дасгал, зөв өргөх"
        />
        <Tip
          emoji="❄️"
          title="Хөндүү арьс, гар"
          body="Өвлийн ажилд дулаан бээлий, тос түрхэх"
        />
      </Card>
    </>
  );
}

function InsuranceView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>🏥 ЭМД (Эрүүл мэндийн даатгал)</Text>
        <InfoRow k="Статус" v="Идэвхтэй" color={AppColors.success} />
        <InfoRow k="Хугацаа дуусах" v="2026-12-31" />
        <InfoRow k="Төлөх шимтгэл" v="3,600₮ / сар" />
        <TouchableOpacity style={styles.linkBtn} onPress={() => Alert.alert('Холбоос', '/insurance руу')}>
          <Text style={styles.linkBtnText}>Дэлгэрэнгүй харах ›</Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>🏦 НДШ (Нийгмийн даатгал)</Text>
        <InfoRow k="Статус" v="Идэвхтэй" color={AppColors.success} />
        <InfoRow k="Сар бүрийн төлбөр" v="11.5% × орлого" />
        <InfoRow k="Тэтгэврийн шимтгэл жил" v="8 жил" />
        <TouchableOpacity style={styles.linkBtn} onPress={() => Alert.alert('Холбоос', '/insurance руу')}>
          <Text style={styles.linkBtnText}>Тооцоолуур нээх ›</Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>📅 Төлбөрийн сануулга</Text>
        <Reminder title="5-р сарын ЭМД" date="2026-05-10" type="upcoming" />
        <Reminder title="5-р сарын НДШ" date="2026-05-10" type="upcoming" />
      </Card>
    </>
  );
}

function SafetyView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>🚨 Яаралтай дуудлага</Text>
        <EmergencyBtn label="103 — Түргэн тусламж" onPress={() => Linking.openURL('tel:103')} />
        <EmergencyBtn label="105 — Онцгой байдал" onPress={() => Linking.openURL('tel:105')} />
        <EmergencyBtn label="102 — Цагдаа" onPress={() => Linking.openURL('tel:102')} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>⚠ Хамгийн түгээмэл гэмтэл</Text>
        <Tip emoji="🐎" title="Морь унахад" body="Малгай, эмээл тохирсон байх, согтуу үед битгий унах" />
        <Tip emoji="🐂" title="Үхэр савалгаа" body="Тогтоогоо барих, ар талд зогсохгүй" />
        <Tip emoji="🐑" title="Хонь шувтрах" body="Бөх даруу хөдөлгөөн — нуруунд ачаалал өгөхгүй" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>🧰 Анхан шатны тусламж</Text>
        <Tip emoji="🩸" title="Цусан алдалт" body="Даралт өгөх, өндөрлөх. Их хэмжээний бол 103" />
        <Tip emoji="🧊" title="Хөлдөлт" body="Аажим халаана. Халуун ус биш, бүлээн" />
        <Tip emoji="🔥" title="Түлэгдэл" body="Хүйтэн ус 10-15 мин, тос түрхэхгүй" />
      </Card>
    </>
  );
}

function MentalView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>🧘 Стресс тайлах</Text>
        <Tip
          emoji="🫁"
          title="4-7-8 амьсгалын дасгал"
          body="4 секунд амьсгалах, 7 барих, 8 гаргах × 4 удаа"
        />
        <Tip
          emoji="🚶"
          title="20 минут алхах"
          body="Бүх зовлон арилахгүй, гэхдээ тэжээл болно"
        />
        <Tip
          emoji="☎️"
          title="Хэн нэгэнд ярих"
          body="Ой санаагаа нээж хуваалцах — гэр бүл, найз, 108"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>❤️ Өрхийн харилцаа</Text>
        <Tip
          emoji="👂"
          title="Сонсох цаг"
          body="Өдөрт 15 минут — утсаас ангид, гэр бүлтэйгээ"
        />
        <Tip
          emoji="🙏"
          title="Талархал илэрхийлэх"
          body="Өдөр бүр нэг зүйлд баярлах"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>☎️ Сэтгэл зүйн дэмжлэг</Text>
        <EmergencyBtn label="108 — Сэтгэл зүйн утас" onPress={() => Linking.openURL('tel:108')} />
      </Card>
    </>
  );
}

function HabitsView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>🌅 Өглөөний зуршил</Text>
        <Tip emoji="💧" title="1 аяга ус" body="Сэрсэн даруй — судас нээгдэнэ" />
        <Tip emoji="🤸" title="5 мин татах" body="Нуруу, мөр, хөл" />
        <Tip emoji="🍚" title="Өглөөний хоол" body="Заавал. Хар будаа, мах, сүү" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>🌙 Унтах зуршил</Text>
        <Tip emoji="📵" title="30 мин өмнө утас хаях" body="Нүд, тархи тайвшруулна" />
        <Tip emoji="🕐" title="Тогтмол цаг" body="Ижил цагт унтах → 7-8 цаг" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>💪 Биеийн тамир</Text>
        <Tip emoji="🚶" title="Өдөр 5000+ алхам" body="Малтай ажил байгалийн алхам" />
        <Tip emoji="🤲" title="Гараа сунгах" body="Нурууны өвчнөөс сэргийлнэ" />
      </Card>
    </>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Reminder({ title, date, type }: { title: string; date: string; type: 'due' | 'upcoming' | 'ongoing' }) {
  const color = type === 'due' ? AppColors.danger : type === 'upcoming' ? AppColors.warning : AppColors.success;
  const label = type === 'due' ? 'Хугацаа дууссан' : type === 'upcoming' ? 'Ойртож байна' : 'Үргэлжилж буй';
  return (
    <View style={styles.reminder}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reminderTitle}>{title}</Text>
        <Text style={styles.reminderDate}>{date}</Text>
      </View>
      <View style={[styles.reminderBadge, { backgroundColor: color }]}>
        <Text style={styles.reminderBadgeText}>{label}</Text>
      </View>
    </View>
  );
}

function Tip({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <View style={styles.tip}>
      <Text style={styles.tipEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.tipTitle}>{title}</Text>
        <Text style={styles.tipBody}>{body}</Text>
      </View>
    </View>
  );
}

function InfoRow({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{k}</Text>
      <Text style={[styles.infoValue, color ? { color } : null]}>{v}</Text>
    </View>
  );
}

function EmergencyBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.emergencyBtn} onPress={onPress}>
      <Text style={styles.emergencyText}>📞 {label}</Text>
    </TouchableOpacity>
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
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: AppColors.white },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: AppColors.grayMedium, backgroundColor: AppColors.white,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  tabActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  tabEmoji: { fontSize: 16 },
  tabText: { fontSize: 13, color: AppColors.black, fontWeight: '600' },
  tabTextActive: { color: AppColors.white },
  body: { padding: 16 },
  card: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, marginBottom: 10 },
  reminder: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  reminderDate: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  reminderBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reminderBadgeText: { color: AppColors.white, fontSize: 10, fontWeight: '700' },
  tip: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  tipBody: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  empty: { fontSize: 13, color: AppColors.gray, fontStyle: 'italic', marginBottom: 10 },
  addBtn: {
    paddingVertical: 10, alignItems: 'center', borderRadius: 10,
    backgroundColor: AppColors.grayLight,
  },
  addBtnText: { color: AppColors.primary, fontSize: 13, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  infoKey: { fontSize: 13, color: AppColors.grayDark },
  infoValue: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  linkBtn: { paddingVertical: 10, alignItems: 'center' },
  linkBtnText: { color: AppColors.primary, fontSize: 13, fontWeight: '700' },
  emergencyBtn: {
    backgroundColor: AppColors.danger, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', marginBottom: 8,
  },
  emergencyText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },
});
