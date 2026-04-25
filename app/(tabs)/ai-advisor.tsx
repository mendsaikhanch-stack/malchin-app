import React, { useState, useRef, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { aiApi, livestockApi } from '@/services/api';
import { useVoice, VoiceCommand } from '../../hooks/use-voice';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Mode = 'chat' | 'command';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
};

type CommandHistoryEntry = {
  id: number;
  raw_text: string;
  action: string;
  result: 'success' | 'error';
  message: string;
  timestamp: string;
};

// ---------------------------------------------------------------------------
// Translation maps
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  event: 'Малын үйл явдал',
  health: 'Эрүүл мэнд',
  birth: 'Төллөлт',
  vaccination: 'Вакцинжуулалт',
  migration: 'Нүүдэл',
  grazing: 'Бэлчээрлэлт',
  unknown: 'Тодорхойгүй',
};

const ANIMAL_LABELS: Record<string, string> = {
  sheep: 'Хонь',
  goat: 'Ямаа',
  cattle: 'Үхэр',
  horse: 'Морь/Адуу',
  camel: 'Тэмээ',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  primaryGreen: '#2d5016',
  lightGreen: '#4a7c28',
  background: '#f5f7f0',
};

const quickQuestions = [
  'Хонины тураалд юу хийх вэ?',
  'Зудад бэлтгэх зөвлөгөө',
  'Малын эрүүл мэндийг хэрхэн шалгах вэ?',
  'Бэлчээрийн менежмент',
  'Ноос ямар үед ангилах вэ?',
];

