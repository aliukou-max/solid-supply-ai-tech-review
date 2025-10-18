import { api, APIError } from "encore.dev/api";
import db from "../db";
import PDFDocument from "pdfkit";
import { componentPhotos } from "./storage";
import type { TechReview, Component, Error as ReviewError } from "./types";

interface ExportPDFRequest {
  productId: string;
}

interface ExportPDFResponse {
  data: string;
  filename: string;
}

export const exportPDF = api(
  { expose: true, method: "POST", path: "/tech-reviews/:productId/export/pdf" },
  async ({ productId }: ExportPDFRequest): Promise<ExportPDFResponse> => {
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

    const lessonIds = errors.map(e => e.lessonLearntId).filter(id => id !== null && id !== undefined);
    const uniqueLessonIds = [...new Set(lessonIds)];
    
    const lessons = uniqueLessonIds.length > 0 ? await db.queryAll<{ 
      id: number; 
      title: string; 
      description: string; 
      solution: string;
      category: string;
    }>`
      SELECT id, error_description as "title", error_description as "description", solution, product_type as "category"
      FROM lessons_learnt
      WHERE id = ANY(${uniqueLessonIds})
      ORDER BY error_description ASC
    ` : [];

    const pdfBuffer = await generatePDF(review, product, project, components, errors, lessons);
    const base64Data = pdfBuffer.toString('base64');
    const filename = `tech-review-${product.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    return { data: base64Data, filename };
  }
);

async function generatePDF(
  review: TechReview,
  product: { name: string; type: string },
  project: { id: string; name: string; projectType: string } | null,
  components: (Component & { nodeName?: string; nodeDrawingUrl?: string })[],
  errors: (ReviewError & { componentName?: string; lessonTitle?: string })[],
  lessons: { id: number; title: string; description: string; solution: string; category: string }[]
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const buffers: Buffer[] = [];

  doc.on('data', buffers.push.bind(buffers));

  const primaryColor = '#2563eb';
  const secondaryColor = '#64748b';
  const accentColor = '#f97316';

  doc.fontSize(24).fillColor(primaryColor).text('Technical Review Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor(secondaryColor).text(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), { align: 'center' });
  
  doc.moveDown(2);
  doc.fontSize(14).fillColor('#1e293b').text('Product Information', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#334155');
  doc.text(`Product: ${product.name}`);
  doc.text(`Type: ${product.type}`);
  if (project) {
    doc.text(`Project: ${project.name} (${project.id})`);
    doc.text(`Project Type: ${project.projectType}`);
  }
  doc.text(`Status: ${review.status.toUpperCase()}`);
  doc.text(`Created: ${review.createdAt.toLocaleDateString()}`);
  
  if (review.generalNotes) {
    doc.moveDown(1);
    doc.fontSize(14).fillColor('#1e293b').text('General Notes', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155').text(review.generalNotes, { align: 'justify' });
  }

  doc.addPage();
  doc.fontSize(16).fillColor(primaryColor).text('Components & Materials', { underline: true });
  doc.moveDown(1);

  for (const component of components) {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(12).fillColor(accentColor).text(`● ${component.name}`, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#334155');
    
    if (component.material) doc.text(`   Material: ${component.material}`);
    if (component.finish) doc.text(`   Finish: ${component.finish}`);
    if (component.color) doc.text(`   Color: ${component.color}`);
    if (component.grainDirection) doc.text(`   Grain Direction: ${component.grainDirection}`);
    if (component.nodeName) doc.text(`   Assigned Node: ${component.nodeName}`);
    
    if (component.technicalNotes) {
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor(secondaryColor).text(`   Technical Notes: ${component.technicalNotes}`, { 
        align: 'left',
        width: 450 
      });
    }
    
    if (component.assemblyNotes) {
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor(secondaryColor).text(`   Assembly Notes: ${component.assemblyNotes}`, { 
        align: 'left',
        width: 450 
      });
    }

    if (component.photos && component.photos.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor(secondaryColor).text(`   Photos: ${component.photos.length} attached`, { 
        link: null 
      });
      
      for (let i = 0; i < Math.min(component.photos.length, 2); i++) {
        const photo = component.photos[i];
        try {
          if (doc.y > 550) {
            doc.addPage();
          }
          
          const photoKey = photo.photoUrl.replace(/^https?:\/\/[^\/]+\//, '');
          const photoData = await componentPhotos.download(photoKey);
          
          doc.moveDown(0.3);
          doc.image(photoData, doc.x + 20, doc.y, { 
            width: 200,
            height: 150,
            align: 'center'
          });
          doc.moveDown(10);
        } catch (error) {
          console.error(`Failed to load photo ${photo.photoUrl}:`, error);
        }
      }
    }
    
    doc.moveDown(1);
  }

  if (errors.length > 0) {
    doc.addPage();
    doc.fontSize(16).fillColor(primaryColor).text('Issues & Solutions', { underline: true });
    doc.moveDown(1);

    errors.forEach((error, index) => {
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(11).fillColor('#dc2626').text(`Issue ${index + 1}`, { underline: false });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#334155');
      
      if (error.componentName) {
        doc.text(`Component: ${error.componentName}`);
      }
      doc.text(`Description: ${error.description}`, { width: 450 });
      
      if (error.solution) {
        doc.moveDown(0.3);
        doc.fillColor('#059669').text(`Solution: ${error.solution}`, { width: 450 });
      }
      
      if (error.lessonTitle) {
        doc.moveDown(0.3);
        doc.fillColor(accentColor).text(`Related Lesson: ${error.lessonTitle}`);
      }
      
      doc.fillColor('#334155').text(`Status: ${error.status.toUpperCase()}`);
      
      doc.moveDown(1);
    });
  }

  if (lessons.length > 0) {
    doc.addPage();
    doc.fontSize(16).fillColor(primaryColor).text('Lessons Learned', { underline: true });
    doc.moveDown(1);

    lessons.forEach((lesson, index) => {
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(12).fillColor(accentColor).text(`${index + 1}. ${lesson.title}`);
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor(secondaryColor).text(`Category: ${lesson.category}`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Description: ${lesson.description}`, { width: 450, align: 'justify' });
      doc.moveDown(0.3);
      doc.fillColor('#059669').text(`Solution: ${lesson.solution}`, { width: 450, align: 'justify' });
      doc.moveDown(1);
    });
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(secondaryColor).text(
      `Page ${i + 1} of ${range.count}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
  });
}
