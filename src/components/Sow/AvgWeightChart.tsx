"use client";

import { formatDateTH, getSoldLitters } from "@/lib/utils";
import { Litter } from "@sowcycle/core";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";

interface PigletCountChartProps {
  litters: Litter[];
}

export default function AvgWeightChart({ litters }: PigletCountChartProps) {
  const chartData = getSoldLitters(litters).map((litter, index) => ({
    litter: `ครอกที่ ${index + 1}`,
    avg_weight: litter.avg_weight,
    date: formatDateTH(litter.sold_at),
  }));

  if (chartData.length === 0) {
    return;
  }

  // Custom dot component for better visibility
  const CustomDot = (props: any) => {
    const { cx, cy } = props;
    return (
      <Dot cx={cx} cy={cy} r={4} fill="#d884c9" stroke="#fff" strokeWidth={2} />
    );
  };

  return (
    <div className="w-full h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="litter"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={40}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            width={12}
            tickCount={3}
            domain={[0, "dataMax"]}
          />
          <Tooltip
            formatter={(value, name) => [value, "น้ำหนักขายเฉลี่ย"]}
            labelFormatter={(label, payload) => {
              const data = payload?.[0]?.payload;
              return `${label} (${data?.date})`;
            }}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="avg_weight"
            stroke="#d884c9"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{
              r: 6,
              stroke: "#d884c9",
              strokeWidth: 2,
              fill: "#fff",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
