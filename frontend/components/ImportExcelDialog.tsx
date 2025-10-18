import React from "react";

const useState = (React as any).useState;
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import backend from "~backend/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

export function ImportExcelDialog({ open, onOpenChange, projectId, onSuccess }: ImportExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
        setWarnings([]);
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
    setWarnings([]);

    try {
      const reader = new FileReader();
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            
            const result = await backend.techReview.importExcel({
              projectId,
              fileData: base64,
              filename: file.name,
            });

            if (result.warnings && result.warnings.length > 0) {
              setWarnings(result.warnings);
            }

            toast({
              title: "Importuota sėkmingai",
              description: `Sukurta ${result.productsCreated} produktų${result.warnings.length > 0 ? ` su ${result.warnings.length} perspėjimais` : ""}`,
            });

            if (result.warnings.length === 0) {
              setFile(null);
              onSuccess();
            }
            
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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

          <div className="bg-muted/50 rounded-md p-3 text-sm space-y-2">
            <p className="font-medium">Excel failo struktūra:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>B stulpelis:</strong> SS kodas (nuo B26)</li>
              <li><strong>C stulpelis:</strong> Gaminio pavadinimas</li>
              <li><strong>AC stulpelis:</strong> Detalus aprašymas</li>
              <li><strong>C8 langelis:</strong> Projekto kodas</li>
            </ul>
            <p className="text-xs text-muted-foreground pt-2">
              Sistema automatiškai nuskaitys visas eilutes nuo B26 iki tuščios eilutės ir AI išanalizuos aprašymus į komponentus su medžiagomis ir apdaila.
            </p>
          </div>

          {warnings.length > 0 && (
            <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-sm mb-2">Perspėjimai ({warnings.length}):</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {warnings.map((warning, idx) => (
                      <p key={idx} className="text-xs text-amber-900 dark:text-amber-100">
                        • {warning}
                      </p>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setWarnings([]);
                setFile(null);
                onOpenChange(false);
              }}
            >
              {warnings.length > 0 ? "Uždaryti" : "Atšaukti"}
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Importuojama..." : "Importuoti"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
