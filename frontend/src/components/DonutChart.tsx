import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface PieSlice {
  name: string;
  amount: number;
  color: string;
  percentage: string;
}

interface DonutChartProps {
  data: PieSlice[];
  size?: number;
  strokeWidth?: number;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function DonutChart({ data, size = 220, strokeWidth = 0 }: DonutChartProps) {
  const clean = data.filter(d => d.amount > 0 && isFinite(d.amount));
  const total = clean.reduce((s, d) => s + d.amount, 0);

  if (clean.length === 0 || total <= 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#c9ccc3', fontSize: 13 }}>Sin datos</Text>
      </View>
    );
  }

  // Fixed reasonable size (ignore incoming size prop to prevent overflow issues)
  const sz = Math.min(size, 260);
  const cx = sz / 2;
  const cy = sz / 2;
  const outer = sz / 2 - 4;
  const inner = strokeWidth > 0 ? Math.max(0, outer - strokeWidth) : 0;

  // Compute angles
  let angle = 0;
  const wedges = clean.map(s => {
    const a = Math.max(1, (s.amount / total) * 360);
    const w = { ...s, start: angle, end: angle + a };
    angle += a;
    return w;
  });

  // Build SVG paths
  const paths: { d: string; fill: string }[] = [];

  if (inner > 2) {
    // Donut
    for (const w of wedges) {
      const la = w.end - w.start > 180 ? 1 : 0;
      const os = polar(cx, cy, outer, w.start);
      const oe = polar(cx, cy, outer, w.end);
      const is_ = polar(cx, cy, inner, w.end);
      const ie = polar(cx, cy, inner, w.start);
      paths.push({
        fill: w.color,
        d: `M${os.x},${os.y} A${outer},${outer} 0 ${la} 0 ${oe.x},${oe.y} L${is_.x},${is_.y} A${inner},${inner} 0 ${la} 1 ${ie.x},${ie.y} Z`,
      });
    }
  } else {
    // Pie (one wedge = full circle)
    if (wedges.length === 1) {
      const a = polar(cx, cy, outer, 0);
      const b = polar(cx, cy, outer, 180);
      paths.push({
        fill: wedges[0].color,
        d: `M${a.x},${a.y} A${outer},${outer} 0 0 1 ${b.x},${b.y} A${outer},${outer} 0 0 1 ${a.x},${a.y}`,
      });
    } else {
      for (const w of wedges) {
        const la = w.end - w.start > 180 ? 1 : 0;
        const s = polar(cx, cy, outer, w.end);
        const e = polar(cx, cy, outer, w.start);
        paths.push({
          fill: w.color,
          d: `M${s.x},${s.y} A${outer},${outer} 0 ${la} 0 ${e.x},${e.y} L${cx},${cy} Z`,
        });
      }
    }
  }

  return (
    <View style={{ width: sz, height: sz, alignSelf: 'center' }}>
      <Svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        {paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.fill} />
        ))}
      </Svg>
    </View>
  );
}
