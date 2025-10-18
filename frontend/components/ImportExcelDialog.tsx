import React from "react";

const useState = (React as any).useState;
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
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
  onSuccess: () => void;
}

export function ImportExcelDialog({ open, onOpenChange, onSuccess }: ImportExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ projectId: string; projectName: string; productsCreated: number } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
        setWarnings([]);
        setImportResult(null);
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
    setImportResult(null);

    try {
      const reader = new FileReader();
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            
            const result = await backend.techReview.importExcel({
              fileData: base64,
              filename: file.name,
            });

            setImportResult({
              projectId: result.projectId,
              projectName: result.projectName,
              productsCreated: result.productsCreated,
            });

            if (result.warnings && result.warnings.length > 0) {
              setWarnings(result.warnings);
            }

            toast({
              title: "Importuota sėkmingai",
              description: `Projektas "${result.projectName}" sukurtas su ${result.productsCreated} produktais`,
            });

            if (result.warnings.length === 0) {
              setTimeout(() => {
                setFile(null);
                setImportResult(null);
                onSuccess();
              }, 2000);
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
        description: `Nepavyko importuoti Excel failo: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setWarnings([]);
    setFile(null);
    setImportResult(null);
    onOpenChange(false);
    if (importResult) {
      onSuccess();
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
              disabled={isUploading || !!importResult}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Pasirinktas: {file.name}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-md p-3 text-sm space-y-2">
            <p className="font-medium">Sistema automatiškai nuskaitys:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>C8:</strong> Projekto kodas</li>
              <li><strong>C9:</strong> Projekto pavadinimas</li>
              <li><strong>C10:</strong> Kliento pavadinimas</li>
              <li><strong>B26+:</strong> SS kodai</li>
              <li><strong>C26+:</strong> Gaminių pavadinimai</li>
              <li><strong>AC26+:</strong> Aprašymai (AI išanalizuos į komponentus)</li>
            </ul>
            <p className="text-xs text-muted-foreground pt-2">
              ✨ Sistema automatiškai sukurs projektą, produktus ir tech review korteles su AI išanalizuotais komponentais
            </p>
          </div>

          {importResult && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-sm text-green-900 dark:text-green-100">
                    Sėkmingai importuota!
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    Projektas: <strong>{importResult.projectName}</strong> ({importResult.projectId})
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    Sukurta produktų: <strong>{importResult.productsCreated}</strong>
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-sm mb-2 text-amber-900 dark:text-amber-100">
                    Perspėjimai ({warnings.length}):
                  </p>
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
              onClick={handleClose}
            >
              {importResult || warnings.length > 0 ? "Uždaryti" : "Atšaukti"}
            </Button>
            {!importResult && (
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Importuojama..." : "Importuoti"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
