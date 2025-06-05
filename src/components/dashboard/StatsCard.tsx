
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  color: string;
  details?: Array<{ label: string; value: string | number }>;
}

const StatsCard = ({ title, value, description, icon: Icon, color, details }: StatsCardProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className={`${color} text-white cursor-pointer hover:opacity-90 transition-opacity`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs opacity-80">{description}</p>
          </CardContent>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-medium leading-none">{title} - Detalhes</h4>
          {details && details.length > 0 ? (
            <div className="grid gap-2">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{detail.label}:</span>
                  <span className="text-sm font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Informações detalhadas sobre {title.toLowerCase()}.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StatsCard;
