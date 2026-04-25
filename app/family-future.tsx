import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

type Section = 'education' | 'scholarship' | 'budget' | 'skills' | 'business';

const SECTIONS: { id: Section; emoji: string; title: string }[] = [
  { id: 'education', emoji: '🎓', title: 'Боловсрол' },
  { id: 'scholarship', emoji: '💰', title: 'Тэтгэлэг' },
  { id: 'budget', emoji: '📊', title: 'Өрхийн санхүү' },
  { id: 'skills', emoji: '💡', title: 'Ур чадвар' },
  { id: 'business', emoji: '🚀', title: 'Бизнес санаа' },
];

export default function FamilyFuture() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('education');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Өрх ба ирээдүй</Text>
          <Text style={styles.headerSubtitle}>Хүүхэд, боловсрол, санхүүгийн мэдлэг</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
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
        {section === 'education' && <EducationView />}
        {section === 'scholarship' && <ScholarshipView />}
        {section === 'budget' && <BudgetView />}
        {section === 'skills' && <SkillsView />}
        {section === 'business' && <BusinessView />}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EducationView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>🏫 Сургуулийн бүртгэл (жишээ)</Text>
        <Text style={styles.empty}>Одоогоор хүүхэд бүртгэгдээгүй</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Удахгүй', 'Хүүхэд нэмэх функц Phase 2-д')}
        >
          <Text style={styles.addBtnText}>+ Хүүхэд нэмэх</Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>📚 Зайн сургалт</Text>
        <FeedItem
          title="E-Mongolia — хүүхдийн онлайн ресурс"
          body="Бага ангийн хичээл, даалгавар"
          emoji="🌐"
        />
        <FeedItem
          title="BBCO видеог үзэх (Bolorsoft)"
          body="Монгол хэл, математикийн видео хичээл"
          emoji="📹"
        />
        <FeedItem
          title="Мянганы Сорилго"
          body="Ахлах ангийн бэлтгэл"
          emoji="🎯"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>🏠 Дотуур байрны мэдээлэл</Text>
        <Tip emoji="🏫" title="Сумын төвийн сургууль" body="8-11-р анги" />
        <Tip emoji="🏢" title="Аймгийн төвийн дотуур байр" body="Алслагдмал баг" />
        <Tip emoji="📝" title="Хүсэлт гаргах" body="Сумын Засаг даргын тамгын газарт" />
      </Card>
    </>
  );
}

function ScholarshipView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>💰 Одоо ил байгаа тэтгэлэг</Text>
        <ScholarshipItem
          title="Малчдын хүүхдэд зориулсан тэтгэлэг"
          org="ХХААЯ"
          amount="Жилд 1,500,000₮"
          deadline="2026-05-31"
        />
        <ScholarshipItem
          title="Мянганы сорилгын сан"
          org="МСС"
          amount="Сурах хэрэгсэл"
          deadline="2026-06-15"
        />
        <ScholarshipItem
          title="Ардын их сургалтын тэтгэлэг"
          org="БСМС"
          amount="Сургалтын төлбөр бүрэн"
          deadline="2026-07-01"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>📋 Материалын жагсаалт</Text>
        <Tip emoji="📄" title="Иргэний үнэмлэх хуулбар" body="Эцэг/эх + хүүхэд" />
        <Tip emoji="📄" title="Малчны үнэмлэх" body="ХХААЯ-ны" />
        <Tip emoji="📄" title="Сургуулийн тодорхойлолт" body="Одоо суралцаж буй" />
        <Tip emoji="📄" title="Өрхийн орлогын тодорхойлолт" body="Сумын Засаг даргаас" />
      </Card>
    </>
  );
}

function BudgetView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>📊 Өрхийн сарын тойм</Text>
        <Text style={styles.empty}>Нэмэлт хөтлөлт нэмж эхлэхийг хүсэж байна уу?</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Холбоос', '/finance руу явсан тохиолдолд бүрэн функц')}
        >
          <Text style={styles.addBtnText}>Санхүү модуль нээх</Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>💡 50/30/20 дүрэм</Text>
        <Tip emoji="🏠" title="50% — Хэрэгцээ" body="Хоол, түлш, даатгал, сурах хэрэгсэл" />
        <Tip emoji="🎁" title="30% — Хүсэл" body="Зугаа цэнгэл, шинэ зүйл" />
        <Tip emoji="💰" title="20% — Хадгаламж" body="Яаралтай нөхцөл, ирээдүй" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>🏦 Хадгаламж / зээлийн мэдлэг</Text>
        <Tip emoji="🏦" title="Банкны хадгаламж" body="Хүү, хугацаа, даатгал шалгах" />
        <Tip emoji="📉" title="Зээлийн тогтцол" body="Сарын төлбөр / орлого ≤ 40%" />
        <Tip emoji="🐑" title="Малын 'хөрөнгө'" body="Малыг зээлийн барьцаа болгох" />
      </Card>
    </>
  );
}

