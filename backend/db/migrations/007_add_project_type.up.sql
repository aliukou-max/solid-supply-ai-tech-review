ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'new_development';

CREATE INDEX idx_projects_project_type ON projects(project_type);
