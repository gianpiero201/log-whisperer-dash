import { LogTable } from "@/components/log-table";

export default function Logs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="border-b border-border/50 pb-4">
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground mt-2">
            View and analyze system logs with advanced filtering and search capabilities
          </p>
        </div>

        {/* Logs Table */}
        <LogTable />
      </div>
    </div>
  );
}