import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

// A wash under a 2px line, like the web dashboard's small area charts.
export function Sparkline(props: { values: number[]; stroke: string; fill: string; width?: number; height?: number }) {
  const width = props.width ?? 120;
  const height = props.height ?? 56;
  const values = props.values.length >= 2 ? props.values : [props.values[0] ?? 0, props.values[0] ?? 0];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pad = 2;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    pad + (1 - (v - min) / span) * (height * 0.6 - pad),
  ]);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path d={area} fill={props.fill} />
        <Path d={line} stroke={props.stroke} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
