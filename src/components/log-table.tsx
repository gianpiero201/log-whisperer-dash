import { useState } from "react";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Sample log data - in a real app this would come from your log management system
const sampleLogs = [
  {
    id: "1",
    timestamp: "2024-01-15 14:32:15",
    level: "ERROR",
    service: "API Gateway",
    message: "Failed to connect to database: connection timeout",
    source: "api-gateway-001",
  },
  {
    id: "2", 
    timestamp: "2024-01-15 14:32:12",
    level: "INFO",
    service: "Auth Service",
    message: "User login successful for user@example.com",
    source: "auth-service-003",
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:32:08",
    level: "WARN",
    service: "Cache",
    message: "Cache hit ratio below threshold: 45%",
    source: "redis-cluster-02",
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:32:05",
    level: "DEBUG",
    service: "Worker",
    message: "Processing job queue: 45 jobs remaining",
    source: "worker-node-12",
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:32:01",
    level: "INFO",
    service: "Database",
    message: "Query executed successfully in 145ms",
    source: "db-primary-01",
  },
  {
    id: "6",
    timestamp: "2024-01-15 14:31:58",
    level: "ERROR",
    service: "API Gateway",
    message: "Rate limit exceeded for IP 192.168.1.100",
    source: "api-gateway-002",
  },
  {
    id: "7",
    timestamp: "2024-01-15 14:31:55",
    level: "WARN",
    service: "Auth Service",
    message: "Multiple failed login attempts detected",
    source: "auth-service-001",
  },
  {
    id: "8",
    timestamp: "2024-01-15 14:31:52",
    level: "INFO",
    service: "Cache",
    message: "Cache invalidation completed for user sessions",
    source: "redis-cluster-01",
  },
];

const getLevelBadge = (level: string) => {
  const baseClasses = "font-mono text-xs";
  switch (level) {
    case "ERROR":
      return <Badge variant="destructive" className={baseClasses}>{level}</Badge>;
    case "WARN":
      return <Badge className={cn(baseClasses, "bg-warning text-warning-foreground")}>{level}</Badge>;
    case "INFO":
      return <Badge className={cn(baseClasses, "bg-info text-white")}>{level}</Badge>;
    case "DEBUG":
      return <Badge variant="secondary" className={baseClasses}>{level}</Badge>;
    default:
      return <Badge variant="outline" className={baseClasses}>{level}</Badge>;
  }
};

export function LogTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const filteredLogs = sampleLogs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesService = serviceFilter === "all" || log.service === serviceFilter;
    
    return matchesSearch && matchesLevel && matchesService;
  });

  const services = [...new Set(sampleLogs.map(log => log.service))];
  const levels = [...new Set(sampleLogs.map(log => log.level))];

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Logs</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service} value={service}>{service}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold">Timestamp</TableHead>
                <TableHead className="font-semibold">Level</TableHead>
                <TableHead className="font-semibold">Service</TableHead>
                <TableHead className="font-semibold">Message</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="border-border/50 hover:bg-secondary/30 cursor-pointer"
                >
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    {getLevelBadge(log.level)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.service}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.message}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {log.source}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {sampleLogs.length} logs
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}