const now = () =>
  new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIAdvisorScreen() {
  // Shared
  const [mode, setMode] = useState<Mode>('chat');

  // Chat mode state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: 'Сайн байна уу! Би таны малчны зөвлөгч. Мал аж ахуйн талаар ямар ч асуулт асуугаарай.',
      sender: 'ai',
      timestamp: now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Command mode state
  const { parseCommand, getSuggestions } = useVoice();
  const [commandInput, setCommandInput] = useState('');
  const [parsedCommand, setParsedCommand] = useState<VoiceCommand | null>(null);
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const commandScrollRef = useRef<ScrollView>(null);

  // -----------------------------------------------------------------------
  // Chat mode logic (unchanged)
  // -----------------------------------------------------------------------

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || chatLoading) return;

      const userMsg: Message = {
        id: Date.now(),
        text: text.trim(),
        sender: 'user',
        timestamp: now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setChatInput('');
      setChatLoading(true);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const res = await aiApi.ask(text.trim());
        const aiMsg: Message = {
          id: Date.now() + 1,
          text: res.answer || 'Уучлаарай, хариулт олдсонгүй.',
          sender: 'ai',
          timestamp: now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: 'Алдаа гарлаа. Интернет холболтоо шалгана уу.',
            sender: 'ai',
            timestamp: now(),
          },
        ]);
      } finally {
        setChatLoading(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [chatLoading],
  );

  // -----------------------------------------------------------------------
  // Command mode logic
  // -----------------------------------------------------------------------

  const handleParse = useCallback(() => {
    if (!commandInput.trim()) return;
    const result = parseCommand(commandInput.trim());
    setParsedCommand(result);
  }, [commandInput, parseCommand]);

  const handleCancel = useCallback(() => {
    setParsedCommand(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!parsedCommand) return;
    setCommandLoading(true);

    let resultMessage = '';
    let resultStatus: 'success' | 'error' = 'success';

    try {
      switch (parsedCommand.action) {
        case 'event':
          await livestockApi.addEvent({
            user_id: 1,
            animal_type: parsedCommand.animal_type || 'sheep',
            event_type: parsedCommand.event_type || 'other',
            quantity: parsedCommand.count || 1,
            note: parsedCommand.raw_text,
          });
          resultMessage = 'Малын үйл явдал амжилттай бүртгэгдлээ!';
          break;
        case 'health':
          resultMessage = 'Эрүүл мэнд дэлгэц рүү очно уу';
          break;
        case 'birth':
          resultMessage = 'Төллөлт дэлгэц рүү очно уу';
          break;
        case 'vaccination':
          resultMessage = 'Вакцин дэлгэц рүү очно уу';
          break;
        case 'migration':
        case 'grazing':
          resultMessage = 'Бэлчээр дэлгэц рүү очно уу';
          break;
        default:
          resultMessage = 'Тодорхойгүй команд. Дахин оролдоно уу.';
          resultStatus = 'error';
      }
    } catch {
      resultMessage = 'Алдаа гарлаа. Интернет холболтоо шалгана уу.';
      resultStatus = 'error';
    }

    // Add to history (keep last 5)
    const entry: CommandHistoryEntry = {
      id: Date.now(),
      raw_text: parsedCommand.raw_text,
      action: parsedCommand.action,
      result: resultStatus,
      message: resultMessage,
      timestamp: now(),
    };
    setCommandHistory((prev) => [entry, ...prev].slice(0, 5));

    // Show toast
    Alert.alert(
      resultStatus === 'success' ? 'Амжилттай' : 'Алдаа',
      resultMessage,
    );

    setParsedCommand(null);
    setCommandInput('');
    setCommandLoading(false);
  }, [parsedCommand]);

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const suggestions = getSuggestions();

  const renderModeToggle = () => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[styles.toggleBtn, mode === 'chat' && styles.toggleBtnActive]}
        onPress={() => setMode('chat')}
        activeOpacity={0.7}
      >
        <Text style={[styles.toggleBtnText, mode === 'chat' && styles.toggleBtnTextActive]}>
          {'💬 Асуулт'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleBtn, mode === 'command' && styles.toggleBtnActive]}
        onPress={() => setMode('command')}
        activeOpacity={0.7}
      >
        <Text style={[styles.toggleBtnText, mode === 'command' && styles.toggleBtnTextActive]}>
          {'🎤 Команд'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderParsedCard = () => {
    if (!parsedCommand) return null;
    const pct = Math.round(parsedCommand.confidence * 100);
    const canConfirm = parsedCommand.confidence > 0.5;

    return (
      <View style={styles.parsedCard}>
        <Text style={styles.parsedTitle}>Задалсан үр дүн</Text>

        <View style={styles.parsedRow}>
          <Text style={styles.parsedLabel}>Үйлдэл:</Text>
          <Text style={styles.parsedValue}>
            {ACTION_LABELS[parsedCommand.action] || parsedCommand.action}
          </Text>
        </View>

        {parsedCommand.animal_type && (
          <View style={styles.parsedRow}>
            <Text style={styles.parsedLabel}>Малын төрөл:</Text>
            <Text style={styles.parsedValue}>
              {ANIMAL_LABELS[parsedCommand.animal_type] || parsedCommand.animal_type}
            </Text>
          </View>
        )}

        {parsedCommand.count !== undefined && (
          <View style={styles.parsedRow}>
            <Text style={styles.parsedLabel}>Тоо:</Text>
            <Text style={styles.parsedValue}>{parsedCommand.count}</Text>
          </View>
        )}

        {(parsedCommand.event_type || parsedCommand.location) && (
          <View style={styles.parsedRow}>
            <Text style={styles.parsedLabel}>Нэмэлт:</Text>
            <Text style={styles.parsedValue}>
              {[parsedCommand.event_type, parsedCommand.location].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.parsedRow}>
          <Text style={styles.parsedLabel}>Итгэлцүүр:</Text>
          <Text
            style={[
              styles.parsedValue,
              { color: canConfirm ? COLORS.lightGreen : AppColors.danger },
            ]}
          >
            {pct}%
          </Text>
        </View>

        {canConfirm ? (
          <View style={styles.confirmRow}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              disabled={commandLoading}
              activeOpacity={0.7}
            >
              {commandLoading ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <Text style={styles.confirmBtnText}>Баталгаажуулах</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={commandLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Болих</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.lowConfidenceText}>
            Итгэлцүүр хангалтгүй байна. Командаа дахин оруулна уу.
          </Text>
        )}
      </View>
    );
  };

  const renderCommandHistory = () => {
    if (commandHistory.length === 0) return null;

    return (
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Сүүлийн командууд</Text>
        {commandHistory.map((entry) => (
          <View key={entry.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyCommand}>{entry.raw_text}</Text>
              <Text style={styles.historyTime}>{entry.timestamp}</Text>
            </View>
            <View style={styles.historyResult}>
              <View
                style={[
                  styles.historyDot,
                  { backgroundColor: entry.result === 'success' ? COLORS.lightGreen : AppColors.danger },
                ]}
              />
              <Text style={styles.historyMessage}>{entry.message}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // -----------------------------------------------------------------------
  // Chat mode render
  // -----------------------------------------------------------------------

  const renderChatMode = () => (
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
            {msg.sender === 'ai' && <Text style={styles.aiAvatar}>{'🤖'}</Text>}
            <View
              style={[
                styles.bubbleContent,
                msg.sender === 'user' ? styles.userContent : styles.aiContent,
              ]}
            >
              <Text style={[styles.messageText, msg.sender === 'user' && styles.userMessageText]}>
                {msg.text}
              </Text>
              <Text style={[styles.timestamp, msg.sender === 'user' && styles.userTimestamp]}>
                {msg.timestamp}
              </Text>
            </View>
          </View>
        ))}

        {chatLoading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <Text style={styles.aiAvatar}>{'🤖'}</Text>
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
          value={chatInput}
          onChangeText={setChatInput}
          placeholder="Асуултаа бичнэ үү..."
          placeholderTextColor={AppColors.gray}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage(chatInput)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!chatInput.trim() || chatLoading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(chatInput)}
          disabled={!chatInput.trim() || chatLoading}
        >
          <Text style={styles.sendBtnText}>{'➤'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // -----------------------------------------------------------------------
  // Command mode render
  // -----------------------------------------------------------------------

  const renderCommandMode = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={commandScrollRef}
        style={styles.commandScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input area */}
        <View style={styles.commandInputSection}>
          <Text style={styles.commandSectionLabel}>Команд оруулах</Text>
          <TextInput
            style={styles.commandInput}
            value={commandInput}
            onChangeText={(t) => {
              setCommandInput(t);
              if (parsedCommand) setParsedCommand(null);
            }}
            placeholder="Жишээ: 23 хонь туулгалаа"
            placeholderTextColor={AppColors.gray}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[
              styles.executeBtn,
              !commandInput.trim() && styles.executeBtnDisabled,
            ]}
            onPress={handleParse}
            disabled={!commandInput.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.executeBtnText}>Гүйцэтгэх</Text>
          </TouchableOpacity>
        </View>

        {/* Suggestion chips */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsLabel}>Жишээ командууд:</Text>
          <View style={styles.chipsContainer}>
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.chip}
                onPress={() => {
                  setCommandInput(s);
                  setParsedCommand(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Parsed result */}
        {renderParsedCard()}

        {/* Command history */}
        {renderCommandHistory()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{'🤖'} Ухаалаг Зөвлөгч</Text>
        <Text style={styles.subtitle}>Мал аж ахуйн мэргэжлийн зөвлөгөө</Text>
      </View>

      {renderModeToggle()}

      {mode === 'chat' ? renderChatMode() : renderCommandMode()}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayMedium,
  },
  title: { fontSize: 24, fontWeight: '800', color: AppColors.black },
  subtitle: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },

  // Mode toggle
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: AppColors.grayLight,
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primaryGreen,
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.grayDark,
  },
  toggleBtnTextActive: {
    color: AppColors.white,
  },

  // Chat mode
  chatContainer: { flex: 1 },
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  quickSection: { marginTop: 16, marginBottom: 8 },
  quickTitle: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark, marginBottom: 8 },
  quickBtn: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: AppColors.grayMedium,
  },
  quickBtnText: { fontSize: 14, color: COLORS.primaryGreen, fontWeight: '500' },
  messageBubble: { flexDirection: 'row', marginTop: 12, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { fontSize: 24, marginRight: 8, marginBottom: 4 },
  bubbleContent: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  userContent: { backgroundColor: COLORS.primaryGreen, borderBottomRightRadius: 4 },
  aiContent: {
    backgroundColor: AppColors.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: { fontSize: 15, color: AppColors.black, lineHeight: 22 },
  userMessageText: { color: AppColors.white },
  timestamp: { fontSize: 10, color: AppColors.gray, marginTop: 4 },
  userTimestamp: { color: 'rgba(255,255,255,0.7)' },
  typingText: { fontSize: 13, color: AppColors.gray, marginTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayMedium,
    backgroundColor: AppColors.white,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: AppColors.black,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: AppColors.grayMedium },
  sendBtnText: { fontSize: 18, color: AppColors.white },

  // Command mode
  commandScroll: { flex: 1, paddingHorizontal: 16 },
  commandInputSection: { marginTop: 16 },
  commandSectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryGreen,
    marginBottom: 8,
  },
  commandInput: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    color: AppColors.black,
  },
  executeBtn: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  executeBtnDisabled: {
    backgroundColor: AppColors.grayMedium,
  },
  executeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.white,
  },

  // Suggestion chips
  suggestionsSection: { marginTop: 20 },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGreen,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.primaryGreen,
    fontWeight: '500',
  },

  // Parsed result card
  parsedCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  parsedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryGreen,
    marginBottom: 12,
  },
  parsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  parsedLabel: {
    fontSize: 14,
    color: AppColors.grayDark,
    fontWeight: '500',
  },
  parsedValue: {
    fontSize: 14,
    color: AppColors.black,
    fontWeight: '600',
  },
  confirmRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.lightGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.white,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: AppColors.grayLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.grayMedium,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.grayDark,
  },
  lowConfidenceText: {
    fontSize: 13,
    color: AppColors.danger,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Command history
  historySection: { marginTop: 24 },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryGreen,
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.grayMedium,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyCommand: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.black,
    flex: 1,
    marginRight: 8,
  },
  historyTime: {
    fontSize: 11,
    color: AppColors.gray,
  },
  historyResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  historyMessage: {
    fontSize: 13,
    color: AppColors.grayDark,
    flex: 1,
  },
});
