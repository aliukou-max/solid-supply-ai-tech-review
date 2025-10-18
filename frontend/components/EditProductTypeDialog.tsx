// @ts-nocheck
import React from "react";
const useState = (React as any).useState;
const useEffect = (React as any).useEffect;
import backend from "~backend/client";
import type { ProductType } from "~backend/product-types/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface EditProductTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: ProductType;
  onUpdated: () => void;
}

export default function EditProductTypeDialog({
  open,
  onOpenChange,
  productType,
  onUpdated,
}: EditProductTypeDialogProps) {
  const [name, setName] = useState(productType.name);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(productType.name);
  }, [productType.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product type name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await backend.product_types.update({
        id: productType.id,
        name: name.trim(),
      });
      toast({
        title: "Success",
        description: "Product type updated successfully",
      });
      onUpdated();
    } catch (error) {
      console.error("Failed to update product type:", error);
      toast({
        title: "Error",
        description: "Failed to update product type",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product Type</DialogTitle>
          <DialogDescription>
            Update the product type name
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., LED Light, Power Supply, Controller"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
