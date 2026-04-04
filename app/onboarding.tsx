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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = '@malchin_onboarding_done';

const pages = [
  {
    emoji: '🐑🐎🐪',
    title: 'МАЛЧИН',
    description: 'Монгол малчны super app\n\nМалаа бүртгэх, эрүүл мэндийг хянах, зах зээлийн мэдээлэл авах бүгдийг нэг аппаар.',
  },
  {
    emoji: '📋',
    title: 'Малаа бүртгэ',
    description: 'Нэг бүрчлэн бүртгэж, эрүүл мэнд, үржил, бэлчээрийн мэдээлэл хөтөл. Ээмэг сканнердаж хурдан бүртгэл хийгээрэй.',
  },
  {
    emoji: '📊',
    title: 'Зах зээлийн мэдээлэл',
    description: 'Бодит цагийн ханш, түүхий эдийн үнэ, зар нийтлэх. Малын бүтээгдэхүүний үнийг хянаж, ашигтай худалдаа хийгээрэй.',
  },
  {
    emoji: '🤖',
    title: 'AI Туслах',
    description: 'Малын өвчин оношлох, зөвлөгөө авах, дуут команд өгөх. Хиймэл оюун ухааны тусламжтай малаа илүү сайн арчлаарай.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const goNext = () => {
    if (currentPage < pages.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * width, animated: true });
      setCurrentPage(currentPage + 1);
    }
  };

  const handleStart = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // ignore storage errors
    }
    router.replace('/(tabs)');
  };

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

      {/* Pagination dots */}
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

      {/* Bottom button */}
      <View style={styles.bottomContainer}>
        {isLastPage ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Эхлэх</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  page: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  pageEmoji: {
    fontSize: 72,
    marginBottom: 32,
  },
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: '#2d5016',
    width: 28,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: '#C8D6C0',
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  nextButton: {
    backgroundColor: '#2d5016',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
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
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
});
