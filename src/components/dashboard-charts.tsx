import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Sample data - in a real app this would come from your log management system
const timeSeriesData = [
  { time: '00:00', logs: 150, errors: 2, warnings: 8 },
  { time: '01:00', logs: 120, errors: 1, warnings: 5 },
  { time: '02:00', logs: 98, errors: 0, warnings: 3 },
  { time: '03:00', logs: 87, errors: 1, warnings: 2 },
  { time: '04:00', logs: 134, errors: 3, warnings: 7 },
  { time: '05:00', logs: 289, errors: 5, warnings: 12 },
  { time: '06:00', logs: 456, errors: 8, warnings: 18 },
  { time: '07:00', logs: 678, errors: 12, warnings: 24 },
  { time: '08:00', logs: 892, errors: 15, warnings: 32 },
  { time: '09:00', logs: 1023, errors: 18, warnings: 38 },
  { time: '10:00', logs: 1156, errors: 12, warnings: 28 },
  { time: '11:00', logs: 1234, errors: 9, warnings: 22 },
];

const logLevelsData = [
  { name: 'INFO', value: 68, count: 8456 },
  { name: 'WARN', value: 18, count: 2234 },
  { name: 'ERROR', value: 9, count: 1123 },
  { name: 'DEBUG', value: 5, count: 623 },
];

const COLORS = {
  INFO: 'hsl(199, 89%, 48%)',
  WARN: 'hsl(38, 92%, 50%)',
  ERROR: 'hsl(0, 84%, 60%)',
  DEBUG: 'hsl(262, 83%, 58%)',
};

const servicesData = [
  { service: 'API Gateway', logs: 3456, errors: 23, warnings: 67 },
  { service: 'Auth Service', logs: 2234, errors: 12, warnings: 34 },
  { service: 'Database', logs: 1890, errors: 8, warnings: 45 },
  { service: 'Cache', logs: 1456, errors: 5, warnings: 23 },
  { service: 'Worker', logs: 1234, errors: 15, warnings: 28 },
];

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Log Volume Over Time */}
      <Card className="lg:col-span-2 bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Log Volume Over Time
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Last 24h</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="logsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="errorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 18%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
              />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(220, 25%, 10%)', 
                  border: '1px solid hsl(220, 25%, 18%)',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="logs" 
                stroke="hsl(217, 91%, 60%)" 
                fillOpacity={1} 
                fill="url(#logsGradient)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="errors" 
                stroke="hsl(0, 84%, 60%)" 
                fillOpacity={1} 
                fill="url(#errorsGradient)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Log Levels Distribution */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Log Levels Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={logLevelsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {logLevelsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value}% (${props.payload.count} logs)`, 
                  name
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(220, 25%, 10%)', 
                  border: '1px solid hsl(220, 25%, 18%)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {logLevelsData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                />
                <span className="text-sm font-mono">{item.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services Log Activity */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Services Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={servicesData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 18%)" />
              <XAxis type="number" stroke="hsl(215, 20%, 65%)" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="service" 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={11}
                width={80}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(220, 25%, 10%)', 
                  border: '1px solid hsl(220, 25%, 18%)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="logs" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}