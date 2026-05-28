import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const TYPE_CONFIG = {
  success: {
    Icon: CheckCircle,
    iconColor: '#2ecc71',
    accentBar: '#2ecc71',
    bg: '#030706',        // noir - max contrast
    textColor: '#f9f5ed',  // bone
  },
  error: {
    Icon: XCircle,
    iconColor: '#e74c3c',
    accentBar: '#e74c3c',
    bg: '#030706',
    textColor: '#f9f5ed',
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: '#f39c12',
    accentBar: '#f39c12',
    bg: '#030706',
    textColor: '#f9f5ed',
  },
};

export default function Toast({
  visible,
  message,
  type = 'success',
  duration = 3500,
  onClose,
}: ToastProps) {
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset position
      slideAnim.setValue(120);
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.85);

      // Slide in from right + fade + scale
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          mass: 0.5,
          stiffness: 200,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          mass: 0.5,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  const config = TYPE_CONFIG[type];
  const { Icon } = config;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        right: 16,
        left: 16,
        zIndex: 99999,
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        opacity: opacityAnim,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        // Elevation for Android
        elevation: 12,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          backgroundColor: config.bg,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderLeftWidth: 4,
          borderLeftColor: config.accentBar,
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderTopColor: 'rgba(97,150,170,0.3)',
          borderRightColor: 'rgba(97,150,170,0.3)',
          borderBottomColor: 'rgba(97,150,170,0.3)',
        }}
      >
        {/* Icon with colored circle background */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: `${config.iconColor}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Icon size={20} strokeWidth={2.5} color={config.iconColor} />
        </View>

        {/* Message */}
        <Text
          style={{
            color: config.textColor,
            fontSize: 14,
            fontWeight: '600',
            flex: 1,
            lineHeight: 19,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>

        {/* Close button */}
        <TouchableOpacity
          onPress={dismiss}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(201,204,195,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={14} strokeWidth={2.5} color="#c9ccc3" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
