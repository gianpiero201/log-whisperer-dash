import { RealTimeLog } from '@/hooks/use-real-time-logs';
import {
  keepPreviousData,
  useQuery
} from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Info,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
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
  initialPageSize?: number;
  logs: RealTimeLog[];
}

export function LogTable({
  endpointId,
  autoRefresh = false,
  showFilters = true,
  initialPageSize = 50,
  logs
}: LogTableProps) {
  // Filter state
  const [filters, setFilters] = useState<LogQuery>({
    page: 1,
    pageSize: initialPageSize,
    level: undefined,
    service: '',
    source: '',
    search: '',
    endpointId: endpointId,
    startDate: undefined,
    endDate: undefined,
  });

  // UI state
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data fetching with React Query
  const {
    data: logsResponse,
    isLoading,
    error,
    refetch,
    isFetching,
    isError
  } = useQuery({
    queryKey: ['logs', filters],
    queryFn: () => logService.getLogs(filters),
    placeholderData: keepPreviousData,
    staleTime: autoRefresh ? 30 * 1000 : 2 * 60 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const totalPages = logsResponse?.totalPages || 0;
  const total = logsResponse?.total || 0;
  const currentPage = filters.page || 1;

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
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setFilters(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1 // Reset to first page
    }));
  };

  // Handle search with debouncing
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFilterChange('search', searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle log deletion
  const handleDeleteLog = async (logId: number) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        setIsDeleting(true);
        await logService.deleteLog(logId);
        toast.success('Log deleted successfully');
        refetch();
      } catch (error) {
        console.error('Error deleting log:', error);
        toast.error('Failed to delete log');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedLogs.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedLogs.length} logs?`)) {
      try {
        setIsDeleting(true);
        // Delete logs one by one (implement bulk delete in backend if needed)
        await Promise.all(
          selectedLogs.map(logId => logService.deleteLog(logId))
        );
        setSelectedLogs([]);
        toast.success(`${selectedLogs.length} logs deleted successfully`);
        refetch();
      } catch (error) {
        console.error('Error deleting logs:', error);
        toast.error('Failed to delete some logs');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await logService.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    } finally {
      setIsExporting(false);
    }
  };

  // Get log level configuration
  const getLogLevelConfig = (level: LogLevel) => {
    return LOG_LEVELS[level] || LOG_LEVELS.INFO;
  };

  // Get log level badge
  const getLogLevelBadge = (level: LogLevel) => {
    const config = getLogLevelConfig(level);
    const IconComponent = {
      DEBUG: Info,
      INFO: Info,
      WARN: AlertTriangle,
      ERROR: XCircle
    }[level] || Info;

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

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      page: 1,
      pageSize: initialPageSize,
      level: undefined,
      service: '',
      source: '',
      search: '',
      endpointId: endpointId,
      startDate: undefined,
      endDate: undefined,
    });
    setSearchTerm('');
  };

  // Check if any filters are applied
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.level ||
      filters.service ||
      filters.source ||
      filters.search ||
      filters.startDate ||
      filters.endDate
    );
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Logs</h2>
          <p className="text-muted-foreground">
            {total > 0 ? (
              <>
                Showing {((currentPage - 1) * (filters.pageSize || 50)) + 1} to{' '}
                {Math.min(currentPage * (filters.pageSize || 50), total)} of{' '}
                {total.toLocaleString()} logs
              </>
            ) : (
              'No logs found'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk actions */}
          {selectedLogs.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoadingSpinner size="xs" className="mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete ({selectedLogs.length})
            </Button>
          )}

          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || total === 0}
          >
            {isExporting ? (
              <LoadingSpinner size="xs" className="mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Filters toggle */}
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={hasActiveFilters ? 'border-primary' : ''}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1 text-xs">
                  {Object.values(filters).filter(v => v && v !== '').length}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFiltersPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
          {isLoading && !isFetching ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner text="Loading logs..." />
            </div>
          ) : isError ? (
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
                {hasActiveFilters
                  ? 'Try adjusting your filters or search terms'
                  : 'No logs have been recorded yet'
                }
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Loading overlay while fetching */}
              {isFetching && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <LoadingSpinner text="Updating..." />
                </div>
              )}

              <div className="relative">
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
                      <TableHead className="max-w-md">Message</TableHead>
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
                          {format(parseISO(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {getLogLevelBadge(log.level)}
                        </TableCell>
                        <TableCell>
                          {log.service ? (
                            <Badge variant="outline">{log.service}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={log.message || ''}>
                            {log.message || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.source ? (
                            <Badge variant="secondary" className="text-xs">
                              {log.source}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <LoadingSpinner size="xs" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * (filters.pageSize || 50)) + 1} to{' '}
                    {Math.min(currentPage * (filters.pageSize || 50), total)} of{' '}
                    {total.toLocaleString()} results
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="pageSize" className="text-sm">
                      Per page:
                    </Label>
                    <Select
                      value={String(filters.pageSize || 50)}
                      onValueChange={(value) => handlePageSizeChange(Number(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
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