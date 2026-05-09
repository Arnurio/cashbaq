import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from '../../lib/theme';

interface SectionProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Группировка контента: заголовок + опционально подзаголовок + опциональное действие.
 * Без emoji, чистая иерархия.
 */
export function Section({ title, subtitle, action, children, style }: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      {(title || subtitle || action) && (
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            {title && (
              <Text variant="h2" color={colors.textPrimary}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text variant="bodySm" color={colors.textSecondary} style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
          {action && <View>{action}</View>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    marginTop: 2,
  },
  content: {
    gap: spacing.md,
  },
});
