import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: PrimaryButtonProps) {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        w-full py-4 px-6 rounded-2xl items-center justify-center
        ${isSecondary ? 'bg-steel' : 'bg-noir'}
        ${disabled || loading ? 'opacity-50' : 'active:scale-95'}
      `}
      style={[style]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? '#f9f5ed' : '#f9f5ed'} />
      ) : (
        <Text
          className={`text-lg font-semibold ${isSecondary ? 'text-bone' : 'text-bone'}`}
          style={[textStyle]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
