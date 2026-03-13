import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface BalanceCardProps {
  totalBalance: number;
  currency: string;
}

export function BalanceCard({ totalBalance, currency }: BalanceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <p className="text-sm font-medium text-muted-foreground">
          Total Balance
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">
          {formatCurrency(totalBalance, currency)}
        </p>
      </CardContent>
    </Card>
  );
}
