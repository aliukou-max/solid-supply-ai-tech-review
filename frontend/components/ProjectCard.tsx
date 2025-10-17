import { Link } from "react-router-dom";
import { Folder, Calendar } from "lucide-react";
import type { Project } from "~backend/project/create";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{project.id}</CardTitle>
            </div>
            <Badge variant="outline">{project.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{project.client}</p>
            <p className="text-sm text-muted-foreground">{project.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
              <Calendar className="h-3 w-3" />
              {new Date(project.createdAt).toLocaleDateString("lt-LT")}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
