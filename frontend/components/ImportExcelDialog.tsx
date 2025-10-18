import React, { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Eye, Info, Edit3 } from "lucide-react";
import backend from "~backend/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface PreviewData {
  projectCode: string;
  projectName: string;
  clientName: string;
  sheetName: string;
  columnMapping: {
    ssCodeColumn: string;
    productNameColumn: string;
    descriptionColumn: string;
    confidence: "high" | "medium" | "low";
    alternativeDescriptionColumns: string[];
  };
  previewRows: Array<{
    ssCode: string;
    productName: string;
    description: string;
    rowNumber: number;
    detectedType: string | null;
    detectedTypeId: string | null;
    matchedKeyword: string | null;
  }>;
  totalRowsFound: number;
  warnings: string[];
}

export function ImportExcelDialog({ open, onOpenChange, onSuccess }: ImportExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [manualTypeOverrides, setManualTypeOverrides] = useState<Record<string, string>>({});
  const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [importResult, setImportResult] = useState<{ projectId: string; projectName: string; productsCreated: number } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any[]>([]);
  const [showAIDebug, setShowAIDebug] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
        setPreviewData(null);
        setWarnings([]);
        setImportResult(null);
        setFileData(null);
      } else {
        toast({
          title: "Klaida",
          description: "Pasirinkite Excel failą (.xlsx arba .xls)",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    const loadProductTypes = async () => {
      try {
        const { productTypes } = await backend.product_types.list();
        setProductTypes(productTypes);
      } catch (error) {
        console.error("Failed to load product types:", error);
        toast({
          title: "Klaida",
          description: "Nepavyko pakrauti produktų tipų",
          variant: "destructive",
        });
      }
    };
    if (open) {
      loadProductTypes();
    }
  }, [open]);

  const handlePreview = async () => {
    if (!file) {
      toast({
        title: "Klaida",
        description: "Pasirinkite Excel failą",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setPreviewData(null);
    setManualTypeOverrides({});

    toast({
      title: "Analizuojama...",
      description: "Nuskaitomi stulpeliai ir duomenys",
      duration: 1500,
    });

    try {
      const reader = new FileReader();
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setFileData(base64);
          
          backend.techReview.previewExcel({
            fileData: base64,
            filename: file.name,
          })
            .then(result => {
              setPreviewData(result);
              toast({
                title: "Peržiūra paruošta",
                description: `Rasta ${result.totalRowsFound} produktų`,
              });
              resolve();
            })
            .catch(reject);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error("Failed to preview Excel:", error);
      toast({
        title: "Klaida",
        description: `Nepavyko peržiūrėti Excel failo: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file || !fileData) {
      toast({
        title: "Klaida",
        description: "Trūksta duomenų importui",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setWarnings([]);
    setImportResult(null);

    toast({
      title: "Vyksta importas...",
      description: "Prašome palaukti",
      duration: 1500,
    });

    try {
      const result = await backend.techReview.importExcel({
        fileData: fileData,
        filename: file.name,
        manualTypeOverrides: Object.keys(manualTypeOverrides).length > 0 ? manualTypeOverrides : undefined,
      });

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
          handleClose();
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to import Excel:", error);
      toast({
        title: "Klaida",
        description: `Nepavyko importuoti Excel failo: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setWarnings([]);
    setFile(null);
    setFileData(null);
    setPreviewData(null);
    setImportResult(null);
    setAiAnalysisResults([]);
    setShowAIDebug(false);
    onOpenChange(false);
  };

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; text: string }> = {
      high: { variant: "default", text: "Aukštas tikslumas" },
      medium: { variant: "secondary", text: "Vidutinis tikslumas" },
      low: { variant: "destructive", text: "Žemas tikslumas" },
    };
    const config = variants[confidence];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Estimation Excel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!previewData && !importResult && (
            <>
              <div className="space-y-2">
                <Label htmlFor="excel-file">Pasirinkite Estimation Excel failą</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={isLoading}
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Pasirinktas: {file.name}
                  </p>
                )}
              </div>

              <div className="bg-muted/50 rounded-md p-3 text-sm space-y-2">
                <p className="font-medium">Sistema automatiškai:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Nuskaitys projekto informaciją (C8-C10)</li>
                  <li>Aptiks SS kodų, pavadinimų ir aprašymų stulpelius</li>
                  <li>Parodys peržiūrą patvirtinimui</li>
                  <li>Sukurs projektą, produktus ir tech review korteles</li>
                  <li>AI išanalizuos aprašymus į komponentus</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Atšaukti
                </Button>
                <Button onClick={handlePreview} disabled={!file || isLoading}>
                  <Eye className="h-4 w-4 mr-2" />
                  {isLoading ? "Analizuojama..." : "Peržiūrėti"}
                </Button>
              </div>
            </>
          )}

          {previewData && !importResult && (
            <>
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{previewData.projectName}</h3>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p>Projekto kodas: <span className="font-medium text-foreground">{previewData.projectCode}</span></p>
                        {previewData.clientName && (
                          <p>Klientas: <span className="font-medium text-foreground">{previewData.clientName}</span></p>
                        )}
                        <p>Lapas: <span className="font-medium text-foreground">{previewData.sheetName}</span></p>
                        <p>Produktų rasta: <span className="font-medium text-foreground">{previewData.totalRowsFound}</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Aptikti stulpeliai
                    </h4>
                    {getConfidenceBadge(previewData.columnMapping.confidence)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground text-xs mb-1">SS kodas</p>
                      <p className="font-medium">{previewData.columnMapping.ssCodeColumn}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground text-xs mb-1">Pavadinimas</p>
                      <p className="font-medium">{previewData.columnMapping.productNameColumn}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground text-xs mb-1">Aprašymas</p>
                      <p className="font-medium">{previewData.columnMapping.descriptionColumn}</p>
                    </div>
                  </div>

                  {previewData.columnMapping.alternativeDescriptionColumns.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Alternatyvūs aprašymo stulpeliai: {previewData.columnMapping.alternativeDescriptionColumns.join(", ")}
                    </p>
                  )}
                </div>

                {previewData.warnings.length > 0 && (
                  <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium text-sm mb-2 text-amber-900 dark:text-amber-100">
                          Pastabos:
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {previewData.warnings.map((warning, idx) => (
                            <p key={idx} className="text-xs text-amber-900 dark:text-amber-100">
                              • {warning}
                            </p>
                          ))}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Duomenų pavyzdys (pirmi 5)</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {previewData.previewRows.map((row, idx) => {
                      const currentTypeId = manualTypeOverrides[row.ssCode] || row.detectedTypeId;
                      const currentType = productTypes.find(t => t.id === currentTypeId);
                      const isUnmatched = !row.matchedKeyword;
                      
                      return (
                        <div key={idx} className={`border rounded-md p-3 space-y-2 text-sm ${isUnmatched ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500' : 'bg-muted/30'}`}>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex gap-3">
                                <span className="text-muted-foreground text-xs">Eilutė {row.rowNumber}</span>
                                <span className="font-medium">{row.ssCode}</span>
                              </div>
                              <p className="font-medium text-base">{row.productName}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-background rounded p-2">
                              <p className="text-muted-foreground text-xs mb-1">Aptiktas tipas:</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{currentType?.name || 'Nėra'}</span>
                                {row.matchedKeyword && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    "{row.matchedKeyword}"
                                  </Badge>
                                )}
                                {isUnmatched && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Neaptikta
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Edit3 className="h-3 w-3" />
                                Pakeisti tipą:
                              </Label>
                              <Select
                                value={currentTypeId || ""}
                                onValueChange={(value) => {
                                  setManualTypeOverrides(prev => ({
                                    ...prev,
                                    [row.ssCode]: value
                                  }));
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Pasirinkite tipą" />
                                </SelectTrigger>
                                <SelectContent>
                                  {productTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id} className="text-xs">
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {row.description ? (
                            <div className="bg-background rounded p-2 text-xs">
                              <p className="text-muted-foreground mb-1">Aprašymas:</p>
                              <p className="whitespace-pre-wrap">{row.description.slice(0, 200)}{row.description.length > 200 ? '...' : ''}</p>
                            </div>
                          ) : (
                            <div className="bg-destructive/10 rounded p-2 text-xs text-destructive">
                              Aprašymas nerastas
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Atšaukti
                </Button>
                <Button onClick={handleConfirmImport} disabled={isLoading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? "Importuojama..." : `Patvirtinti ir importuoti (${previewData.totalRowsFound})`}
                </Button>
              </div>
            </>
          )}

          {importResult && (
            <>
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
                <Button type="button" onClick={handleClose}>
                  Uždaryti
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
