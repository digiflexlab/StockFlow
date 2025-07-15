import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatItemProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatsGridProps {
  stats: StatItemProps[];
  columns?: number;
}

const StatItem = ({ icon: Icon, value, label, color = 'text-blue-600', trend }: StatItemProps) => (
  <Card>
    <CardContent className="p-6 text-center">
      <div className="flex items-center justify-center mb-2">
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
      <div className={`text-2xl font-bold text-gray-900 ${trend ? 'mb-1' : 'mb-2'}`}>
        {value}
      </div>
      {trend && (
        <div className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'} mb-1`}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </div>
      )}
      <p className="text-sm text-gray-600">{label}</p>
    </CardContent>
  </Card>
);

export const StatsGrid = ({ stats, columns = 4 }: StatsGridProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-1 md:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {stats.map((stat, index) => (
        <StatItem key={index} {...stat} />
      ))}
    </div>
  );
};