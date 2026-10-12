"use client";

import { formatDateTH } from "@/lib/utils";
import { Breeding, countsTowardLitterStats } from "@sowcycle/core";
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
  breedings: Breeding[];
}

export default function PigletCountChart({ breedings }: PigletCountChartProps) {
  // Prepare data for the chart
  const chartData = breedings
    .filter(
      countsTowardLitterStats)
    .sort((a, b) => {
      return (
        new Date(a.actual_farrow_date!).getTime() -
        new Date(b.actual_farrow_date!).getTime()
      );
    })
    .map((breeding, index) => ({
      breeding: `ครั้งที่ ${index + 1}`,
      piglets: breeding.piglets_born_count || 0,
      date: formatDateTH(breeding.actual_farrow_date!),
    }));

  if (chartData.length === 0) {
    return;
  }

  // Custom dot component for better visibility
  const CustomDot = (props: any) => {
    const { cx, cy } = props;
    return (
      <Dot cx={cx} cy={cy} r={4} fill="#8884d8" stroke="#fff" strokeWidth={2} />
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
            dataKey="breeding"
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
            formatter={(value, name) => [value, "จำนวนลูกสุกร"]}
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
            dataKey="piglets"
            stroke="#8884d8"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{
              r: 6,
              stroke: "#8884d8",
              strokeWidth: 2,
              fill: "#fff",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
