import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Sparkles } from 'lucide-react-native';
import { Text } from './Text';
import { colors, spacing, radii, shadows, gradients } from '../../lib/theme';
import { PressableScale } from '../../lib/animations';

interface HeroProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  badges?: { label: string; emoji?: string }[];
  variant?: 'brand' | 'accent';
  icon?: 'search' | 'sparkle';
}

/**
 * Большой hero-блок на главном экране.
 * Сильный визуальный якорь, призыв к действию.
 */
export function Hero({
  title,
  subtitle,
  onPress,
  badges,
  variant = 'brand',
  icon = 'search',
}: HeroProps) {
  const colorsArr = variant === 'accent' ? gradients.accent : gradients.hero;
  const Icon = icon === 'sparkle' ? Sparkles : Search;

  const content = (
    <LinearGradient
      colors={colorsArr}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, shadows.brand as object]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <Text variant="h1" color={colors.textInverse} style={styles.title}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyLg" color="rgba(255,255,255,0.85)" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.iconCircle}>
          <Icon size={22} color={colors.textInverse} strokeWidth={2.4} />
        </View>
      </View>
      {badges && badges.length > 0 && (
        <View style={styles.badgesRow}>
          {badges.map((b, i) => (
            <View key={i} style={styles.badge}>
              <Text variant="buttonSm" color={colors.textInverse}>
                {b.emoji ? `${b.emoji} ` : ''}
                {b.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </LinearGradient>
  );

  if (onPress) {
    return <PressableScale onPress={onPress}>{content}</PressableScale>;
  }
  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    opacity: 0.95,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
});
