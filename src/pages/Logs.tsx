import { LogTable } from "@/components/log-table";
import { Badge } from "@/components/ui/badge";
import { useRealTimeLogs } from "@/hooks/use-real-time-logs";

export default function Logs() {
  const {
    logs,
    isConnected,
    subscribeToLogLevel,
    clearLogs,
    newLogsCount
  } = useRealTimeLogs();

  return (
    <div>
      {/* Show new logs indicator */}
      {newLogsCount > 0 && (
        <Badge variant="destructive">
          {newLogsCount} new logs
        </Badge>
      )}

      {/* Real-time logs table */}
      <LogTable
        logs={logs}
      />
    </div>
  );
}