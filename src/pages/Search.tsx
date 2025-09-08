import { useState } from "react";
import { Search as SearchIcon, Filter, Calendar, Download, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LogTable } from "@/components/log-table";

const savedQueries = [
  {
    id: "1",
    name: "Critical Errors Last Hour",
    query: 'level:ERROR AND timestamp:[now-1h TO now]',
    lastUsed: "2 minutes ago"
  },
  {
    id: "2", 
    name: "Database Connection Issues",
    query: 'service:"Database" AND message:*connection*',
    lastUsed: "1 hour ago"
  },
  {
    id: "3",
    name: "Auth Service Warnings",
    query: 'service:"Auth Service" AND level:WARN',
    lastUsed: "3 hours ago"
  }
];

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const [logLevel, setLogLevel] = useState("all");
  const [service, setService] = useState("all");
  const [queryName, setQueryName] = useState("");

  const handleSearch = () => {
    // Implementation for search functionality
    console.log("Searching with query:", searchQuery);
  };

  const loadSavedQuery = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="border-b border-border/50 pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
          <p className="text-muted-foreground mt-2">
            Search and filter logs with powerful query capabilities
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Search Controls */}
          <Card className="lg:col-span-3 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5" />
                Query Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Search Input */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="search-query"
                    placeholder="Enter your search query... (e.g., level:ERROR AND service:API)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 min-h-[80px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use Lucene query syntax: level:ERROR, service:"API Gateway", timestamp:[now-1h TO now]
                </p>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="time-range">Time Range</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger id="time-range">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">Last 15 minutes</SelectItem>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="log-level">Log Level</Label>
                  <Select value={logLevel} onValueChange={setLogLevel}>
                    <SelectTrigger id="log-level">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="ERROR">ERROR</SelectItem>
                      <SelectItem value="WARN">WARN</SelectItem>
                      <SelectItem value="INFO">INFO</SelectItem>
                      <SelectItem value="DEBUG">DEBUG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="service-filter">Service</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger id="service-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="api">API Gateway</SelectItem>
                      <SelectItem value="auth">Auth Service</SelectItem>
                      <SelectItem value="db">Database</SelectItem>
                      <SelectItem value="cache">Cache</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button onClick={handleSearch} className="flex-1">
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {/* Save Query */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Input
                  placeholder="Query name..."
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" disabled={!queryName || !searchQuery}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Query
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Queries */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Saved Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedQueries.map((query) => (
                  <div key={query.id} className="p-3 border border-border/50 rounded-lg bg-background/50">
                    <h4 className="font-medium text-sm mb-1">{query.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono mb-2 truncate" title={query.query}>
                      {query.query}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{query.lastUsed}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadSavedQuery(query.query)}
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Search Results</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">0 results</Badge>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No search performed</h3>
              <p className="text-sm max-w-md mx-auto">
                Enter a search query above and click "Search" to find matching log entries.
                Use advanced query syntax for precise filtering.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}