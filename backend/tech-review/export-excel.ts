import { api, APIError } from "encore.dev/api";
import db from "../db";
import ExcelJS from "exceljs";
import { componentPhotos } from "./storage";
import type { TechReview, Component, Error as ReviewError } from "./types";

interface ExportExcelRequest {
  productId: string;
}

interface ExportExcelResponse {
  data: string;
  filename: string;
}

export const exportExcel = api(
  { expose: true, method: "POST", path: "/tech-reviews/:productId/export/excel" },
  async ({ productId }: ExportExcelRequest): Promise<ExportExcelResponse> => {
    const review = await db.queryRow<TechReview>`
      SELECT id, product_id as "productId", status, general_notes as "generalNotes", created_at as "createdAt", updated_at as "updatedAt"
      FROM tech_reviews
      WHERE product_id = ${productId}
    `;

    if (!review) {
      throw APIError.notFound("tech review not found");
    }

    const product = await db.queryRow<{ name: string; type: string; projectId: string }>`
      SELECT name, type, project_id as "projectId"
      FROM products
      WHERE id = ${productId}
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    const project = await db.queryRow<{ id: string; name: string; projectType: string }>`
      SELECT id, name, project_type as "projectType"
      FROM projects
      WHERE id = ${product.projectId}
    `;

    const components = await db.queryAll<Component & { nodeName?: string; nodeDrawingUrl?: string }>`
      SELECT 
        c.id, c.tech_review_id as "techReviewId", c.name, c.material, c.finish, c.color,
        c.grain_direction as "grainDirection", c.technical_notes as "technicalNotes",
        c.assembly_notes as "assemblyNotes", c.node_id as "nodeId", c.photo_url as "photoUrl",
        c.created_at as "createdAt", c.updated_at as "updatedAt",
        n.product_code as "nodeName", n.pdf_url as "nodeDrawingUrl"
      FROM components c
      LEFT JOIN nodes n ON c.node_id = n.id
      WHERE c.tech_review_id = ${review.id}
      ORDER BY c.created_at ASC
    `;

    for (const component of components) {
      const photos = await db.queryAll<{ 
        id: number; 
        componentId: number;
        photoUrl: string; 
        displayOrder: number;
        createdAt: Date;
      }>`
        SELECT id, component_id as "componentId", photo_url as "photoUrl", display_order as "displayOrder", created_at as "createdAt"
        FROM component_photos
        WHERE component_id = ${component.id}
        ORDER BY display_order ASC
      `;
      component.photos = photos;
    }

    const errors = await db.queryAll<ReviewError & { componentName?: string; lessonTitle?: string }>`
      SELECT 
        e.id, e.tech_review_id as "techReviewId", e.component_id as "componentId",
        e.description, e.solution, e.lesson_learnt_id as "lessonLearntId", e.status,
        e.created_at as "createdAt", e.resolved_at as "resolvedAt",
        c.name as "componentName",
        ll.error_description as "lessonTitle"
      FROM errors e
      LEFT JOIN components c ON e.component_id = c.id
      LEFT JOIN lessons_learnt ll ON e.lesson_learnt_id = ll.id
      WHERE e.tech_review_id = ${review.id}
      ORDER BY e.created_at DESC
    `;

    const componentParts = await db.queryAll<{
      id: number;
      partName: string;
      hasDone: boolean;
      hasNode: boolean;
      hadErrors: boolean;
      notes?: string;
      nodeName?: string;
    }>`
      SELECT 
        cp.id, cp.part_name as "partName", cp.has_done as "hasDone",
        cp.has_node as "hasNode", cp.had_errors as "hadErrors", cp.notes,
        n.product_code as "nodeName"
      FROM component_parts cp
      LEFT JOIN nodes n ON cp.selected_node_id = n.id
      WHERE cp.tech_review_id = ${review.id}
      ORDER BY cp.sort_order, cp.part_name
    `;

    const lessonIds = errors.map(e => e.lessonLearntId).filter(id => id !== null && id !== undefined);
    const uniqueLessonIds = [...new Set(lessonIds)];
    
    const lessons = uniqueLessonIds.length > 0 ? await db.queryAll<{ 
      id: number; 
      title: string; 
      description: string; 
      solution: string;
      category: string;
      occurrenceCount: number;
    }>`
      SELECT id, error_description as "title", error_description as "description", solution, product_type as "category", occurrence_count as "occurrenceCount"
      FROM lessons_learnt
      WHERE id = ANY(${uniqueLessonIds})
      ORDER BY error_description ASC
    ` : [];

    const excelBuffer = await generateExcel(review, product, project, components, errors, componentParts, lessons);
    const base64Data = excelBuffer.toString('base64');
    const filename = `tech-review-${product.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`;

    return { data: base64Data, filename };
  }
);

async function generateExcel(
  review: TechReview,
  product: { name: string; type: string },
  project: { id: string; name: string; projectType: string } | null,
  components: (Component & { nodeName?: string; nodeDrawingUrl?: string })[],
  errors: (ReviewError & { componentName?: string; lessonTitle?: string })[],
  componentParts: { id: number; partName: string; hasDone: boolean; hasNode: boolean; hadErrors: boolean; notes?: string; nodeName?: string }[],
  lessons: { id: number; title: string; description: string; solution: string; category: string; occurrenceCount: number }[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AI Tech Review System';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: 'FF2563EB' } }
  });

  summarySheet.columns = [
    { key: 'label', width: 25 },
    { key: 'value', width: 50 }
  ];

  const titleRow = summarySheet.addRow(['Technical Review Report', '']);
  titleRow.font = { size: 18, bold: true, color: { argb: 'FF2563EB' } };
  titleRow.alignment = { vertical: 'middle', horizontal: 'left' };
  summarySheet.mergeCells('A1:B1');

  summarySheet.addRow([]);
  
  const infoRows = [
    ['Product Name', product.name],
    ['Product Type', product.type],
    ['Project Name', project ? project.name : 'N/A'],
    ['Project Code', project?.id || 'N/A'],
    ['Project Type', project ? project.projectType : 'N/A'],
    ['Review Status', review.status.toUpperCase()],
    ['Created Date', review.createdAt.toLocaleDateString()],
    ['Last Updated', review.updatedAt.toLocaleDateString()],
    ['Total Components', components.length.toString()],
    ['Total Issues', errors.length.toString()],
    ['Total Lessons', lessons.length.toString()]
  ];

  infoRows.forEach(([label, value]) => {
    const row = summarySheet.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: 'FF334155' } };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
  });

  if (review.generalNotes) {
    summarySheet.addRow([]);
    const notesHeaderRow = summarySheet.addRow(['General Notes', '']);
    notesHeaderRow.font = { bold: true, size: 12, color: { argb: 'FF2563EB' } };
    summarySheet.mergeCells(`A${notesHeaderRow.number}:B${notesHeaderRow.number}`);
    
    const notesRow = summarySheet.addRow(['', review.generalNotes]);
    summarySheet.mergeCells(`A${notesRow.number}:B${notesRow.number}`);
    notesRow.alignment = { vertical: 'top', wrapText: true };
    notesRow.height = 60;
  }

  const componentsSheet = workbook.addWorksheet('Components', {
    properties: { tabColor: { argb: 'FFF97316' } }
  });

  componentsSheet.columns = [
    { key: 'name', width: 25, header: 'Component Name' },
    { key: 'material', width: 20, header: 'Material' },
    { key: 'finish', width: 15, header: 'Finish' },
    { key: 'color', width: 15, header: 'Color' },
    { key: 'grainDirection', width: 15, header: 'Grain Direction' },
    { key: 'node', width: 25, header: 'Assigned Node' },
    { key: 'technicalNotes', width: 35, header: 'Technical Notes' },
    { key: 'assemblyNotes', width: 35, header: 'Assembly Notes' },
    { key: 'photos', width: 15, header: 'Photo Count' }
  ];

  const componentHeaderRow = componentsSheet.getRow(1);
  componentHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  componentHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  componentHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  let currentRow = 2;
  for (const component of components) {
    const row = componentsSheet.addRow({
      name: component.name,
      material: component.material || '',
      finish: component.finish || '',
      color: component.color || '',
      grainDirection: component.grainDirection || '',
      node: component.nodeName || '',
      technicalNotes: component.technicalNotes || '',
      assemblyNotes: component.assemblyNotes || '',
      photos: component.photos?.length || 0
    });

    row.alignment = { vertical: 'top', wrapText: true };
    row.height = 30;

    if (component.photos && component.photos.length > 0) {
      for (let i = 0; i < Math.min(component.photos.length, 3); i++) {
        const photo = component.photos[i];
        try {
          const photoKey = photo.photoUrl.replace(/^https?:\/\/[^\/]+\//, '');
          const photoData = await componentPhotos.download(photoKey);
          
          const imageId = workbook.addImage({
            buffer: Buffer.from(photoData).buffer,
            extension: 'jpeg',
          });

          componentsSheet.addImage(imageId, {
            tl: { col: 9 + i, row: currentRow - 1 },
            ext: { width: 120, height: 90 }
          });
        } catch (error) {
          console.error(`Failed to load photo ${photo.photoUrl}:`, error);
        }
      }
      
      if (component.photos.length > 0) {
        row.height = 70;
      }
    }

    currentRow++;
  }

  if (componentParts.length > 0) {
    const partsSheet = workbook.addWorksheet('Component Parts', {
      properties: { tabColor: { argb: 'FF10B981' } }
    });

    partsSheet.columns = [
      { key: 'partName', width: 30, header: 'Part Name' },
      { key: 'hasDone', width: 12, header: 'Completed' },
      { key: 'hasNode', width: 15, header: 'Has Node' },
      { key: 'hadErrors', width: 15, header: 'Had Errors' },
      { key: 'nodeName', width: 25, header: 'Assigned Node' },
      { key: 'notes', width: 40, header: 'Notes' }
    ];

    const partsHeaderRow = partsSheet.getRow(1);
    partsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    partsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    partsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    componentParts.forEach(part => {
      const row = partsSheet.addRow({
        partName: part.partName,
        hasDone: part.hasDone ? 'Yes' : 'No',
        hasNode: part.hasNode ? 'Yes' : 'No',
        hadErrors: part.hadErrors ? 'Yes' : 'No',
        nodeName: part.nodeName || '',
        notes: part.notes || ''
      });

      row.alignment = { vertical: 'top', wrapText: true };

      if (part.hasDone) {
        row.getCell(2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' }
        };
      }

      if (part.hadErrors) {
        row.getCell(4).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFECACA' }
        };
      }
    });
  }

  if (errors.length > 0) {
    const errorsSheet = workbook.addWorksheet('Issues & Solutions', {
      properties: { tabColor: { argb: 'FFDC2626' } }
    });

    errorsSheet.columns = [
      { key: 'component', width: 25, header: 'Component' },
      { key: 'description', width: 40, header: 'Issue Description' },
      { key: 'solution', width: 40, header: 'Solution' },
      { key: 'lesson', width: 30, header: 'Related Lesson' },
      { key: 'status', width: 15, header: 'Status' },
      { key: 'created', width: 18, header: 'Created Date' },
      { key: 'resolved', width: 18, header: 'Resolved Date' }
    ];

    const errorsHeaderRow = errorsSheet.getRow(1);
    errorsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    errorsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDC2626' }
    };
    errorsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    errors.forEach(error => {
      const row = errorsSheet.addRow({
        component: error.componentName || 'N/A',
        description: error.description,
        solution: error.solution || '',
        lesson: error.lessonTitle || '',
        status: error.status.toUpperCase(),
        created: error.createdAt.toLocaleDateString(),
        resolved: error.resolvedAt ? error.resolvedAt.toLocaleDateString() : ''
      });

      row.alignment = { vertical: 'top', wrapText: true };
      row.height = 40;

      if (error.status === 'resolved') {
        row.getCell(5).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' }
        };
        row.getCell(5).font = { color: { argb: 'FF059669' } };
      } else {
        row.getCell(5).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }
        };
        row.getCell(5).font = { color: { argb: 'FFD97706' } };
      }
    });
  }

  if (lessons.length > 0) {
    const lessonsSheet = workbook.addWorksheet('Lessons Learned', {
      properties: { tabColor: { argb: 'FF8B5CF6' } }
    });

    lessonsSheet.columns = [
      { key: 'title', width: 30, header: 'Lesson Title' },
      { key: 'category', width: 20, header: 'Category' },
      { key: 'description', width: 40, header: 'Description' },
      { key: 'solution', width: 40, header: 'Solution' },
      { key: 'occurrenceCount', width: 15, header: 'Occurrences' }
    ];

    const lessonsHeaderRow = lessonsSheet.getRow(1);
    lessonsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    lessonsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' }
    };
    lessonsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    lessons.forEach(lesson => {
      const row = lessonsSheet.addRow({
        title: lesson.title,
        category: lesson.category,
        description: lesson.description,
        solution: lesson.solution,
        occurrenceCount: lesson.occurrenceCount
      });

      row.alignment = { vertical: 'top', wrapText: true };
      row.height = 50;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
