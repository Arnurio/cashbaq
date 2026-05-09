import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Text } from './Text';
import { colors, spacing, radii } from '../../lib/theme';
import { PressableScale } from '../../lib/animations';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
}

/**
 * Empty state для пустых списков.
 * Большой иконка + заголовок + опциональный CTA.
 */
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  onPress,
}: EmptyStateProps) {
  const inner = (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon size={28} color={colors.brand} strokeWidth={2} />
      </View>
      <Text variant="h3" color={colors.textPrimary} align="center">
        {title}
      </Text>
      {subtitle && (
        <Text
          variant="bodySm"
          color={colors.textSecondary}
          align="center"
          style={styles.subtitle}
        >
          {subtitle}
        </Text>
      )}
      {ctaLabel && (
        <View style={styles.ctaPill}>
          <Text variant="buttonSm" color={colors.brand}>
            {ctaLabel}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return <PressableScale onPress={onPress}>{inner}</PressableScale>;
  }
  return inner;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderStyle: 'dashed',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    maxWidth: 280,
  },
  ctaPill: {
    marginTop: spacing.md,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
});
