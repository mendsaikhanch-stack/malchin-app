import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TabConfig = {
  name: string;
  title: string;
  icon: IconSymbolName;
};

const tabs: TabConfig[] = [
  { name: 'index', title: 'Нүүр', icon: 'house.fill' },
  { name: 'market', title: 'Зах зээл', icon: 'storefront.fill' },
  { name: 'insurance', title: 'Даатгал', icon: 'shield.fill' },
  { name: 'manage', title: 'Удирдлага', icon: 'gearshape.fill' },
  { name: 'profile', title: 'Профайл', icon: 'person.fill' },
];

const hiddenTabs = ['weather', 'ai-advisor', 'livestock', 'finance', 'diagnose', 'knowledge', 'pasture', 'breeding', 'health', 'scanner', 'household', 'map-view', 'news', 'livestock-insurance'];

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: { elevation: 8 },
        }),
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name={tab.icon} color={color} />
            ),
          }}
        />
      ))}
      {hiddenTabs.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
