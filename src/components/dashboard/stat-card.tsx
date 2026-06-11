import { Loader2, type LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  isLoading?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        {isLoading ? (
          <Loader2 className="mt-1 h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}
