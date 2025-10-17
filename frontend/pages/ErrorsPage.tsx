import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload, Edit2, Trash2, FileSpreadsheet, CheckCircle, AlertCircle, Calendar } from "lucide-react";
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

    toast({ 
      title: "Excel importavimas", 
      description: "Excel importavimas bus įgyvendintas netrukus. Kol kas naudokite rankinį įvedimą.",
    });

    event.target.value = "";
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Klaidų registras</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Užfiksuota klaidų</p>
              <p className="text-3xl font-bold">{totalErrors}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Šią savaitę</p>
              <p className="text-3xl font-bold">{thisWeekErrors}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Išspręsta</p>
              <p className="text-3xl font-bold">{resolvedErrors}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Klaidų sąrašas</h2>
            <div className="flex gap-2">
              <Button onClick={() => setAddOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Pridėti klaidą
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Importuoti Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEdit}
                disabled={selectedIds.length !== 1}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Redaguoti
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                disabled={selectedIds.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ištrinti
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Kraunama...</div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nėra užregistruotų klaidų</div>
          ) : (
            <div className="border rounded-lg overflow-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-left w-12">
                      <Checkbox
                        checked={selectedIds.length === errors.length && errors.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left w-16">Nr.</th>
                    <th className="p-3 text-left">Projekto kodas</th>
                    <th className="p-3 text-left">Gaminio kodas</th>
                    <th className="p-3 text-left">Klaidos aprašymas</th>
                    <th className="p-3 text-left w-32">Statusas</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((error, index) => (
                    <tr key={error.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.includes(error.id)}
                          onCheckedChange={(checked) => handleSelectOne(error.id, checked as boolean)}
                        />
                      </td>
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      <td className="p-3 font-medium">{error.projectCode}</td>
                      <td className="p-3">{error.productCode}</td>
                      <td className="p-3">{error.errorDescription}</td>
                      <td className="p-3">
                        <Badge variant={error.isResolved ? "default" : "destructive"}>
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
