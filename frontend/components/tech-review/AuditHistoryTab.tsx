import { useEffect, useState } from "react";
import backend from "~backend/client";
import type { AuditLogEntry } from "~backend/tech-review/audit-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, User, FileEdit, Plus, Trash2, Link2, Zap } from "lucide-react";

interface AuditHistoryTabProps {
  techReviewId: number;
}

const actionIcons: Record<string, any> = {
  create: Plus,
  update: FileEdit,
  delete: Trash2,
  add: Plus,
  remove: Trash2,
  assign: Link2,
  analyze: Zap,
};

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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const groupEntriesByDate = (entries: AuditLogEntry[]) => {
    const groups: Record<string, AuditLogEntry[]> = {};
    
    entries.forEach((entry) => {
      const date = new Date(entry.createdAt);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    
    return groups;
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

  const groupedEntries = groupEntriesByDate(entries);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date} className="mb-6">
                <div className="sticky top-0 bg-background/95 backdrop-blur z-10 py-2 mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {date}
                  </h3>
                </div>
                
                <div className="space-y-3 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {dateEntries.map((entry, idx) => {
                    const Icon = actionIcons[entry.action] || FileEdit;
                    const colorClass = actionColors[entry.action] || actionColors.update;
                    
                    return (
                      <div key={entry.id} className="flex gap-3 relative">
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 bg-background ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 pb-3">
                          <Card className="shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={colorClass}>
                                    {entry.action}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {entityTypeLabels[entry.entityType] || entry.entityType}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(entry.createdAt)}
                                </span>
                              </div>
                              
                              <p className="text-sm mb-2">
                                {entry.changeDescription}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>{entry.userName}</span>
                              </div>
                              
                              {entry.fieldName && (
                                <div className="mt-2 text-xs">
                                  <span className="font-medium">Field:</span> {entry.fieldName}
                                  {entry.oldValue && entry.newValue && (
                                    <div className="mt-1 text-muted-foreground">
                                      <span className="line-through">{entry.oldValue}</span>
                                      {" → "}
                                      <span className="text-foreground">{entry.newValue}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
