import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, spacing, radii, shadows } from '../../lib/theme';

interface Stat {
  value: string | number;
  label: string;
  accent?: string;
}

interface StatTilesProps {
  stats: Stat[];
}

/**
 * Ряд из 2-4 stat-карточек.
 * Используется для метрик типа "X карт · Y% макс · Z₸ лимит".
 */
export function StatTiles({ stats }: StatTilesProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat, i) => (
        <View key={i} style={[styles.tile, shadows.sm as object]}>
          <Text
            variant="h1"
            color={stat.accent || colors.brand}
            style={styles.value}
          >
            {stat.value}
          </Text>
          <Text variant="caption" color={colors.textSecondary} style={styles.label}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    lineHeight: 28,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
  },
});
