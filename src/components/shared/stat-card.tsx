import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
  color: "destructive" | "success" | "muted";
}

const colorClasses = {
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({ label, amount, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            colorClasses[color]
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatCurrency(amount)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
