import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppColors } from '@/constants/theme';
import { aiApi } from '@/services/api';

const animalTypes = [
  { key: 'sheep', label: 'Хонь', emoji: '\uD83D\uDC11' },
  { key: 'goat', label: 'Ямаа', emoji: '\uD83D\uDC10' },
  { key: 'cattle', label: 'Үхэр', emoji: '\uD83D\uDC02' },
  { key: 'horse', label: 'Адуу', emoji: '\uD83D\uDC0E' },
  { key: 'camel', label: 'Тэмээ', emoji: '\uD83D\uDC2A' },
];

// Малын төрөл бүрийн тусгай шинж тэмдэг
const symptomsByAnimal: Record<string, { key: string; label: string; emoji: string }[]> = {
  sheep: [
    { key: 'fever', label: 'Халуурах', emoji: '\uD83C\uDF21\uFE0F' },
    { key: 'mouth_sore', label: 'Ам шарх', emoji: '\uD83D\uDC44' },
    { key: 'hoof', label: 'Туурай өвдөх', emoji: '\uD83E\uDDBF' },
    { key: 'drool', label: 'Шүлс гоожих', emoji: '\uD83D\uDCA7' },
    { key: 'skin', label: 'Арьсны тууралт', emoji: '\uD83E\uDE79' },
    { key: 'diarrhea', label: 'Суулгах', emoji: '\uD83D\uDCA9' },
    { key: 'wool_loss', label: 'Ноос унах', emoji: '\u2702\uFE0F' },
    { key: 'scratch', label: 'Маажих', emoji: '\uD83D\uDC3E' },
    { key: 'dizzy', label: 'Толгой эргэх', emoji: '\uD83D\uDE35\u200D\uD83D\uDCAB' },
    { key: 'abort', label: 'Хээл хаях', emoji: '\u26A0\uFE0F' },
    { key: 'weak', label: 'Сулдах/турах', emoji: '\uD83D\uDE34' },
    { key: 'appetite', label: 'Хоол иддэггүй', emoji: '\uD83D\uDEAB' },
  ],
  goat: [
    { key: 'fever', label: 'Халуурах', emoji: '\uD83C\uDF21\uFE0F' },
    { key: 'nose', label: 'Хамар шүүрэл', emoji: '\uD83D\uDCA7' },
    { key: 'mouth_sore', label: 'Ам шарх', emoji: '\uD83D\uDC44' },
    { key: 'bloody_diarrhea', label: 'Цус суулгах', emoji: '\uD83E\uDE78' },
    { key: 'diarrhea', label: 'Суулгах', emoji: '\uD83D\uDCA9' },
    { key: 'skin', label: 'Арьсны товруу', emoji: '\uD83E\uDE79' },
    { key: 'eye', label: 'Нүд хавдах', emoji: '\uD83D\uDC41\uFE0F' },
    { key: 'sudden_death', label: 'Гэнэт унах', emoji: '\u2620\uFE0F' },
    { key: 'bloat', label: 'Гэдэс дүүрэх', emoji: '\uD83C\uDF88' },
    { key: 'pale', label: 'Нүд/буйл цайх', emoji: '\uD83E\uDEE5' },
    { key: 'weak', label: 'Турах', emoji: '\uD83D\uDE34' },
    { key: 'appetite', label: 'Хоол иддэггүй', emoji: '\uD83D\uDEAB' },
  ],
  cattle: [
    { key: 'fever', label: 'Халуурах', emoji: '\uD83C\uDF21\uFE0F' },
    { key: 'cough', label: 'Ханиалгах', emoji: '\uD83E\uDD27' },
    { key: 'red_urine', label: 'Улаан шээс', emoji: '\uD83E\uDE78' },
    { key: 'udder', label: 'Дэлэнг хавдах', emoji: '\uD83E\uDD5B' },
    { key: 'milk_drop', label: 'Сүү буурах', emoji: '\uD83D\uDCC9' },
    { key: 'abort', label: 'Хээл хаях', emoji: '\u26A0\uFE0F' },
    { key: 'mouth_sore', label: 'Ам шарх', emoji: '\uD83D\uDC44' },
    { key: 'limp', label: 'Доголонтох', emoji: '\uD83E\uDDBF' },
    { key: 'diarrhea', label: 'Суулгах', emoji: '\uD83D\uDCA9' },
    { key: 'weak', label: 'Турах', emoji: '\uD83D\uDE34' },
    { key: 'lymph', label: 'Булчирхай томрох', emoji: '\uD83D\uDD34' },
    { key: 'appetite', label: 'Хоол иддэггүй', emoji: '\uD83D\uDEAB' },
  ],
  horse: [
    { key: 'fever', label: 'Халуурах', emoji: '\uD83C\uDF21\uFE0F' },
    { key: 'cough', label: 'Ханиалгах', emoji: '\uD83E\uDD27' },
    { key: 'nose_discharge', label: 'Хамраас идээ', emoji: '\uD83E\uDD22' },
    { key: 'hoof_hot', label: 'Туурай халуун', emoji: '\uD83D\uDD25' },
    { key: 'limp', label: 'Доголонтох', emoji: '\uD83E\uDDBF' },
    { key: 'eye', label: 'Нүд нулимстай', emoji: '\uD83D\uDC41\uFE0F' },
    { key: 'skin_nodule', label: 'Арьсанд зангилаа', emoji: '\uD83D\uDD34' },
    { key: 'back_weak', label: 'Арын хөл сулдах', emoji: '\uD83E\uDDB5' },
    { key: 'weak', label: 'Турах', emoji: '\uD83D\uDE34' },
    { key: 'swelling', label: 'Хөлд хавдар', emoji: '\uD83C\uDF88' },
    { key: 'appetite', label: 'Хоол иддэггүй', emoji: '\uD83D\uDEAB' },
    { key: 'refuse_move', label: 'Хөдлөхгүй', emoji: '\uD83D\uDEAB' },
  ],
  camel: [
    { key: 'fever', label: 'Халуурах', emoji: '\uD83C\uDF21\uFE0F' },
    { key: 'hump', label: 'Бөх зулайрах', emoji: '\uD83D\uDCC9' },
    { key: 'skin', label: 'Арьсны товруу', emoji: '\uD83E\uDE79' },
    { key: 'eye', label: 'Нүд хавдах', emoji: '\uD83D\uDC41\uFE0F' },
    { key: 'back_weak', label: 'Арын хөл сулдах', emoji: '\uD83E\uDDB5' },
    { key: 'belly', label: 'Хэвлий хавдах', emoji: '\uD83C\uDF88' },
    { key: 'weak', label: 'Турах/сулдах', emoji: '\uD83D\uDE34' },
    { key: 'diarrhea', label: 'Суулгах', emoji: '\uD83D\uDCA9' },
    { key: 'appetite', label: 'Хоол иддэггүй', emoji: '\uD83D\uDEAB' },
    { key: 'mouth_sore', label: 'Ам шарх', emoji: '\uD83D\uDC44' },
  ],
};

