"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  AlertTriangle,
  FileText,
  User,
  Database,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { auditLogsApi, type AuditLogDto } from "@/lib/api/auditLogs";
import Link from "next/link";

function AdminActivityLogContent() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering and pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [actionFilter, setActionFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, tableFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await auditLogsApi.getAllAuditLogs({
        page,
        pageSize,
        action: actionFilter || undefined,
        table: tableFilter || undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        setError(res.errors?.[0] || res.message || "Failed to load audit logs");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching audit logs");
    } finally {
      setLoading(false);
    }
  };

  const parseJSONValues = (val?: string) => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("add")) {
      return "bg-green-100 text-green-700 border-green-200";
    }
    if (act.includes("delete") || act.includes("remove")) {
      return "bg-red-100 text-red-700 border-red-200";
    }
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  // Local filter for search query
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const user = (log.userName || "").toLowerCase();
    const action = (log.action || "").toLowerCase();
    const table = (log.tableName || "").toLowerCase();
    const ip = (log.ipAddress || "").toLowerCase();
    
    return user.includes(query) || action.includes(query) || table.includes(query) || ip.includes(query);
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-500" />
            System Activity & Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time administrative ledger monitoring all database changes and user actions
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-1" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 border border-border bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by administrator, action, or table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Actions</option>
                <option value="Create">Create / Register</option>
                <option value="Update">Update / Modify</option>
                <option value="Delete">Delete / Remove</option>
              </select>
            </div>

            <select
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Areas</option>
              <option value="Users">Users</option>
              <option value="SubscriptionPlans">Subscription Plans</option>
              <option value="Equipments">Equipment</option>
              <option value="Coupons">Coupons</option>
              <option value="Payments">Payments</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-xl border border-border">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <span className="mt-4 text-muted-foreground text-sm font-medium">Fetching ledger logs...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="p-8 border border-red-200 bg-red-50 text-center max-w-md mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Ledger Fetch Failed</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchLogs} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredLogs.length === 0 && (
        <Card className="p-12 border border-border text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Activities Logged</h3>
          <p className="text-muted-foreground">There are no records matching your current filter criteria.</p>
        </Card>
      )}

      {/* Logs Table */}
      {!loading && !error && filteredLogs.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-border bg-card/30 backdrop-blur-sm shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Administrator</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Table</th>
                  <th className="p-4">Record ID</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-blue-500" />
                      {log.userName || `Staff #${log.userId}`}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Database className="h-3.5 w-3.5 text-indigo-500" />
                        {log.tableName}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs font-bold">#{log.recordId}</td>
                    <td className="p-4 text-muted-foreground text-xs">{log.ipAddress || "System"}</td>
                    <td className="p-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 rounded-full"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-muted-foreground">
              Showing page {page} of ledger logs
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={logs.length < pageSize}
              >
                Next Page
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-card border border-border shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Ledger Entry Inspection
            </DialogTitle>
            <DialogDescription>
              Detailed view of schema attributes before and after transaction completion.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 my-2 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border border-border/60">
                <div>
                  <span className="text-xs text-muted-foreground block">Action Type</span>
                  <span className="font-semibold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Table Entity</span>
                  <span className="font-semibold">{selectedLog.tableName}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Record ID</span>
                  <span className="font-semibold">#{selectedLog.recordId}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Timestamp</span>
                  <span className="font-semibold">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">User Agent</span>
                  <span className="text-xs font-mono block max-w-xs truncate" title={selectedLog.userAgent || "N/A"}>
                    {selectedLog.userAgent || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">IP Address</span>
                  <span className="font-semibold">{selectedLog.ipAddress || "System"}</span>
                </div>
              </div>

              {/* Data Comparisons */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Old Values */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-red-600 block uppercase tracking-wider">Before Change (Old Values)</span>
                  <div className="p-3 border border-red-100 bg-red-50/40 rounded-lg font-mono text-xs max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {selectedLog.oldValues ? (
                      typeof parseJSONValues(selectedLog.oldValues) === "object" ? (
                        <pre className="text-red-900">{JSON.stringify(parseJSONValues(selectedLog.oldValues), null, 2)}</pre>
                      ) : (
                        <span className="text-red-900">{selectedLog.oldValues}</span>
                      )
                    ) : (
                      <span className="text-muted-foreground italic">No state recorded</span>
                    )}
                  </div>
                </div>

                {/* New Values */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-green-600 block uppercase tracking-wider">After Change (New Values)</span>
                  <div className="p-3 border border-green-100 bg-green-50/40 rounded-lg font-mono text-xs max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {selectedLog.newValues ? (
                      typeof parseJSONValues(selectedLog.newValues) === "object" ? (
                        <pre className="text-green-900">{JSON.stringify(parseJSONValues(selectedLog.newValues), null, 2)}</pre>
                      ) : (
                        <span className="text-green-900">{selectedLog.newValues}</span>
                      )
                    ) : (
                      <span className="text-muted-foreground italic">No state recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button onClick={() => setIsDetailOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminActivityLogPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminActivityLogContent />
    </ProtectedRoute>
  );
}
