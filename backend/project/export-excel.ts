import { api } from "encore.dev/api";
import db from "../db";
import ExcelJS from "exceljs";
import { componentPhotos } from "../tech-review/storage";

interface ExportProjectRequest {
  projectId: string;
}

interface ExportProjectResponse {
  fileData: string;
  filename: string;
}

export const exportProject = api(
  {
    expose: true,
    method: "POST",
    path: "/project/export-excel",
  },
  async (req: ExportProjectRequest): Promise<ExportProjectResponse> => {
    const project = await db.queryRow<{ id: string; name: string; client: string }>`
      SELECT id, name, client FROM projects WHERE id = ${req.projectId}
    `;

    if (!project) {
      throw new Error("Project not found");
    }

    const products = await db.queryAll<{
      id: string;
      ssCode: string;
      name: string;
      type: string;
      productTypeId: string;
    }>`
      SELECT id, ss_code as "ssCode", name, type, product_type_id as "productTypeId"
      FROM products
      WHERE project_id = ${req.projectId}
      ORDER BY ss_code
    `;

    const workbook = new ExcelJS.Workbook();

    for (const product of products) {
      const sheet = workbook.addWorksheet(product.ssCode, {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
      });

      sheet.columns = [
        { key: 'label', width: 25 },
        { key: 'value', width: 50 },
      ];

      sheet.mergeCells('A1:B1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `Tech Review - ${product.name}`;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      let currentRow = 3;

      sheet.getCell(`A${currentRow}`).value = 'Project:';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = `${project.id} - ${project.name}`;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = 'Client:';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = project.client;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = 'SS Code:';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = product.ssCode;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = 'Product Type:';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = product.type;
      currentRow++;

      currentRow++;

      const techReview = await db.queryRow<{ id: number; status: string; generalNotes: string | null }>`
        SELECT id, status, general_notes as "generalNotes"
        FROM tech_reviews
        WHERE product_id = ${product.id}
      `;

      if (!techReview) {
        sheet.getCell(`A${currentRow}`).value = 'No tech review data';
        continue;
      }

      if (techReview.generalNotes) {
        sheet.getCell(`A${currentRow}`).value = 'General Notes:';
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = techReview.generalNotes;
        sheet.getCell(`B${currentRow}`).alignment = { wrapText: true };
        currentRow += 2;
      }

      const componentParts = await db.queryAll<{
        id: number;
        partName: string;
        material: string | null;
        finish: string | null;
        notes: string | null;
        hasDone: boolean;
        hasNode: boolean;
        hadErrors: boolean;
        selectedNodeId: string | null;
        sortOrder: number;
      }>`
        SELECT 
          id, part_name as "partName", material, finish, notes,
          has_done as "hasDone", has_node as "hasNode", had_errors as "hadErrors",
          selected_node_id as "selectedNodeId", sort_order as "sortOrder"
        FROM component_parts
        WHERE tech_review_id = ${techReview.id}
        ORDER BY sort_order, part_name
      `;

      sheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const componentsTitleCell = sheet.getCell(`A${currentRow}`);
      componentsTitleCell.value = 'Components';
      componentsTitleCell.font = { size: 14, bold: true };
      componentsTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      currentRow++;

      for (const part of componentParts) {
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        const partNameCell = sheet.getCell(`A${currentRow}`);
        partNameCell.value = part.partName;
        partNameCell.font = { bold: true, size: 12 };
        partNameCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        currentRow++;

        if (part.material) {
          sheet.getCell(`A${currentRow}`).value = '  Material:';
          sheet.getCell(`B${currentRow}`).value = part.material;
          currentRow++;
        }

        if (part.finish) {
          sheet.getCell(`A${currentRow}`).value = '  Finish:';
          sheet.getCell(`B${currentRow}`).value = part.finish;
          currentRow++;
        }

        if (part.notes) {
          sheet.getCell(`A${currentRow}`).value = '  Notes:';
          sheet.getCell(`B${currentRow}`).value = part.notes;
          sheet.getCell(`B${currentRow}`).alignment = { wrapText: true };
          currentRow++;
        }

        const statusRow = currentRow;
        sheet.getCell(`A${statusRow}`).value = '  Status:';
        const statusParts = [];
        if (part.hasDone) statusParts.push('✓ Done');
        if (part.hasNode) statusParts.push('✓ Has Node');
        if (part.hadErrors) statusParts.push('⚠ Had Errors');
        sheet.getCell(`B${statusRow}`).value = statusParts.join(' | ') || 'Not started';
        currentRow++;

        if (part.selectedNodeId) {
          const node = await db.queryRow<{ productName: string; brand: string | null; partName: string }>`
            SELECT product_name as "productName", brand, part_name as "partName"
            FROM nodes
            WHERE id = ${part.selectedNodeId}
          `;

          if (node) {
            sheet.getCell(`A${currentRow}`).value = '  Assigned Node:';
            sheet.getCell(`B${currentRow}`).value = `${node.productName} - ${node.partName}${node.brand ? ` (${node.brand})` : ''}`;
            currentRow++;
          }
        }

        const photos = await db.queryAll<{ id: number; photoUrl: string }>`
          SELECT id, photo_url as "photoUrl"
          FROM component_part_photos
          WHERE component_part_id = ${part.id}
          ORDER BY created_at
        `;

        if (photos.length > 0) {
          sheet.getCell(`A${currentRow}`).value = '  Photos:';
          currentRow++;

          for (const photo of photos) {
            try {
              const fileName = photo.photoUrl.split('/').pop() || 'photo.jpg';
              const imageData = await componentPhotos.download(fileName);
              const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
              const extension = ext === 'jpg' ? 'jpeg' : (ext === 'png' || ext === 'gif' ? ext : 'jpeg') as 'jpeg' | 'png' | 'gif';
              const imageId = workbook.addImage({
                buffer: Buffer.from(imageData).buffer,
                extension,
              });

              sheet.addImage(imageId, {
                tl: { col: 1, row: currentRow - 1 },
                ext: { width: 200, height: 200 }
              });

              currentRow += 12;
            } catch (error) {
              console.error(`Failed to add image ${photo.photoUrl}:`, error);
              sheet.getCell(`B${currentRow}`).value = `[Image: ${photo.photoUrl}]`;
              currentRow++;
            }
          }
        }

        currentRow++;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      fileData: base64,
      filename: `${project.id}_TechReview_${new Date().toISOString().split('T')[0]}.xlsx`
    };
  }
);
