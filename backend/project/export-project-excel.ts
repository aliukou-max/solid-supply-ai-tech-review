import { api } from "encore.dev/api";
import db from "../db";
import ExcelJS from "exceljs";
import { componentPhotos } from "../tech-review/storage";

interface ExportProjectExcelRequest {
  projectId: string;
}

interface ExportProjectExcelResponse {
  fileData: string;
  filename: string;
}

export const exportProjectExcel = api(
  {
    expose: true,
    method: "POST",
    path: "/project/:projectId/export-excel",
  },
  async ({ projectId }: ExportProjectExcelRequest): Promise<ExportProjectExcelResponse> => {
    const project = await db.queryRow<{ id: string; name: string; client: string; code?: string; type: string }>`
      SELECT id, name, client, code, type FROM projects WHERE id = ${projectId}
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
      WHERE project_id = ${projectId}
      ORDER BY ss_code
    `;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI Tech Review System';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Project Summary', {
      properties: { tabColor: { argb: 'FF2563EB' } }
    });

    summarySheet.columns = [
      { key: 'label', width: 25 },
      { key: 'value', width: 60 }
    ];

    const titleRow = summarySheet.addRow(['Project Technical Review Export', '']);
    titleRow.font = { size: 18, bold: true, color: { argb: 'FF2563EB' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'left' };
    summarySheet.mergeCells('A1:B1');

    summarySheet.addRow([]);

    const infoRows = [
      ['Project ID', project.id],
      ['Project Name', project.name],
      ['Project Code', project.code || 'N/A'],
      ['Client', project.client],
      ['Project Type', project.type],
      ['Total Products', products.length.toString()],
      ['Export Date', new Date().toLocaleDateString()],
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

    summarySheet.addRow([]);
    const productsHeaderRow = summarySheet.addRow(['Product List', '']);
    productsHeaderRow.font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
    summarySheet.mergeCells(`A${productsHeaderRow.number}:B${productsHeaderRow.number}`);

    summarySheet.addRow([]);

    const productListHeaderRow = summarySheet.addRow(['SS Code', 'Product Name']);
    productListHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    productListHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };

    products.forEach(product => {
      summarySheet.addRow([product.ssCode, product.name]);
    });

    const detailSheet = workbook.addWorksheet('All Components', {
      properties: { tabColor: { argb: 'FFF97316' } }
    });

    detailSheet.columns = [
      { key: 'ssCode', width: 12, header: 'SS Code' },
      { key: 'productName', width: 25, header: 'Product Name' },
      { key: 'partName', width: 25, header: 'Part Name' },
      { key: 'material', width: 20, header: 'Material' },
      { key: 'finish', width: 15, header: 'Finish' },
      { key: 'notes', width: 35, header: 'Notes' },
      { key: 'hasDone', width: 12, header: 'Completed' },
      { key: 'hasNode', width: 12, header: 'Has Node' },
      { key: 'hadErrors', width: 12, header: 'Had Errors' },
      { key: 'assignedNode', width: 35, header: 'Assigned Node' },
      { key: 'photoCount', width: 12, header: 'Photos' }
    ];

    const detailHeaderRow = detailSheet.getRow(1);
    detailHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    detailHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let detailRowNumber = 2;

    for (const product of products) {
      const techReview = await db.queryRow<{ id: number; status: string; generalNotes: string | null }>`
        SELECT id, status, general_notes as "generalNotes"
        FROM tech_reviews
        WHERE product_id = ${product.id}
      `;

      if (!techReview) {
        const row = detailSheet.addRow({
          ssCode: product.ssCode,
          productName: product.name,
          partName: 'No tech review data',
          material: '',
          finish: '',
          notes: '',
          hasDone: '',
          hasNode: '',
          hadErrors: '',
          assignedNode: '',
          photoCount: ''
        });
        row.getCell(3).font = { italic: true, color: { argb: 'FF94A3B8' } };
        detailRowNumber++;
        continue;
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

      if (componentParts.length === 0) {
        const row = detailSheet.addRow({
          ssCode: product.ssCode,
          productName: product.name,
          partName: 'No parts defined',
          material: '',
          finish: '',
          notes: '',
          hasDone: '',
          hasNode: '',
          hadErrors: '',
          assignedNode: '',
          photoCount: ''
        });
        row.getCell(3).font = { italic: true, color: { argb: 'FF94A3B8' } };
        detailRowNumber++;
        continue;
      }

      for (const part of componentParts) {
        let assignedNodeName = '';
        if (part.selectedNodeId) {
          const node = await db.queryRow<{ productName: string; brand: string | null; partName: string }>`
            SELECT product_name as "productName", brand, part_name as "partName"
            FROM nodes
            WHERE id = ${part.selectedNodeId}
          `;
          if (node) {
            assignedNodeName = `${node.productName} - ${node.partName}${node.brand ? ` (${node.brand})` : ''}`;
          }
        }

        const photos = await db.queryAll<{ id: number; photoUrl: string }>`
          SELECT id, photo_url as "photoUrl"
          FROM component_part_photos
          WHERE component_part_id = ${part.id}
          ORDER BY created_at
        `;

        const row = detailSheet.addRow({
          ssCode: product.ssCode,
          productName: product.name,
          partName: part.partName,
          material: part.material || '',
          finish: part.finish || '',
          notes: part.notes || '',
          hasDone: part.hasDone ? 'Yes' : 'No',
          hasNode: part.hasNode ? 'Yes' : 'No',
          hadErrors: part.hadErrors ? 'Yes' : 'No',
          assignedNode: assignedNodeName,
          photoCount: photos.length.toString()
        });

        row.alignment = { vertical: 'top', wrapText: true };

        if (part.hasDone) {
          row.getCell(7).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }
          };
          row.getCell(7).font = { color: { argb: 'FF059669' } };
        }

        if (part.hadErrors) {
          row.getCell(9).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFECACA' }
          };
          row.getCell(9).font = { color: { argb: 'FFDC2626' } };
        }

        detailRowNumber++;
      }
    }

    const photosSheet = workbook.addWorksheet('Component Photos', {
      properties: { tabColor: { argb: 'FF10B981' } }
    });

    photosSheet.columns = [
      { key: 'ssCode', width: 12, header: 'SS Code' },
      { key: 'productName', width: 25, header: 'Product Name' },
      { key: 'partName', width: 25, header: 'Part Name' },
      { key: 'photo1', width: 30, header: 'Photo 1' },
      { key: 'photo2', width: 30, header: 'Photo 2' },
      { key: 'photo3', width: 30, header: 'Photo 3' }
    ];

    const photosHeaderRow = photosSheet.getRow(1);
    photosHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    photosHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    photosHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    photosHeaderRow.height = 20;

    let photoRowNumber = 2;

    for (const product of products) {
      const techReview = await db.queryRow<{ id: number }>`
        SELECT id FROM tech_reviews WHERE product_id = ${product.id}
      `;

      if (!techReview) continue;

      const componentParts = await db.queryAll<{
        id: number;
        partName: string;
      }>`
        SELECT id, part_name as "partName"
        FROM component_parts
        WHERE tech_review_id = ${techReview.id}
        ORDER BY sort_order, part_name
      `;

      for (const part of componentParts) {
        const photos = await db.queryAll<{ id: number; photoUrl: string }>`
          SELECT id, photo_url as "photoUrl"
          FROM component_part_photos
          WHERE component_part_id = ${part.id}
          ORDER BY created_at
          LIMIT 3
        `;

        if (photos.length > 0) {
          const row = photosSheet.addRow({
            ssCode: product.ssCode,
            productName: product.name,
            partName: part.partName,
            photo1: '',
            photo2: '',
            photo3: ''
          });

          row.height = 150;

          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            try {
              const fileName = photo.photoUrl.split('/').pop() || 'photo.jpg';
              const imageData = await componentPhotos.download(fileName);
              const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
              const extension = ext === 'jpg' ? 'jpeg' : (ext === 'png' || ext === 'gif' ? ext : 'jpeg') as 'jpeg' | 'png' | 'gif';
              
              const imageId = workbook.addImage({
                buffer: Buffer.from(imageData).buffer,
                extension,
              });

              photosSheet.addImage(imageId, {
                tl: { col: 3 + i, row: photoRowNumber - 1 },
                ext: { width: 180, height: 135 }
              });
            } catch (error) {
              console.error(`Failed to add image ${photo.photoUrl}:`, error);
              row.getCell(4 + i).value = `[Error loading image]`;
            }
          }

          photoRowNumber++;
        }
      }
    }

    const errorsSheet = workbook.addWorksheet('All Errors', {
      properties: { tabColor: { argb: 'FFDC2626' } }
    });

    errorsSheet.columns = [
      { key: 'ssCode', width: 12, header: 'SS Code' },
      { key: 'productName', width: 25, header: 'Product Name' },
      { key: 'partName', width: 25, header: 'Part Name' },
      { key: 'errorDescription', width: 45, header: 'Error Description' },
      { key: 'solution', width: 45, header: 'Solution' },
      { key: 'status', width: 15, header: 'Status' }
    ];

    const errorsHeaderRow = errorsSheet.getRow(1);
    errorsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    errorsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDC2626' }
    };
    errorsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const product of products) {
      const errors = await db.queryAll<{
        id: number;
        partName: string | null;
        description: string;
        solution: string | null;
        status: string;
      }>`
        SELECT 
          pe.id,
          pe.part_name as "partName",
          pe.description,
          pe.solution,
          pe.status
        FROM production_errors pe
        WHERE pe.product_id = ${product.id}
          AND pe.deleted_at IS NULL
        ORDER BY pe.created_at DESC
      `;

      errors.forEach(error => {
        const row = errorsSheet.addRow({
          ssCode: product.ssCode,
          productName: product.name,
          partName: error.partName || 'N/A',
          errorDescription: error.description,
          solution: error.solution || '',
          status: error.status.toUpperCase()
        });

        row.alignment = { vertical: 'top', wrapText: true };
        row.height = 40;

        if (error.status === 'resolved') {
          row.getCell(6).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }
          };
          row.getCell(6).font = { color: { argb: 'FF059669' } };
        } else {
          row.getCell(6).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' }
          };
          row.getCell(6).font = { color: { argb: 'FFD97706' } };
        }
      });
    }

    const nodesSheet = workbook.addWorksheet('Node Assignments', {
      properties: { tabColor: { argb: 'FF8B5CF6' } }
    });

    nodesSheet.columns = [
      { key: 'ssCode', width: 12, header: 'SS Code' },
      { key: 'productName', width: 25, header: 'Product Name' },
      { key: 'partName', width: 25, header: 'Part Name' },
      { key: 'nodeName', width: 30, header: 'Node Product' },
      { key: 'nodePartName', width: 25, header: 'Node Part' },
      { key: 'nodeBrand', width: 20, header: 'Node Brand' }
    ];

    const nodesHeaderRow = nodesSheet.getRow(1);
    nodesHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    nodesHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' }
    };
    nodesHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const product of products) {
      const techReview = await db.queryRow<{ id: number }>`
        SELECT id FROM tech_reviews WHERE product_id = ${product.id}
      `;

      if (!techReview) continue;

      const partsWithNodes = await db.queryAll<{
        partName: string;
        selectedNodeId: string;
      }>`
        SELECT part_name as "partName", selected_node_id as "selectedNodeId"
        FROM component_parts
        WHERE tech_review_id = ${techReview.id}
          AND selected_node_id IS NOT NULL
        ORDER BY sort_order, part_name
      `;

      for (const part of partsWithNodes) {
        const node = await db.queryRow<{ productName: string; brand: string | null; partName: string }>`
          SELECT product_name as "productName", brand, part_name as "partName"
          FROM nodes
          WHERE id = ${part.selectedNodeId}
        `;

        if (node) {
          nodesSheet.addRow({
            ssCode: product.ssCode,
            productName: product.name,
            partName: part.partName,
            nodeName: node.productName,
            nodePartName: node.partName,
            nodeBrand: node.brand || ''
          });
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      fileData: base64,
      filename: `${project.id}_Complete_Export_${new Date().toISOString().split('T')[0]}.xlsx`
    };
  }
);
