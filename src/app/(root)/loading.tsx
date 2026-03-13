import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";

export default function RootLoading() {
  return (
    <div className="p-4 md:p-6">
      <DashboardSkeleton />
    </div>
  );
}
