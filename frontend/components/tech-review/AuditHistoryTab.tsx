import { useEffect, useState } from "react";
import backend from "~backend/client";
import type { AuditLogEntry } from "~backend/tech-review/audit-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

interface AuditHistoryTabProps {
  techReviewId: number;
}

const actionColors: Record<string, string> = {
  create: "bg-green-500/10 text-green-600 border-green-500/20",
  update: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  delete: "bg-red-500/10 text-red-600 border-red-500/20",
  add: "bg-green-500/10 text-green-600 border-green-500/20",
  remove: "bg-red-500/10 text-red-600 border-red-500/20",
  assign: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  analyze: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

const entityTypeLabels: Record<string, string> = {
  tech_review: "Tech Review",
  component: "Component",
  component_part: "Component Part",
  photo: "Photo",
  error: "Error",
  node: "Node Assignment",
  general_notes: "General Notes",
};

export function AuditHistoryTab({ techReviewId }: AuditHistoryTabProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditHistory();
  }, [techReviewId]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      const data = await backend.techReview.getAuditHistory({ techReviewId });
      setEntries(data.entries);
    } catch (error) {
      console.error("Failed to load audit history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading history...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No change history available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date & Time</TableHead>
                  <TableHead className="w-[150px]">User</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead className="w-[150px]">Entity Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const colorClass = actionColors[entry.action] || actionColors.update;
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span>{entry.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={colorClass}>
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {entityTypeLabels[entry.entityType] || entry.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.changeDescription}
                        {entry.fieldName && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium">Field:</span> {entry.fieldName}
                            {entry.oldValue && entry.newValue && (
                              <span className="ml-2">
                                <span className="line-through">{entry.oldValue}</span>
                                {" → "}
                                <span className="text-foreground">{entry.newValue}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
