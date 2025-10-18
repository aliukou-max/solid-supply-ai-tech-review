// @ts-nocheck
import React from "react";
const useState = (React as any).useState;
import backend from "~backend/client";
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

interface AddPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productTypeId: string;
  currentPartCount: number;
  onAdded: () => void;
}

export default function AddPartDialog({
  open,
  onOpenChange,
  productTypeId,
  currentPartCount,
  onAdded,
}: AddPartDialogProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

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
      await backend.product_types.createPart({
        productTypeId,
        name: name.trim(),
        sortOrder: currentPartCount + 1,
      });
      toast({
        title: "Success",
        description: "Part added successfully",
      });
      setName("");
      onAdded();
    } catch (error) {
      console.error("Failed to add part:", error);
      toast({
        title: "Error",
        description: "Failed to add part",
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
          <DialogTitle>Add Component Part</DialogTitle>
          <DialogDescription>
            Add a new default component part for this product type
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
              {submitting ? "Adding..." : "Add Part"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
