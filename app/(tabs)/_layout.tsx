/**
 * Tab navigator layout — the main 4-tab chrome of the app.
 */

import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Colors, FontFamily, FontSize } from '@theme';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>{symbol}</Text>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📚" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Library" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarIcon: ({ focused }) => <TabIcon symbol="✒️" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Collection" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="flashcards"
        options={{
          title: 'Study',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📜" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Study" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🕯️" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Progress" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.ornament,
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
  },
  icon: {
    fontSize: 22,
    opacity: 0.55,
  },
  iconFocused: {
    opacity: 1,
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.tabBarInactive,
  },
  labelFocused: {
    color: Colors.tabBarActive,
  },
});
