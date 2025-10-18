import React, { useState } from "react";
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
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any[]>([]);
  const [showAIDebug, setShowAIDebug] = useState(false);
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

    toast({
      title: "Vyksta importas...",
      description: "Prašome palaukti",
      duration: 1500,
    });

    try {
      const reader = new FileReader();
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          
          backend.techReview.importExcel({
            fileData: base64,
            filename: file.name,
          })
            .then(result => {
              setImportResult({
                projectId: result.projectId,
                projectName: result.projectName,
                productsCreated: result.productsCreated,
              });

              if (result.warnings && result.warnings.length > 0) {
                setWarnings(result.warnings);
              }

              if (result.aiAnalysisResults && result.aiAnalysisResults.length > 0) {
                setAiAnalysisResults(result.aiAnalysisResults);
              }

              toast({
                title: "Importuota sėkmingai",
                description: `Projektas "${result.projectName}" sukurtas su ${result.productsCreated} produktais`,
              });

              if (!result.warnings || result.warnings.length === 0) {
                setTimeout(() => {
                  setFile(null);
                  setImportResult(null);
                  onSuccess();
                  onOpenChange(false);
                }, 2000);
              }

              resolve();
            })
            .catch(reject);
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
    setAiAnalysisResults([]);
    setShowAIDebug(false);
    onOpenChange(false);
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

          {aiAnalysisResults.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIDebug(!showAIDebug)}
                className="w-full"
              >
                {showAIDebug ? "Slėpti" : "Rodyti"} AI analizės detalės ({aiAnalysisResults.length})
              </Button>
              
              {showAIDebug && (
                <div className="border rounded-md p-3 bg-muted/30 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {aiAnalysisResults.map((result, idx) => (
                      <div key={idx} className="border-b pb-3 last:border-b-0">
                        <div className="font-medium text-sm mb-1">
                          {result.ssCode} - {result.productName}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Aprašymas:</span>
                            <div className="bg-background rounded p-2 mt-1 max-h-20 overflow-y-auto">
                              {result.description || <span className="text-destructive">TUŠČIA</span>}
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <span className={result.componentsFound > 0 ? "text-green-600" : "text-destructive"}>
                              Komponentų rasta: {result.componentsFound}
                            </span>
                            {result.error && (
                              <span className="text-destructive">Klaida: {result.error}</span>
                            )}
                          </div>
                          {result.aiResponse && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                AI atsakymas
                              </summary>
                              <div className="bg-background rounded p-2 mt-1 max-h-40 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap font-mono">
                                  {result.aiResponse}
                                </pre>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
