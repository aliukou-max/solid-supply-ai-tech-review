import React from "react";

const useState = (React as any).useState;
import { Upload, FileSpreadsheet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportExcelDialog({ open, onOpenChange, onSuccess }: ImportExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Klaida",
          description: "Pasirinkite Excel failą (.xlsx arba .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Klaida",
        description: "Pasirinkite Excel failą",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      toast({
        title: "Informacija",
        description: "Excel importas dar neįgyvendintas. Paaiškinkite kur Excel faile randasi informacija.",
      });
      
      setFile(null);
      onSuccess();
    } catch (error) {
      console.error("Failed to import Excel:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko importuoti Excel failo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/* @ts-ignore */}
            <FileSpreadsheet className="h-5 w-5" />
            Import Estimation Excel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="excel-file">Pasirinkite Estimation Excel failą</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Pasirinktas: {file.name}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
            <p className="font-medium">Excel failas turėtų turėti:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Projekto kodą</li>
              <li>Projekto pavadinimą</li>
              <li>Gaminių kodus</li>
              <li>Gaminių tipus ir kiekius</li>
              <li>Aprašymą</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Atšaukti
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
            >
              {/* @ts-ignore */}
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Importuojama..." : "Importuoti"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
