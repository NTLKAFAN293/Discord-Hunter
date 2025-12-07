import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Search, Check, X, Clock } from "lucide-react";
import type { SessionStats } from "@shared/schema";

interface StatisticsPanelProps {
  stats: SessionStats;
}

function formatDuration(startTime?: string): string {
  if (!startTime) return "00:00:00";
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return [hours, minutes, seconds]
    .map((n) => n.toString().padStart(2, "0"))
    .join(":");
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Search;
  label: string;
  value: string | number;
  color: "default" | "green" | "red" | "blue";
}) {
  const colorClasses = {
    default: "text-foreground",
    green: "text-green-600 dark:text-green-500",
    red: "text-red-600 dark:text-red-500",
    blue: "text-primary",
  };

  const bgClasses = {
    default: "bg-muted/50",
    green: "bg-green-500/10",
    red: "bg-red-500/10",
    blue: "bg-primary/10",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${bgClasses[color]}`}>
            <Icon className={`h-6 w-6 ${colorClasses[color]}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold font-mono ${colorClasses[color]}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatisticsPanel({ stats }: StatisticsPanelProps) {
  const successRate =
    stats.totalChecks > 0
      ? ((stats.availableCount / stats.totalChecks) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Search}
        label="إجمالي الفحوصات"
        value={stats.totalChecks}
        color="default"
      />
      <StatCard
        icon={Check}
        label="أسماء متاحة"
        value={stats.availableCount}
        color="green"
      />
      <StatCard
        icon={X}
        label="أسماء غير متاحة"
        value={stats.unavailableCount}
        color="red"
      />
      <StatCard
        icon={Clock}
        label="نسبة النجاح"
        value={`${successRate}%`}
        color="blue"
      />
    </div>
  );
}

export function LiveTimer({ startTime }: { startTime?: string }) {
  const [time, setTime] = useState<string>(formatDuration(startTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatDuration(startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="font-mono text-sm text-muted-foreground">
      {time}
    </span>
  );
}