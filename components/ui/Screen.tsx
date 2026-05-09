import React from 'react';
import { ScrollView, View, ViewStyle, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../../lib/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  noPaddingTop?: boolean;
}

/**
 * Корневой контейнер экрана.
 * - Применяет safe area сверху (статус-бар не перекрывает контент)
 * - Единый padding по сторонам
 * - Скроллируемый по умолчанию
 */
export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  noPaddingTop = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topPad = noPaddingTop ? 0 : insets.top + spacing.md;

  const containerStyle = [styles.container, style];
  const inner = [
    styles.content,
    { paddingTop: topPad, paddingBottom: insets.bottom + spacing['2xl'] },
    contentStyle,
  ];

  if (scroll) {
    return (
      <View style={containerStyle}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={inner}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    gap: layout.sectionGap,
  },
});
