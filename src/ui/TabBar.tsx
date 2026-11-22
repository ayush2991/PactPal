import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, ThemeShape, useTheme } from './theme';

export type Tab = 'timeline' | 'settings';

interface Props {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

type IoniconName = keyof typeof Ionicons.glyphMap;

const TABS: { id: Tab; label: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { id: 'timeline', label: 'Timeline', icon: 'hourglass-outline', activeIcon: 'hourglass' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

const ICON_SIZE = 22;
const BAR_CONTENT_HEIGHT = 52;

export function TabBar({ activeTab, onChange }: Props) {
  const { colors, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, shape, insets.bottom), [colors, shape, insets.bottom]);

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        const tint = active ? colors.accent : colors.textFaint;
        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <Ionicons name={active ? tab.activeIcon : tab.icon} size={ICON_SIZE} color={tint} />
            <Text style={[styles.label, { color: tint }, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: Palette, shape: ThemeShape, insetBottom: number) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      height: BAR_CONTENT_HEIGHT + insetBottom,
      paddingBottom: insetBottom,
      backgroundColor: colors.bgElevated,
      borderTopWidth: shape.hardEdges ? 3 : 1,
      borderTopColor: colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    label: {
      fontSize: 11,
      fontWeight: '500',
    },
    labelActive: {
      fontWeight: '700',
    },
  });
}