const symptomTextMap: Record<string, string> = {
  fever: 'халуурах', mouth_sore: 'ам шарх', hoof: 'туурай өвдөх', drool: 'шүлс гоожих',
  skin: 'арьс тууралт', diarrhea: 'суулгах', wool_loss: 'ноос унах', scratch: 'маажих',
  dizzy: 'толгой эргэх', abort: 'хээл хаях', weak: 'сулдах турах', appetite: 'хоол иддэггүй',
  nose: 'хамар шүүрэл', bloody_diarrhea: 'цус суулгах', eye: 'нүд хавдах', sudden_death: 'гэнэт унах',
  bloat: 'гэдэс дүүрэх', pale: 'нүд цайх', cough: 'ханиалгах', red_urine: 'улаан шээс',
  udder: 'дэлэнг хавдах', milk_drop: 'сүү буурах', limp: 'доголонтох', lymph: 'булчирхай томрох',
  nose_discharge: 'хамраас идээ', hoof_hot: 'туурай халуун', skin_nodule: 'арьсанд зангилаа',
  back_weak: 'арын хөл сулдах', swelling: 'хөлд хавдар', refuse_move: 'хөдлөхгүй',
  hump: 'бөх зулайрах', belly: 'хэвлий хавдах',
};

const symptomText: Record<string, string> = {
  fever: 'халуурч байна', diarrhea: 'суулгаж байна', cough: 'ханиаж байна',
  limp: 'доголонтож байна', skin: 'арьсан дээр тууралт гарсан', eye: 'нүднээс нулимс гарч байна',
  appetite: 'хоол иддэггүй болсон', bloat: 'гэдэс хавдсан', nose: 'хамраас шүүрэл гарч байна',
  weak: 'сулдаж турж байна', breathing: 'амьсгал давчдаж байна', hair: 'үс/ноос унаж байна',
};

