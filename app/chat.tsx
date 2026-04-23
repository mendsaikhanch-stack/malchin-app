import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

type Channel = {
  id: string;
  type: 'bag' | 'sum' | 'coop' | 'service' | 'direct';
  name: string;
  emoji: string;
  unread: number;
  lastMsg: string;
  lastTime: string;
  priority?: boolean;
};

type Message = {
  id: string;
  channelId: string;
  from: string;
  body: string;
  time: string;
  mine: boolean;
  priority?: boolean;
};

const MOCK_CHANNELS: Channel[] = [
  { id: '1', type: 'sum', name: 'Сумын мэдэгдэл', emoji: '🏛️', unread: 2, lastMsg: 'Тооллого 4-р сарын 25-28', lastTime: '10:30', priority: true },
  { id: '2', type: 'bag', name: '3-р багийн групп', emoji: '👥', unread: 5, lastMsg: 'Дорж: Баяр нэр аваачих уу?', lastTime: '09:15' },
  { id: '3', type: 'coop', name: 'Ноолуурын хоршоо', emoji: '🤝', unread: 0, lastMsg: 'Захиалга цуглуулж эхлэв', lastTime: 'Өчигдөр' },
  { id: '4', type: 'service', name: 'Мал эмч — Баатар', emoji: '🩺', unread: 1, lastMsg: 'Вакцин хэзээ ирэх вэ?', lastTime: '08:00' },
  { id: '5', type: 'direct', name: 'Багийн дарга — Дорж', emoji: '💬', unread: 0, lastMsg: 'За ойлголоо', lastTime: '2 өдрийн өмнө' },
];

const MOCK_MESSAGES: Message[] = [
  { id: '1', channelId: '1', from: 'Сумын захиргаа', body: 'Сайн байна уу! 4-р сарын 25-28-нд 3-р багт мал тоолох ажил явна.', time: '10:00', mine: false, priority: true },
  { id: '2', channelId: '1', from: 'Сумын захиргаа', body: 'Бүх өрх заавал оролцоно уу. Баталгаажуулалт шаардлагатай.', time: '10:30', mine: false, priority: true },
  { id: '3', channelId: '2', from: 'Дорж (баг дарга)', body: 'Өнөөдөр хурал байх. 17:00 цагт багийн төвд.', time: '08:00', mine: false },
  { id: '4', channelId: '2', from: 'Батбаяр', body: 'Очно оо.', time: '08:15', mine: true },
  { id: '5', channelId: '2', from: 'Оюунтуяа', body: 'Би боломжгүй шүү, хүүхэд өвчтэй.', time: '08:20', mine: false },
  { id: '6', channelId: '2', from: 'Дорж (баг дарга)', body: 'Тэгвэл утсаар холбогдвол тусна', time: '09:15', mine: false },
];

export default function Chat() {
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [draft, setDraft] = useState('');

  const channelMessages = activeChannel
    ? messages.filter((m) => m.channelId === activeChannel.id)
    : [];

  const send = () => {
    if (!draft.trim() || !activeChannel) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        channelId: activeChannel.id,
        from: 'Би',
        body: draft.trim(),
        time,
        mine: true,
      },
    ]);
    setDraft('');
  };

  if (activeChannel) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveChannel(null)} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.channelEmoji}>{activeChannel.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{activeChannel.name}</Text>
            <Text style={styles.headerSubtitle}>
              {activeChannel.type === 'sum' ? 'Албан мэдэгдэл' :
                activeChannel.type === 'bag' ? 'Багийн бүх гишүүн' :
                activeChannel.type === 'coop' ? 'Хоршооны гишүүд' :
                activeChannel.type === 'service' ? 'Үйлчилгээ үзүүлэгч' : 'Хувийн'}
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.messages}>
            {channelMessages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  m.mine ? styles.bubbleMine : styles.bubbleOther,
                  m.priority && styles.bubblePriority,
                ]}
              >
                {!m.mine && <Text style={styles.msgFrom}>{m.from}</Text>}
                {m.priority && <Text style={styles.priorityTag}>🔔 Яаралтай</Text>}
                <Text style={[styles.msgBody, m.mine && styles.msgBodyMine]}>{m.body}</Text>
                <Text style={[styles.msgTime, m.mine && styles.msgTimeMine]}>{m.time}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => Alert.alert('Удахгүй', 'Зураг/дуут мессеж Phase 2-д')}
            >
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Бичих..."
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Чат</Text>
          <Text style={styles.headerSubtitle}>Сум, баг, хоршоо, үйлчилгээ</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {MOCK_CHANNELS.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.channelRow}
            onPress={() => setActiveChannel(c)}
          >
            <View style={[styles.channelIcon, c.priority && styles.channelIconPriority]}>
              <Text style={styles.channelEmoji}>{c.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.channelRowTop}>
                <Text style={styles.channelName}>{c.name}</Text>
                <Text style={styles.channelTime}>{c.lastTime}</Text>
              </View>
              <View style={styles.channelRowBottom}>
                <Text style={styles.channelLast} numberOfLines={1}>
                  {c.lastMsg}
                </Text>
                {c.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{c.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            💡 Chat функц Phase 2-д бодитоор backend-тэй холбогдоно. Одоогоор зөвхөн харуулах.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 8,
    backgroundColor: AppColors.white, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: AppColors.black, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black },
  headerSubtitle: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  list: { padding: 12 },
  channelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: AppColors.white, borderRadius: 14, padding: 12, marginBottom: 8,
  },
  channelIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0FFF4',
    alignItems: 'center', justifyContent: 'center',
  },
  channelIconPriority: { backgroundColor: '#FFEBEE' },
  channelEmoji: { fontSize: 24 },
  channelRowTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  channelName: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  channelTime: { fontSize: 11, color: AppColors.gray },
  channelRowBottom: {
    flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8,
  },
  channelLast: { flex: 1, fontSize: 13, color: AppColors.grayDark },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: AppColors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadText: { color: AppColors.white, fontSize: 12, fontWeight: '700' },
  hint: {
    marginTop: 20, padding: 12, backgroundColor: '#FFFBEA', borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: AppColors.secondary,
  },
  hintText: { fontSize: 12, color: AppColors.grayDark, lineHeight: 18 },
  messages: { padding: 12, gap: 8 },
  bubble: {
    maxWidth: '80%', padding: 10, borderRadius: 14,
  },
  bubbleMine: {
    alignSelf: 'flex-end', backgroundColor: AppColors.primary, borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start', backgroundColor: AppColors.white, borderBottomLeftRadius: 4,
  },
  bubblePriority: { borderWidth: 2, borderColor: AppColors.danger },
  msgFrom: { fontSize: 11, color: AppColors.grayDark, fontWeight: '700', marginBottom: 4 },
  priorityTag: { fontSize: 10, color: AppColors.danger, fontWeight: '700', marginBottom: 4 },
  msgBody: { fontSize: 14, color: AppColors.black },
  msgBodyMine: { color: AppColors.white },
  msgTime: { fontSize: 10, color: AppColors.gray, marginTop: 4, textAlign: 'right' },
  msgTimeMine: { color: '#E8F5E9' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 8, gap: 8,
    backgroundColor: AppColors.white, borderTopWidth: 1, borderTopColor: AppColors.grayLight,
  },
  attachBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  attachIcon: { fontSize: 22 },
  chatInput: {
    flex: 1, minHeight: 40, maxHeight: 100, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#F8F9FA', borderRadius: 20, fontSize: 15,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: AppColors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { color: AppColors.white, fontSize: 18, fontWeight: '700' },
});
