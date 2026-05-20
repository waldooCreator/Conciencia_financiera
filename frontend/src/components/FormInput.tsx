import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function FormInput({
  label,
  error,
  icon,
  className,
  ...props
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="text-noir font-medium mb-2 text-base">
          {label}
        </Text>
      )}
      <View
        className={`
          flex-row items-center bg-bone/50 rounded-xl px-4 py-3
          ${isFocused ? 'border-2 border-steel' : 'border border-concrete'}
        `}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className="flex-1 text-noir text-base"
          placeholderTextColor="#c9ccc3"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
