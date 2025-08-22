import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "error";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  trend 
}: MetricCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-gradient-success border-success/20";
      case "warning":
        return "bg-gradient-warning border-warning/20";
      case "error":
        return "bg-gradient-error border-error/20";
      default:
        return "bg-gradient-card border-border/50";
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "error":
        return "text-error";
      default:
        return "text-primary";
    }
  };

  return (
    <Card className={cn(
      "shadow-card hover:shadow-elevated transition-all duration-300 border",
      getVariantClasses()
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-mono">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-lg bg-background/10",
            getIconClasses()
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center gap-1">
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-success" : "text-error"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">from last hour</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}