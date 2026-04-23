import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const pages = [
  {
    emoji: '🐑🐎🐪',
    title: 'МАЛЧИН',
    description:
      'Хөдөөгийн ухаалаг туслах\n\nМалаа бүртгэх, эрүүл мэндийг хянах, цаг агаар, зах зээлийн мэдээлэл авах бүгдийг нэг аппаар.',
  },
  {
    emoji: '📋',
    title: 'Малаа бүртгэ',
    description:
      'Нэг бүрчлэн бүртгэж, эрүүл мэнд, үржил, бэлчээрийн мэдээлэл хөтөл. Ээмэг сканнердаж хурдан бүртгэл хийгээрэй.',
  },
  {
    emoji: '📊',
    title: 'Зах зээлийн мэдээлэл',
    description:
      'Бодит цагийн ханш, түүхий эдийн үнэ, зар нийтлэх. Малын бүтээгдэхүүний үнийг хянаж, ашигтай худалдаа хийгээрэй.',
  },
  {
    emoji: '🤖',
    title: 'AI Туслах',
    description:
      'Малын өвчин оношлох, зөвлөгөө авах, дуут команд өгөх. Хиймэл оюун ухааны тусламжтай малаа илүү сайн арчлаарай.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setCurrentPage(Math.round(offsetX / width));
  };

  const goNext = () => {
    if (currentPage < pages.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentPage + 1) * width,
        animated: true,
      });
      setCurrentPage(currentPage + 1);
    }
  };

  const handleStart = () => router.push('/onboarding/phone' as any);

  const isLastPage = currentPage === pages.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {pages.map((page, index) => (
          <View key={index} style={styles.page}>
            <Text style={styles.pageEmoji}>{page.emoji}</Text>
            <Text style={styles.pageTitle}>{page.title}</Text>
            <Text style={styles.pageDescription}>{page.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPage === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.bottomContainer}>
        {isLastPage ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Бүртгүүлэх</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={goNext}>
            <Text style={styles.nextButtonText}>Дараах</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  page: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  pageEmoji: { fontSize: 72, marginBottom: 32 },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2d5016',
    marginBottom: 20,
    textAlign: 'center',
  },
  pageDescription: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 6 },
  dotActive: { backgroundColor: '#2d5016', width: 28, borderRadius: 5 },
  dotInactive: { backgroundColor: '#C8D6C0' },
  bottomContainer: { paddingHorizontal: 32, paddingBottom: 32 },
  nextButton: {
    backgroundColor: '#2d5016',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  startButton: {
    backgroundColor: '#2d5016',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#2d5016',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
});