export default function DiagnoseScreen() {
  const [mode, setMode] = useState<'symptoms' | 'image'>('symptoms');
  const [selectedAnimal, setSelectedAnimal] = useState('sheep');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [extraDesc, setExtraDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultSource, setResultSource] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const toggleSymptom = (key: string) => {
    setSelectedSymptoms(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  const handleDiagnose = async () => {
    if (selectedSymptoms.length === 0 && !extraDesc.trim()) {
      Alert.alert('Алдаа', 'Шинж тэмдэг сонгоно уу');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const symptomsStr = selectedSymptoms.map(s => symptomTextMap[s] || symptomText[s] || s).join(', ');
      const animalLabel = animalTypes.find(a => a.key === selectedAnimal)?.label || selectedAnimal;
      const res = await aiApi.diagnose({
        animal_type: animalLabel,
        symptoms: symptomsStr,
        age: age || undefined,
        description: extraDesc.trim() || undefined,
      });
      setResult(res.diagnosis);
      setResultSource(res.source);
    } catch {
      Alert.alert('Алдаа', 'Оношлоход алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Зөвшөөрөл', 'Камер ашиглах зөвшөөрөл шаардлагатай');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.5,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      if (result.assets[0].base64) {
        handleImageDiagnose(result.assets[0].base64);
      }
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Зөвшөөрөл', 'Зургийн санд хандах зөвшөөрөл шаардлагатай');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.5,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      if (result.assets[0].base64) {
        handleImageDiagnose(result.assets[0].base64);
      }
    }
  };

  const handleImageDiagnose = async (base64: string) => {
    setLoading(true);
    setResult(null);
    try {
      const animalLabel = animalTypes.find(a => a.key === selectedAnimal)?.label || selectedAnimal;
      const res = await aiApi.diagnoseImage({
        image_base64: base64,
        animal_type: animalLabel,
        description: extraDesc.trim() || undefined,
      });
      setResult(res.diagnosis);
      setResultSource(res.source);
    } catch {
      Alert.alert('Алдаа', 'Зураг оношлоход алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setSelectedSymptoms([]);
    setExtraDesc('');
    setAge('');
    setResult(null);
    setSelectedImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{'\uD83E\uDE7A'} Мал өвчин оношлогч</Text>
          <Text style={styles.subtitle}>Ухаалаг технологид суурилсан оношлогоо</Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity style={[styles.modeBtn, mode === 'symptoms' && styles.modeBtnActive]} onPress={() => setMode('symptoms')}>
            <Text style={[styles.modeBtnText, mode === 'symptoms' && styles.modeBtnTextActive]}>{'\uD83D\uDCCB'} Шинж тэмдэгээр</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'image' && styles.modeBtnActive]} onPress={() => setMode('image')}>
            <Text style={[styles.modeBtnText, mode === 'image' && styles.modeBtnTextActive]}>{'\uD83D\uDCF7'} Зургаар</Text>
          </TouchableOpacity>
        </View>

        {/* Малын төрөл */}
        <Text style={styles.sectionTitle}>Малын төрөл</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.animalRow}>
          {animalTypes.map((a) => (
            <TouchableOpacity key={a.key} style={[styles.animalBtn, selectedAnimal === a.key && styles.animalBtnActive]} onPress={() => { setSelectedAnimal(a.key); setSelectedSymptoms([]); setResult(null); }}>
              <Text style={styles.animalEmoji}>{a.emoji}</Text>
              <Text style={[styles.animalLabel, selectedAnimal === a.key && styles.animalLabelActive]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {mode === 'symptoms' ? (
          <>
            {/* Шинж тэмдэг - малын төрлөөс хамаарна */}
            <Text style={styles.sectionTitle}>{animalTypes.find(a => a.key === selectedAnimal)?.emoji} {animalTypes.find(a => a.key === selectedAnimal)?.label || ''}-ны шинж тэмдэг</Text>
            <View style={styles.symptomGrid}>
              {(symptomsByAnimal[selectedAnimal] || []).map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.symptomBtn, selectedSymptoms.includes(s.key) && styles.symptomBtnActive]}
                  onPress={() => toggleSymptom(s.key)}
                >
                  <Text style={styles.symptomEmoji}>{s.emoji}</Text>
                  <Text style={[styles.symptomLabel, selectedSymptoms.includes(s.key) && styles.symptomLabelActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Нас */}
            <Text style={styles.sectionTitle}>Нас (заавал биш)</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Жнь: 2 настай, хурга" placeholderTextColor={AppColors.gray} />

            {/* Нэмэлт тайлбар */}
            <Text style={styles.sectionTitle}>Нэмэлт тайлбар</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={extraDesc} onChangeText={setExtraDesc} placeholder="Хэзээнээс эхэлсэн, бусад мал өвдсөн эсэх..." placeholderTextColor={AppColors.gray} multiline />

            {/* Оношлох товч */}
            <TouchableOpacity style={[styles.diagnoseBtn, loading && { opacity: 0.7 }]} onPress={handleDiagnose} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.diagnoseBtnText}>{'\uD83E\uDE7A'} Оношлох</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Зургаар оношлох */}
            <Text style={styles.sectionTitle}>Малын зураг оруулах</Text>
            <Text style={styles.hintText}>Өвчний шинж тэмдэг харагдахаар ойроос зурагдарна уу</Text>

            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                <Text style={styles.cameraBtnEmoji}>{'\uD83D\uDCF7'}</Text>
                <Text style={styles.cameraBtnText}>Зураг авах</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
                <Text style={styles.cameraBtnEmoji}>{'\uD83D\uDDBC\uFE0F'}</Text>
                <Text style={styles.cameraBtnText}>Зургийн сан</Text>
              </TouchableOpacity>
            </View>

            {selectedImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              </View>
            )}

            <Text style={styles.sectionTitle}>Нэмэлт тайлбар</Text>
            <TextInput style={[styles.input, { height: 60 }]} value={extraDesc} onChangeText={setExtraDesc} placeholder="Юу анзаарсан бэ..." placeholderTextColor={AppColors.gray} multiline />

            {loading && (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={AppColors.primary} />
                <Text style={styles.loadingText}>Ухаалаг систем зургийг шинжилж байна...</Text>
              </View>
            )}
          </>
        )}

        {/* Оношлогооны үр дүн */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{'\uD83E\uDE7A'} Оношлогоо</Text>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText}>{resultSource === 'ai' || resultSource === 'ai_vision' ? 'Ухаалаг' : 'Мэдлэгийн сан'}</Text>
              </View>
            </View>
            <Text style={styles.resultText}>{result}</Text>
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                {'\u26A0\uFE0F'} Энэ оношлогоо нь зөвхөн урьдчилсан зөвлөмж юм. Малын мэргэжлийн эмчид заавал үзүүлнэ үү.
              </Text>
            </View>
          </View>
        )}

        {/* Дахин оношлох */}
        {result && (
          <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
            <Text style={styles.resetBtnText}>{'\uD83D\uDD04'} Дахин оношлох</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.black },
  subtitle: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  // Mode toggle
  modeToggle: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: '#EEEEEE', borderRadius: 12, padding: 3 },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: AppColors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  modeBtnTextActive: { color: AppColors.primary, fontWeight: '700' },
  // Sections
  sectionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  hintText: { fontSize: 12, color: AppColors.gray, paddingHorizontal: 20, marginBottom: 8 },
  // Animal
  animalRow: { paddingHorizontal: 16, gap: 10 },
  animalBtn: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: AppColors.white, borderWidth: 1.5, borderColor: AppColors.grayMedium },
  animalBtnActive: { borderColor: AppColors.primary, backgroundColor: '#E8F5E9' },
  animalEmoji: { fontSize: 28 },
  animalLabel: { fontSize: 11, fontWeight: '600', color: AppColors.grayDark, marginTop: 4 },
  animalLabelActive: { color: AppColors.primary },
  // Symptoms
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  symptomBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: AppColors.white, borderWidth: 1.5, borderColor: AppColors.grayMedium },
  symptomBtnActive: { borderColor: AppColors.danger, backgroundColor: '#FFEBEE' },
  symptomEmoji: { fontSize: 16, marginRight: 6 },
  symptomLabel: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  symptomLabelActive: { color: AppColors.danger },
  // Input
  input: { marginHorizontal: 16, borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, fontSize: 14, color: AppColors.black, backgroundColor: AppColors.white },
  // Diagnose button
  diagnoseBtn: { marginHorizontal: 16, marginTop: 20, backgroundColor: AppColors.danger, padding: 16, borderRadius: 14, alignItems: 'center' },
  diagnoseBtnText: { color: AppColors.white, fontSize: 16, fontWeight: '800' },
  // Image
  imageActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  cameraBtn: { flex: 1, backgroundColor: AppColors.primary, borderRadius: 14, padding: 20, alignItems: 'center' },
  galleryBtn: { flex: 1, backgroundColor: AppColors.accent, borderRadius: 14, padding: 20, alignItems: 'center' },
  cameraBtnEmoji: { fontSize: 32 },
  cameraBtnText: { color: AppColors.white, fontSize: 13, fontWeight: '700', marginTop: 6 },
  imagePreview: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, borderRadius: 14 },
  loadingCard: { marginHorizontal: 16, marginTop: 16, padding: 24, backgroundColor: AppColors.white, borderRadius: 14, alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: AppColors.grayDark },
  // Result
  resultCard: { marginHorizontal: 16, marginTop: 20, backgroundColor: AppColors.white, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#E8F5E9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultTitle: { fontSize: 17, fontWeight: '800', color: AppColors.black },
  sourceBadge: { backgroundColor: AppColors.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  sourceText: { color: AppColors.white, fontSize: 11, fontWeight: '700' },
  resultText: { fontSize: 14, color: AppColors.black, lineHeight: 22 },
  disclaimer: { marginTop: 12, padding: 10, backgroundColor: '#FFF3E0', borderRadius: 8 },
  disclaimerText: { fontSize: 11, color: '#E65100', lineHeight: 16 },
  // Reset
  resetBtn: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark },
});
