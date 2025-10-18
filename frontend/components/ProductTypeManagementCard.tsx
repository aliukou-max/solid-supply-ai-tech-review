import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, GripVertical, X } from "lucide-react";
import backend from "~backend/client";
import type { ProductType, ProductTypePart } from "~backend/product-types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditProductTypeDialog from "@/components/EditProductTypeDialog";
import AddPartDialog from "@/components/AddPartDialog";
import EditPartDialog from "@/components/EditPartDialog";

interface ProductTypeManagementCardProps {
  productType: ProductType;
  onUpdated: () => void;
  onDeleted: (id: string) => void;
}

export default function ProductTypeManagementCard({
  productType,
  onUpdated,
  onDeleted,
}: ProductTypeManagementCardProps) {
  const [parts, setParts] = useState<ProductTypePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddPartDialog, setShowAddPartDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<ProductTypePart | null>(null);
  const [deletingPart, setDeletingPart] = useState<ProductTypePart | null>(null);
  const [draggedPart, setDraggedPart] = useState<ProductTypePart | null>(null);
  const { toast } = useToast();

  const loadParts = async () => {
    try {
      const response = await backend.product_types.listParts({ productTypeId: productType.id });
      setParts(response.parts);
    } catch (error) {
      console.error("Failed to load parts:", error);
      toast({
        title: "Error",
        description: "Failed to load parts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, [productType.id]);

  const handleDeleteProductType = async () => {
    try {
      await backend.product_types.deleteProductType({ id: productType.id });
      toast({
        title: "Success",
        description: "Product type deleted successfully",
      });
      onDeleted(productType.id);
    } catch (error) {
      console.error("Failed to delete product type:", error);
      toast({
        title: "Error",
        description: "Failed to delete product type",
        variant: "destructive",
      });
    }
  };

  const handleDeletePart = async (part: ProductTypePart) => {
    try {
      await backend.product_types.deletePart({ id: part.id });
      toast({
        title: "Success",
        description: "Part deleted successfully",
      });
      loadParts();
    } catch (error) {
      console.error("Failed to delete part:", error);
      toast({
        title: "Error",
        description: "Failed to delete part",
        variant: "destructive",
      });
    } finally {
      setDeletingPart(null);
    }
  };

  const handleDragStart = (part: ProductTypePart) => {
    setDraggedPart(part);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetPart: ProductTypePart) => {
    if (!draggedPart || draggedPart.id === targetPart.id) {
      setDraggedPart(null);
      return;
    }

    const draggedIndex = parts.findIndex(p => p.id === draggedPart.id);
    const targetIndex = parts.findIndex(p => p.id === targetPart.id);

    const newParts = [...parts];
    newParts.splice(draggedIndex, 1);
    newParts.splice(targetIndex, 0, draggedPart);

    setParts(newParts);

    try {
      for (let i = 0; i < newParts.length; i++) {
        await backend.product_types.updatePart({
          id: newParts[i].id,
          name: newParts[i].name,
          sortOrder: i + 1,
        });
      }
      toast({
        title: "Success",
        description: "Part order updated successfully",
      });
    } catch (error) {
      console.error("Failed to update part order:", error);
      toast({
        title: "Error",
        description: "Failed to update part order",
        variant: "destructive",
      });
      loadParts();
    } finally {
      setDraggedPart(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{productType.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Default Component Parts ({parts.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddPartDialog(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Part
              </Button>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">Loading parts...</div>
            ) : parts.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded">
                No parts yet. Click "Add Part" to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {parts.map((part, index) => (
                  <div
                    key={part.id}
                    draggable
                    onDragStart={() => handleDragStart(part)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(part)}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded border hover:bg-muted transition-colors cursor-move"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                    <span className="flex-1 text-sm">{part.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPart(part)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingPart(part)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditProductTypeDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        productType={productType}
        onUpdated={() => {
          setShowEditDialog(false);
          onUpdated();
        }}
      />

      <AddPartDialog
        open={showAddPartDialog}
        onOpenChange={setShowAddPartDialog}
        productTypeId={productType.id}
        currentPartCount={parts.length}
        onAdded={() => {
          setShowAddPartDialog(false);
          loadParts();
        }}
      />

      {editingPart && (
        <EditPartDialog
          open={!!editingPart}
          onOpenChange={(open) => !open && setEditingPart(null)}
          part={editingPart}
          onUpdated={() => {
            setEditingPart(null);
            loadParts();
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productType.name}"? This will also delete all associated parts.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProductType}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {deletingPart && (
        <AlertDialog open={!!deletingPart} onOpenChange={(open) => !open && setDeletingPart(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Part</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingPart.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeletePart(deletingPart)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
