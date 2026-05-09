import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radii, shadows, spacing } from '../../lib/theme';
import { PressableScale } from '../../lib/animations';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  variant?: 'elevated' | 'flat' | 'outline';
  accentColor?: string;
  style?: ViewStyle;
}

/**
 * Базовая карточка для контента.
 * elevated — белая с тенью
 * flat — светло-серая без тени
 * outline — белая с границей
 */
export function Card({
  children,
  onPress,
  padding = 'lg',
  variant = 'elevated',
  accentColor,
  style,
}: CardProps) {
  const paddingValue = spacing[padding];

  const baseStyle: ViewStyle[] = [
    styles.base,
    { padding: paddingValue },
    variantStyles[variant],
    accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : null,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={baseStyle}>
        {children}
      </PressableScale>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
  },
});

const variantStyles: Record<string, ViewStyle> = {
  elevated: {
    backgroundColor: colors.bgElevated,
    ...(shadows.md as object),
  },
  flat: {
    backgroundColor: colors.bgSubtle,
  },
  outline: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
};
