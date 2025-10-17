import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import backend from "~backend/client";
import type { Project } from "~backend/project/create";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  client: string;
  status: string;
}

export function EditProjectDialog({ project, open, onOpenChange, onSuccess }: EditProjectDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      name: project.name,
      client: project.client,
      status: project.status,
    },
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const status = watch("status");

  useEffect(() => {
    if (open) {
      reset({
        name: project.name,
        client: project.client,
        status: project.status,
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await backend.project.update({
        id: project.id,
        name: data.name,
        client: data.client,
        status: data.status,
      });
      toast({ title: "Projektas atnaujintas!" });
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida atnaujinant projektą", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redaguoti projektą</DialogTitle>
          <DialogDescription>
            Atnaujinkite projekto informaciją
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pavadinimas</Label>
              <Input
                id="name"
                {...register("name", { required: true })}
                placeholder="Projekto pavadinimas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Klientas</Label>
              <Input
                id="client"
                {...register("client", { required: true })}
                placeholder="Kliento pavadinimas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statusas</Label>
              <Select value={status} onValueChange={(value: string) => setValue("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkite statusą" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saugoma..." : "Išsaugoti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
