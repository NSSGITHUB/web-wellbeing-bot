import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface RankingDataPoint {
  date: string;
  ranking: number;
  keyword?: string;
  competitorName?: string;
}

interface RankingChartProps {
  data: RankingDataPoint[];
  title: string;
  description?: string;
}

export const RankingChart = ({ data, title, description }: RankingChartProps) => {
  // Group data by keyword/competitor
  const groupedData = data.reduce((acc, point) => {
    const key = point.keyword || point.competitorName || 'unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(point);
    return acc;
  }, {} as Record<string, RankingDataPoint[]>);

  // Transform data for recharts
  const chartData = Object.values(groupedData)[0]?.map((point, index) => {
    const dataPoint: any = {
      date: format(new Date(point.date), 'MM/dd'),
    };
    
    Object.keys(groupedData).forEach(key => {
      if (groupedData[key][index]) {
        dataPoint[key] = groupedData[key][index].ranking;
      }
    });
    
    return dataPoint;
  }) || [];

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={Object.keys(groupedData).reduce((acc, key, index) => ({
            ...acc,
            [key]: {
              label: key,
              color: colors[index % colors.length],
            },
          }), {})}
          className="h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                reversed
                domain={[1, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: '排名', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {Object.keys(groupedData).map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
