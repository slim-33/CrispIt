import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useResponsive } from '@/hooks/useResponsive';
import Logo from '@/components/Logo';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size ?? 24} style={{ marginBottom: -3 }} {...props} />;
}

function CollapsibleSidebar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [collapsed, setCollapsed] = useState(true);

  return (
    <View
      style={[
        sidebarStyles.container,
        {
          width: collapsed ? 60 : 200,
          backgroundColor: theme.surface,
          borderRightColor: theme.border,
        },
      ]}>
      {/* Logo */}
      <View style={sidebarStyles.logoWrap}>
        {collapsed ? (
          <FontAwesome name="leaf" size={22} color={theme.primary} />
        ) : (
          <Logo size="sm" color={theme.primary} />
        )}
      </View>

      {/* Toggle button */}
      <TouchableOpacity
        style={[
          sidebarStyles.toggleBtn,
          { backgroundColor: theme.background },
          collapsed && { alignSelf: 'center', marginRight: 0 },
        ]}
        onPress={() => setCollapsed(c => !c)}
        accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <FontAwesome
          name={collapsed ? 'bars' : 'chevron-left'}
          size={14}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {/* Nav items */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if ((options as any).href === null) return null;

        const isFocused = state.index === index;
        const tintColor = isFocused ? theme.tint : theme.tabIconDefault;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              sidebarStyles.navItem,
              isFocused && { backgroundColor: theme.accent },
              collapsed && { justifyContent: 'center', paddingHorizontal: 0 },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}>
            {options.tabBarIcon?.({
              focused: isFocused,
              color: tintColor,
              size: 24,
            })}
            {!collapsed && (
              <Text
                style={[
                  sidebarStyles.navLabel,
                  { color: tintColor },
                  isFocused && { fontWeight: '700' },
                ]}
                numberOfLines={1}>
                {options.title || route.name}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { isWide, isWeb } = useResponsive();

  const useSidebar = isWeb && isWide;

  return (
    <Tabs
      tabBar={useSidebar ? (props) => <CollapsibleSidebar {...props} /> : undefined}
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarPosition: useSidebar ? 'left' : 'bottom',
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarIcon: ({ color, focused }) =>
            useSidebar ? (
              <TabBarIcon name="camera" color={color} />
            ) : (
              <View style={[styles.scanIconWrap, focused && { backgroundColor: theme.primary }]}>
                <FontAwesome name="camera" size={22} color={focused ? '#FFF' : color} />
              </View>
            ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Fridge',
          tabBarIcon: ({ color }) => <TabBarIcon name="snowflake-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          href: null,
          tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
        }}
      />
    </Tabs>
  );
}

const sidebarStyles = StyleSheet.create({
  container: {
    borderRightWidth: 1,
    paddingTop: 16,
    paddingBottom: 16,
  },
  logoWrap: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },
  toggleBtn: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginBottom: 12,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
      default: {},
    }),
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderRadius: 10,
    gap: 12,
    ...Platform.select({
      web: { cursor: 'pointer' as any },
      default: {},
    }),
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  scanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -3,
  },
});
