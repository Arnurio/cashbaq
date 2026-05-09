import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { typography, colors } from '../../lib/theme';

type Variant = keyof typeof typography;

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
}

/**
 * Типографика — единственный способ ставить текст в приложении.
 * Использует tokens из theme.typography.
 */
export function Text({
  variant = 'body',
  color = colors.textPrimary,
  align,
  weight,
  style,
  ...rest
}: TextProps) {
  const variantStyle = typography[variant] as TextStyle;

  const weightOverride: TextStyle | undefined = weight
    ? { fontFamily: `Manrope_${weightMap[weight]}` }
    : undefined;

  return (
    <RNText
      style={[
        variantStyle,
        { color, textAlign: align },
        weightOverride,
        style,
      ]}
      {...rest}
    />
  );
}

const weightMap = {
  regular: '400Regular',
  medium: '500Medium',
  semibold: '600SemiBold',
  bold: '700Bold',
  extrabold: '800ExtraBold',
} as const;
