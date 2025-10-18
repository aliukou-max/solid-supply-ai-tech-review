import React from "react";

const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload, Edit2, Trash2, FileSpreadsheet, CheckCircle, AlertCircle, Calendar, Download } from "lucide-react";
import backend from "~backend/client";
import type { ProductionError } from "~backend/production-errors/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { AddProductionErrorDialog } from "@/components/AddProductionErrorDialog";
import { EditProductionErrorDialog } from "@/components/EditProductionErrorDialog";

export function ErrorsPage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editError, setEditError] = useState<ProductionError | null>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["production-errors"],
    queryFn: () => backend.production_errors.list(),
  });

  const errors = data?.errors || [];
  const totalErrors = errors.length;
  const thisWeekErrors = errors.filter((e) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(e.createdAt) > weekAgo;
  }).length;
  const resolvedErrors = errors.filter((e) => e.isResolved).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(errors.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Nepasirinkta jokių klaidų", variant: "destructive" });
      return;
    }

    try {
      await backend.production_errors.deleteErrors({ ids: selectedIds });
      toast({ title: `Ištrinta klaidų: ${selectedIds.length}` });
      setSelectedIds([]);
      refetch();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida trinant įrašus", variant: "destructive" });
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      toast({ title: "Pasirinkite vieną klaidą redagavimui", variant: "destructive" });
      return;
    }
    const error = errors.find((e) => e.id === selectedIds[0]);
    if (error) {
      setEditError(error);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as Record<string, any>[];

      if (jsonData.length === 0) {
        toast({ title: "Nėra duomenų importavimui", variant: "destructive" });
        return;
      }

      const keys = Object.keys(jsonData[0]);
      const projectKey = keys.find(k => 
        k.toLowerCase().includes("projekt") || 
        k.toLowerCase().includes("project") ||
        k.toLowerCase().includes("proj")
      );
      const productKey = keys.find(k => 
        k.toLowerCase().includes("gamin") || 
        k.toLowerCase().includes("product") ||
        k.toLowerCase().includes("prod")
      );
      const errorKey = keys.find(k => 
        k.toLowerCase().includes("klaid") || 
        k.toLowerCase().includes("error") ||
        k.toLowerCase().includes("apra") ||
        k.toLowerCase().includes("description")
      );

      if (!projectKey || !productKey || !errorKey) {
        toast({ 
          title: "Nerastos reikalingos kolonos", 
          description: "Excel failas turi turėti: Projekto kodas, Gaminio kodas, Klaidos aprašymas",
          variant: "destructive" 
        });
        return;
      }

      const errorsToImport = jsonData
        .filter((row) => row[projectKey] && row[productKey] && row[errorKey])
        .map((row) => ({
          projectCode: String(row[projectKey]).trim(),
          productCode: String(row[productKey]).trim(),
          errorDescription: String(row[errorKey]).trim(),
        }));

      if (errorsToImport.length === 0) {
        toast({ title: "Nėra duomenų importavimui", variant: "destructive" });
        return;
      }

      await backend.production_errors.bulkCreate({ errors: errorsToImport });
      toast({ title: `Importuota klaidų: ${errorsToImport.length}` });
      refetch();
    } catch (error) {
      console.error(error);
      toast({ title: "Klaida importuojant Excel", variant: "destructive" });
    }

    event.target.value = "";
  };

  const handleExportExcel = async () => {
    const exportData = errors.map((e, i) => ({
      Nr: i + 1,
      "Projekto kodas": e.projectCode,
      "Gaminio kodas": e.productCode,
      Detalė: e.partName || "-",
      "Klaidos aprašymas": e.errorDescription,
      Statusas: e.isResolved ? "Išspręsta" : "Aktyvi",
    }));

    const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Klaidos");
    XLSX.writeFile(workbook, `klaidos_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Klaidų registras</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Užfiksuota klaidų</p>
              <p className="text-2xl font-bold">{totalErrors}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Šią savaitę</p>
              <p className="text-2xl font-bold">{thisWeekErrors}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Išspręsta</p>
              <p className="text-2xl font-bold">{resolvedErrors}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Klaidų sąrašas</h2>
            <div className="flex gap-1">
              <Button onClick={() => setAddOpen(true)} size="sm" className="h-8 text-xs px-2">
                <Plus className="h-3 w-3 mr-1" />
                Pridėti
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs px-2" asChild>
                <label>
                  <Upload className="h-3 w-3 mr-1" />
                  Import
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={handleExportExcel}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
                disabled={selectedIds.length !== 1}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={handleDelete}
                disabled={selectedIds.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Kraunama...</div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nėra užregistruotų klaidų</div>
          ) : (
            <div className="border rounded-lg overflow-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left w-10">
                      <Checkbox
                        checked={selectedIds.length === errors.length && errors.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-2 text-left w-12 text-xs">Nr.</th>
                    <th className="p-2 text-left text-xs">Projekto kodas</th>
                    <th className="p-2 text-left text-xs">Gaminio kodas</th>
                    <th className="p-2 text-left text-xs">Detalė</th>
                    <th className="p-2 text-left text-xs">Klaidos aprašymas</th>
                    <th className="p-2 text-left w-24 text-xs">Statusas</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((error, index) => (
                    <tr key={error.id} className="border-t hover:bg-muted/50">
                      <td className="p-2">
                        <Checkbox
                          checked={selectedIds.includes(error.id)}
                          onCheckedChange={(checked) => handleSelectOne(error.id, checked as boolean)}
                        />
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{index + 1}</td>
                      <td className="p-2 text-xs font-medium">{error.projectCode}</td>
                      <td className="p-2 text-xs">{error.productCode}</td>
                      <td className="p-2 text-xs text-muted-foreground">{error.partName || "-"}</td>
                      <td className="p-2 text-xs">{error.errorDescription}</td>
                      <td className="p-2">
                        <Badge variant={error.isResolved ? "default" : "destructive"} className="text-xs">
                          {error.isResolved ? "Išspręsta" : "Aktyvi"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <AddProductionErrorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => {
          setAddOpen(false);
          refetch();
        }}
      />

      {editError && (
        <EditProductionErrorDialog
          error={editError}
          open={!!editError}
          onOpenChange={(open) => !open && setEditError(null)}
          onSuccess={() => {
            setEditError(null);
            setSelectedIds([]);
            refetch();
          }}
        />
      )}
    </div>
  );
}
