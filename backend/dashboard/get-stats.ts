import { api } from "encore.dev/api";
import db from "../db";

interface DashboardStats {
  projectStats: {
    total: number;
    active: number;
    completed: number;
    newDevelopment: number;
    recurring: number;
  };
  productStats: {
    total: number;
    withTechReview: number;
    withDrawing: number;
  };
  techReviewStats: {
    total: number;
    draft: number;
    inProgress: number;
    completed: number;
    completionRate: number;
  };
  errorStats: {
    total: number;
    resolved: number;
    pending: number;
    last7Days: number;
    last30Days: number;
  };
  lessonStats: {
    total: number;
    goodPractice: number;
    badPractice: number;
    topIssues: Array<{
      errorDescription: string;
      occurrenceCount: number;
      severity: string;
    }>;
  };
  nodeStats: {
    totalNodes: number;
    totalProducts: number;
    totalBrands: number;
  };
  recentActivity: Array<{
    id: string;
    type: "project" | "product" | "error" | "lesson";
    description: string;
    timestamp: Date;
    projectId?: string;
    projectName?: string;
  }>;
}

export const getStats = api(
  { expose: true, method: "GET", path: "/dashboard/stats" },
  async (): Promise<DashboardStats> => {
    const projectStats = await db.queryRow<{
      total: number;
      active: number;
      completed: number;
      newDevelopment: number;
      recurring: number;
    }>`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed,
        COUNT(CASE WHEN project_type = 'new_development' THEN 1 END)::int as "newDevelopment",
        COUNT(CASE WHEN project_type = 'recurring' THEN 1 END)::int as recurring
      FROM projects
    `;

    const productStats = await db.queryRow<{
      total: number;
      withTechReview: number;
      withDrawing: number;
    }>`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN EXISTS(SELECT 1 FROM tech_reviews WHERE product_id = products.id) THEN 1 END)::int as "withTechReview",
        COUNT(CASE WHEN has_drawing = true THEN 1 END)::int as "withDrawing"
      FROM products
    `;

    const techReviewStats = await db.queryRow<{
      total: number;
      draft: number;
      inProgress: number;
      completed: number;
    }>`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'draft' THEN 1 END)::int as draft,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::int as "inProgress",
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed
      FROM tech_reviews
    `;

    const completionRate = techReviewStats && techReviewStats.total > 0
      ? Math.round((techReviewStats.completed / techReviewStats.total) * 100)
      : 0;

    const errorStats = await db.queryRow<{
      total: number;
      resolved: number;
      pending: number;
      last7Days: number;
      last30Days: number;
    }>`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN is_resolved = true THEN 1 END)::int as resolved,
        COUNT(CASE WHEN is_resolved = false THEN 1 END)::int as pending,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END)::int as "last7Days",
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)::int as "last30Days"
      FROM production_errors
    `;

    const lessonStats = await db.queryRow<{
      total: number;
      goodPractice: number;
      badPractice: number;
    }>`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN practice_type = 'good' THEN 1 END)::int as "goodPractice",
        COUNT(CASE WHEN practice_type = 'bad' THEN 1 END)::int as "badPractice"
      FROM lessons_learnt
    `;

    const topIssues = await db.queryAll<{
      errorDescription: string;
      occurrenceCount: number;
      severity: string;
    }>`
      SELECT 
        error_description as "errorDescription",
        occurrence_count as "occurrenceCount",
        severity
      FROM lessons_learnt
      ORDER BY occurrence_count DESC, severity DESC
      LIMIT 5
    `;

    const nodeStats = await db.queryRow<{
      totalNodes: number;
    }>`
      SELECT COUNT(*)::int as "totalNodes"
      FROM nodes
    `;

    const productCount = await db.queryRow<{ count: number }>`
      SELECT COUNT(DISTINCT product_code)::int as count
      FROM nodes
    `;

    const brandCount = await db.queryRow<{ count: number }>`
      SELECT COUNT(DISTINCT brand_name)::int as count
      FROM nodes
      WHERE brand_name IS NOT NULL
    `;

    const recentProjects = await db.queryAll<{
      id: string;
      name: string;
      createdAt: Date;
    }>`
      SELECT id, name, created_at as "createdAt"
      FROM projects
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentProducts = await db.queryAll<{
      id: string;
      name: string;
      projectId: string;
      createdAt: Date;
    }>`
      SELECT p.id, p.name, p.project_id as "projectId", p.created_at as "createdAt"
      FROM products p
      ORDER BY p.created_at DESC
      LIMIT 5
    `;

    const recentErrors = await db.queryAll<{
      id: number;
      projectCode: string;
      errorDescription: string;
      createdAt: Date;
    }>`
      SELECT id, project_code as "projectCode", error_description as "errorDescription", created_at as "createdAt"
      FROM production_errors
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentLessons = await db.queryAll<{
      id: number;
      errorDescription: string;
      createdAt: Date;
    }>`
      SELECT id, error_description as "errorDescription", created_at as "createdAt"
      FROM lessons_learnt
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentActivity: DashboardStats["recentActivity"] = [];

    recentProjects.forEach((p) => {
      recentActivity.push({
        id: `project-${p.id}`,
        type: "project",
        description: `Projektas "${p.name}" sukurtas`,
        timestamp: p.createdAt,
        projectId: p.id,
        projectName: p.name,
      });
    });

    recentProducts.forEach((p) => {
      recentActivity.push({
        id: `product-${p.id}`,
        type: "product",
        description: `Produktas "${p.name}" pridėtas`,
        timestamp: p.createdAt,
        projectId: p.projectId,
      });
    });

    recentErrors.forEach((e) => {
      recentActivity.push({
        id: `error-${e.id}`,
        type: "error",
        description: e.errorDescription.slice(0, 80),
        timestamp: e.createdAt,
        projectId: e.projectCode,
      });
    });

    recentLessons.forEach((l) => {
      recentActivity.push({
        id: `lesson-${l.id}`,
        type: "lesson",
        description: l.errorDescription.slice(0, 80),
        timestamp: l.createdAt,
      });
    });

    recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const topActivity = recentActivity.slice(0, 10);

    return {
      projectStats: projectStats || { total: 0, active: 0, completed: 0, newDevelopment: 0, recurring: 0 },
      productStats: productStats || { total: 0, withTechReview: 0, withDrawing: 0 },
      techReviewStats: {
        ...techReviewStats || { total: 0, draft: 0, inProgress: 0, completed: 0 },
        completionRate,
      },
      errorStats: errorStats || { total: 0, resolved: 0, pending: 0, last7Days: 0, last30Days: 0 },
      lessonStats: {
        ...lessonStats || { total: 0, goodPractice: 0, badPractice: 0 },
        topIssues,
      },
      nodeStats: {
        totalNodes: nodeStats?.totalNodes || 0,
        totalProducts: productCount?.count || 0,
        totalBrands: brandCount?.count || 0,
      },
      recentActivity: topActivity,
    };
  }
);
