import {
  keepPreviousData,
  useQuery
} from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  Download,
  Eye,
  Filter,
  Info,
  RefreshCw,
  Search,
  Trash2,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLogs } from '../hooks/use-logs';
import { logService } from '../services/logs';
import { LogLevel, LogQuery } from '../types/api';
import { LOG_LEVELS } from '../utils/constants';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LoadingSpinner } from './ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface LogTableProps {
  endpointId?: string;
  autoRefresh?: boolean;
  showFilters?: boolean;
}

export function LogTable({
  endpointId,
  autoRefresh = false,
  showFilters = true
}: LogTableProps) {
  // Filter state
  const [filters, setFilters] = useState<LogQuery>({
    page: 1,
    pageSize: 50,
    level: undefined,
    service: '',
    source: '',
    search: '',
    endpointId: endpointId,
  });

  // Selected logs for bulk operations
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Data fetching
  const {
    data: logsData,
    loading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['logs', filters],
    queryFn: () => logService.getLogs(filters),
    placeholderData: keepPreviousData,
    staleTime: autoRefresh ? 30 * 1000 : 2 * 60 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false,
  });

  // Mutations
  const deleteLog = useLogs();

  const logs = logsData?.items || [];
  const totalPages = logsData?.totalPages || 0;
  const total = logsData?.total || 0;

  // Handle filter changes
  const handleFilterChange = (key: keyof LogQuery, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle log deletion
  const handleDeleteLog = async (logId: number) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        await deleteLog.mutateAsync(logId);
        toast.success('Log deleted successfully');
      } catch (error) {
        console.error('Error deleting log:', error);
      }
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedLogs.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedLogs.length} logs?`)) {
      try {
        // Delete logs one by one (or implement bulk delete in service)
        await Promise.all(
          selectedLogs.map(logId => deleteLog.mutateAsync(logId))
        );
        setSelectedLogs([]);
        toast.success(`${selectedLogs.length} logs deleted successfully`);
      } catch (error) {
        console.error('Error deleting logs:', error);
        toast.error('Failed to delete some logs');
      }
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await logService.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };

  // Get log level icon and color
  const getLogLevelBadge = (level: LogLevel) => {
    const config = LOG_LEVELS[level];
    const IconComponent = {
      DEBUG: Info,
      INFO: Info,
      WARN: AlertTriangle,
      ERROR: XCircle
    }[level];

    return (
      <Badge
        variant={level === 'ERROR' ? 'destructive' : level === 'WARN' ? 'secondary' : 'outline'}
        className="flex items-center gap-1"
      >
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Toggle log selection
  const toggleLogSelection = (logId: number) => {
    setSelectedLogs(prev =>
      prev.includes(logId)
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  // Select all logs on current page
  const toggleSelectAll = () => {
    const currentPageLogIds = logs.map(log => log.id);
    const allSelected = currentPageLogIds.every(id => selectedLogs.includes(id));

    if (allSelected) {
      setSelectedLogs(prev => prev.filter(id => !currentPageLogIds.includes(id)));
    } else {
      setSelectedLogs(prev => [...new Set([...prev, ...currentPageLogIds])]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Logs</h2>
          <p className="text-muted-foreground">
            {total > 0 ? `${total.toLocaleString()} total logs` : 'No logs found'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedLogs.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleteLog.loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedLogs.length})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search logs..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={filters.level || 'all'}
                  onValueChange={(value) => handleFilterChange('level', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARN">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service */}
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Input
                  id="service"
                  placeholder="Filter by service..."
                  value={filters.service || ''}
                  onChange={(e) => handleFilterChange('service', e.target.value)}
                />
              </div>

              {/* Source */}
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  placeholder="Filter by source..."
                  value={filters.source || ''}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading && !isFetching ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load logs</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                {Object.values(filters).some(v => v && v !== '')
                  ? 'Try adjusting your filters or search terms'
                  : 'No logs have been recorded yet'
                }
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={logs.length > 0 && logs.every(log => selectedLogs.includes(log.id))}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className={selectedLogs.includes(log.id) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log.id)}
                          onChange={() => toggleLogSelection(log.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {getLogLevelBadge(log.level)}
                      </TableCell>
                      <TableCell>
                        {log.service && (
                          <Badge variant="outline">{log.service}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={log.message || ''}>
                          {log.message || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.source && (
                          <Badge variant="secondary" className="text-xs">
                            {log.source}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={deleteLog.loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((filters.page || 1) - 1) * (filters.pageSize || 50) + 1} to{' '}
                  {Math.min((filters.page || 1) * (filters.pageSize || 50), total)} of{' '}
                  {total} results
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((filters.page || 1) - 1)}
                    disabled={!filters.page || filters.page <= 1}
                  >
                    Previous
                  </Button>

                  <span className="text-sm">
                    Page {filters.page || 1} of {totalPages || 1}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((filters.page || 1) + 1)}
                    disabled={!filters.page || filters.page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}