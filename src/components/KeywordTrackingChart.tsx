import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

interface KeywordTrackingChartProps {
  data: Array<Record<string, any>>;
  dataKeys: string[];
}

const colors = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const KeywordTrackingChart = ({ data, dataKeys }: KeywordTrackingChartProps) => {
  if (data.length === 0 || dataKeys.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        尚無資料可顯示
      </div>
    );
  }

  const chartConfig = dataKeys.reduce((acc, key, index) => ({
    ...acc,
    [key]: {
      label: key,
      color: colors[index % colors.length],
    },
  }), {});

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            reversed
            domain={[1, 'auto']}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            label={{ 
              value: '排名', 
              angle: -90, 
              position: 'insideLeft',
              fill: 'hsl(var(--muted-foreground))'
            }}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            labelFormatter={(value) => `日期: ${value}`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
          />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: colors[index % colors.length] }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
