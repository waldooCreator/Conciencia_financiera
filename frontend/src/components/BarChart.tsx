import React from 'react';
import { View, Text } from 'react-native';

interface BarSlice {
  name: string;
  amount: number;
  color: string;
  percentage: string;
}

export default function BarChart({ data }: { data: BarSlice[] }) {
  const clean = data.filter(d => d.amount > 0 && isFinite(d.amount));
  if (clean.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-concrete text-sm">Sin datos de gastos</Text>
      </View>
    );
  }

  const maxAmount = Math.max(...clean.map(d => d.amount));
  const barMaxHeight = 140; // px

  return (
    <View>
      {/* Y-axis labels (optional: top amount) */}
      <View className="flex-row justify-between mb-1">
        <Text className="text-concrete text-[10px]">$0</Text>
        <Text className="text-concrete text-[10px]">
          ${maxAmount.toLocaleString()}
        </Text>
      </View>

      {/* Bars container */}
      <View className="flex-row items-end justify-around" style={{ height: barMaxHeight + 60 }}>
        {clean.map((item, i) => {
          const barH = maxAmount > 0 ? (item.amount / maxAmount) * barMaxHeight : 0;
          const pct = parseFloat(item.percentage);

          return (
            <View key={i} className="items-center flex-1 mx-0.5">
              {/* Amount label on top */}
              <View className="mb-1 items-center">
                <Text className="text-noir text-[10px] font-semibold" numberOfLines={1}>
                  ${item.amount >= 1000
                    ? (item.amount / 1000).toFixed(1) + 'k'
                    : item.amount.toFixed(0)}
                </Text>
                <Text className="text-concrete text-[9px]">{item.percentage}%</Text>
              </View>

              {/* The bar */}
              <View
                className="w-full rounded-t-lg"
                style={{
                  height: Math.max(barH, 4),
                  backgroundColor: item.color,
                  maxWidth: 44,
                  opacity: 0.9,
                }}
              />

              {/* Category name below */}
              <Text
                className="text-noir text-[10px] text-center mt-2 leading-tight"
                numberOfLines={2}
                style={{ maxWidth: 56 }}
              >
                {item.name}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Bottom axis line */}
      <View className="border-t border-concrete/30 pt-2 mt-1">
        <Text className="text-concrete text-[10px] text-center">Categorías</Text>
      </View>
    </View>
  );
}
