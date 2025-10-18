import { useState, useEffect } from "react";
import backend from "~backend/client";
import type { ProductTypePart } from "~backend/product-types/types";
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

interface EditPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: ProductTypePart;
  onUpdated: () => void;
}

export default function EditPartDialog({
  open,
  onOpenChange,
  part,
  onUpdated,
}: EditPartDialogProps) {
  const [name, setName] = useState(part.name);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(part.name);
  }, [part.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a part name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await backend.product_types.updatePart({
        id: part.id,
        name: name.trim(),
        sortOrder: part.sortOrder,
      });
      toast({
        title: "Success",
        description: "Part updated successfully",
      });
      onUpdated();
    } catch (error) {
      console.error("Failed to update part:", error);
      toast({
        title: "Error",
        description: "Failed to update part",
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
          <DialogTitle>Edit Component Part</DialogTitle>
          <DialogDescription>
            Update the component part name
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="partName">Part Name</Label>
              <Input
                id="partName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., PCB, Housing, LED Strip"
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