function SkillsView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>📱 Цахим мэдлэг</Text>
        <Tip emoji="📧" title="И-мэйл үүсгэх" body="Gmail, e-Mongolia-д бүртгүүлэхэд хэрэгтэй" />
        <Tip emoji="🔒" title="Нууц үг хамгаалалт" body="Утас бусдад өгөхгүй, 2FA идэвхжүүлэх" />
        <Tip emoji="🏛️" title="E-Mongolia үйлчилгээ" body="Лавлагаа, бичиг цахим хэлбэрээр" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>💼 Нэмэлт мэргэжил</Text>
        <Tip emoji="🧶" title="Гар урлал" body="Эсгий, уран зураг, хатгамал" />
        <Tip emoji="🧀" title="Боловсруулалт" body="Цагаан идээ, мах, арьс" />
        <Tip emoji="🚗" title="Жолооны үнэмлэх" body="D ангилал — тээвэр" />
        <Tip emoji="💻" title="Дижитал маркетинг" body="Өөрийн бүтээгдэхүүнийг онлайн зарах" />
      </Card>
    </>
  );
}

function BusinessView() {
  return (
    <>
      <Card>
        <Text style={styles.cardTitle}>🚀 Малчнаас эхлэх бизнес санаа</Text>
        <BusinessIdea
          title="Гэр буудал"
          desc="Жуулчдад гэр түрээслэх, хоол өгөх"
          startup="~3-5 сая₮"
        />
        <BusinessIdea
          title="Цагаан идээ брэнд"
          desc="Ааруул, шар тос сав баглаа боодолтойгоор"
          startup="~1-2 сая₮"
        />
        <BusinessIdea
          title="Морин аялал"
          desc="Жуулчдад чиглэсэн 1-3 өдрийн аялал"
          startup="~2-4 сая₮"
        />
        <BusinessIdea
          title="Ноолуур боловсруулалт"
          desc="Самнасан ноолуур бэлтгэж борлуулах"
          startup="~1-3 сая₮"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>💰 Эхлэх мөнгөний эх үүсвэр</Text>
        <Tip emoji="🏛️" title="Хөдөлмөр эрхлэлтийг дэмжих сан" body="Бизнес эхлэх шууд зээл" />
        <Tip emoji="🏦" title="ХААН банк бичил зээл" body="Малчдад зориулсан" />
        <Tip emoji="🤝" title="Хоршоогоор нэгдэх" body="Хамтын хөрөнгө" />
      </Card>
    </>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function FeedItem({ title, body, emoji }: { title: string; body: string; emoji: string }) {
  return (
    <View style={styles.feedItem}>
      <Text style={styles.feedEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.feedTitle}>{title}</Text>
        <Text style={styles.feedBody}>{body}</Text>
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

function ScholarshipItem({ title, org, amount, deadline }: { title: string; org: string; amount: string; deadline: string }) {
  return (
    <View style={styles.scholarship}>
      <Text style={styles.schTitle}>{title}</Text>
      <View style={styles.schRow}>
        <Text style={styles.schKey}>🏛️ {org}</Text>
      </View>
      <View style={styles.schRow}>
        <Text style={styles.schKey}>💰 {amount}</Text>
      </View>
      <View style={styles.schRow}>
        <Text style={styles.schKey}>📅 Хугацаа: {deadline}</Text>
      </View>
    </View>
  );
}

function BusinessIdea({ title, desc, startup }: { title: string; desc: string; startup: string }) {
  return (
    <View style={styles.bizIdea}>
      <Text style={styles.bizTitle}>{title}</Text>
      <Text style={styles.bizDesc}>{desc}</Text>
      <Text style={styles.bizStart}>💵 Эхлэх: {startup}</Text>
    </View>
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
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: AppColors.white },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: AppColors.grayMedium, backgroundColor: AppColors.white,
    flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  tabEmoji: { fontSize: 16 },
  tabText: { fontSize: 13, color: AppColors.black, fontWeight: '600' },
  tabTextActive: { color: AppColors.white },
  body: { padding: 16 },
  card: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 12,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.05)',     elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, marginBottom: 10 },
  empty: { fontSize: 13, color: AppColors.gray, fontStyle: 'italic', marginBottom: 10 },
  addBtn: {
    paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: AppColors.grayLight },
  addBtnText: { color: AppColors.primary, fontSize: 13, fontWeight: '700' },
  feedItem: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 10,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight },
  feedEmoji: { fontSize: 24 },
  feedTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  feedBody: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 10 },
  tipEmoji: { fontSize: 22 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  tipBody: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  scholarship: {
    backgroundColor: '#F0FFF4', borderRadius: 10, padding: 12, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: AppColors.primary },
  schTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black, marginBottom: 6 },
  schRow: { marginTop: 3 },
  schKey: { fontSize: 12, color: AppColors.grayDark },
  bizIdea: {
    borderWidth: 1, borderColor: AppColors.grayLight, borderRadius: 10, padding: 12, marginBottom: 10 },
  bizTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  bizDesc: { fontSize: 12, color: AppColors.grayDark, marginTop: 4 },
  bizStart: { fontSize: 12, color: AppColors.primary, marginTop: 6, fontWeight: '700' } });
