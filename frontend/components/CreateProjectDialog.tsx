import React from "react";

const useState = (React as any).useState;
import { useForm } from "react-hook-form";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  id: string;
  name: string;
  client: string;
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await backend.project.create(data);
      toast({ title: "Projektas sukurtas sėkmingai" });
      reset();
      onSuccess();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko sukurti projekto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Naujas projektas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id">Projekto ID</Label>
            <Input
              id="id"
              placeholder="pvz. AB109999"
              {...register("id", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Klientas</Label>
            <Input
              id="client"
              placeholder="pvz. Dior"
              {...register("client", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Projekto pavadinimas</Label>
            <Input
              id="name"
              placeholder="pvz. Parduotuvės interjeras"
              {...register("name", { required: true })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Kuriama..." : "Sukurti"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
