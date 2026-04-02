import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { aiApi } from '@/services/api';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
};

const quickQuestions = [
  'Хонины тураалд юу хийх вэ?',
  'Зудад бэлтгэх зөвлөгөө',
  'Малын эрүүл мэндийг хэрхэн шалгах вэ?',
  'Бэлчээрийн менежмент',
  'Ноос ямар үед ангилах вэ?',
];

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: 'Сайн байна уу! Би таны малчны зөвлөгч. Мал аж ахуйн талаар ямар ч асуулт асуугаарай.',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await aiApi.ask(text.trim());
      const aiMsg: Message = {
        id: Date.now() + 1,
        text: res.answer || 'Уучлаарай, хариулт олдсонгүй.',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: 'Алдаа гарлаа. Интернет холболтоо шалгана уу.',
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{'\uD83E\uDD16'} AI Зөвлөгч</Text>
        <Text style={styles.subtitle}>Мал аж ахуйн мэргэжлийн зөвлөгөө</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Quick questions */}
          {messages.length <= 1 && (
            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>Түгээмэл асуултууд:</Text>
              {quickQuestions.map((q, i) => (
                <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => sendMessage(q)}>
                  <Text style={styles.quickBtnText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {msg.sender === 'ai' && <Text style={styles.aiAvatar}>{'\uD83E\uDD16'}</Text>}
              <View style={[styles.bubbleContent, msg.sender === 'user' ? styles.userContent : styles.aiContent]}>
                <Text style={[styles.messageText, msg.sender === 'user' && styles.userMessageText]}>
                  {msg.text}
                </Text>
                <Text style={[styles.timestamp, msg.sender === 'user' && styles.userTimestamp]}>
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={styles.aiAvatar}>{'\uD83E\uDD16'}</Text>
              <View style={[styles.bubbleContent, styles.aiContent]}>
                <ActivityIndicator size="small" color={AppColors.primary} />
                <Text style={styles.typingText}>Бодож байна...</Text>
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Асуултаа бичнэ үү..."
            placeholderTextColor={AppColors.gray}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>{'\u27A4'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: AppColors.grayMedium },
  title: { fontSize: 24, fontWeight: '800', color: AppColors.black },
  subtitle: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  chatContainer: { flex: 1 },
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  quickSection: { marginTop: 16, marginBottom: 8 },
  quickTitle: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark, marginBottom: 8 },
  quickBtn: {
    backgroundColor: AppColors.white, borderRadius: 12, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: AppColors.grayMedium,
  },
  quickBtnText: { fontSize: 14, color: AppColors.primary, fontWeight: '500' },
  messageBubble: { flexDirection: 'row', marginTop: 12, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { fontSize: 24, marginRight: 8, marginBottom: 4 },
  bubbleContent: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  userContent: { backgroundColor: AppColors.primary, borderBottomRightRadius: 4 },
  aiContent: { backgroundColor: AppColors.white, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  messageText: { fontSize: 15, color: AppColors.black, lineHeight: 22 },
  userMessageText: { color: AppColors.white },
  timestamp: { fontSize: 10, color: AppColors.gray, marginTop: 4 },
  userTimestamp: { color: 'rgba(255,255,255,0.7)' },
  typingText: { fontSize: 13, color: AppColors.gray, marginTop: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: AppColors.grayMedium, backgroundColor: AppColors.white,
  },
  input: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, maxHeight: 100, color: AppColors.black,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: AppColors.primary,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: AppColors.grayMedium },
  sendBtnText: { fontSize: 18, color: AppColors.white },
});
