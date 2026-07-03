import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  color: string;
  size: number;
  badge?: number;
}

function TabIcon({ name, color, size, badge }: TabIconProps) {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.label,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 50 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Moments',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="ellipse-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Circles',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="call-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -3,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F2A93B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
