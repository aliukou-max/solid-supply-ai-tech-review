import React from "react";
const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import backend from "~backend/client";
import type { ProductType, ProductTypePart } from "~backend/product-types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";

interface ProductTypesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductTypesDialog({ open, onOpenChange }: ProductTypesDialogProps) {
  const [newTypeName, setNewTypeName] = useState("");
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [newPartNames, setNewPartNames] = useState<Record<string, string>>({});
  const [editingPart, setEditingPart] = useState<ProductTypePart | null>(null);
  const [editPartName, setEditPartName] = useState("");
  const { toast } = useToast();

  const { data, refetch } = useQuery({
    queryKey: ["product-types"],
    queryFn: async () => backend.product_types.list(),
    enabled: open,
  });

  const [partsData, setPartsData] = useState<Record<string, ProductTypePart[]>>({});

  const loadParts = async (productTypeId: string) => {
    try {
      const { parts } = await backend.product_types.listParts({ productTypeId });
      setPartsData(prev => ({ ...prev, [productTypeId]: parts }));
    } catch (error) {
      console.error("Failed to load parts:", error);
    }
  };

  const toggleExpanded = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
      if (!partsData[typeId]) {
        loadParts(typeId);
      }
    }
    setExpandedTypes(newExpanded);
  };

  const handleCreateType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    try {
      await backend.product_types.create({ name: newTypeName });
      setNewTypeName("");
      refetch();
      toast({ title: "Gaminių tipas sukurtas" });
    } catch (error) {
      console.error("Failed to create product type:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko sukurti gaminių tipo",
        variant: "destructive",
      });
    }
  };

  const handleUpdateType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingType || !editTypeName.trim()) return;

    try {
      await backend.product_types.update({ id: editingType.id, name: editTypeName });
      setEditingType(null);
      setEditTypeName("");
      refetch();
      toast({ title: "Gaminių tipas atnaujintas" });
    } catch (error) {
      console.error("Failed to update product type:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti gaminių tipo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!confirm("Ar tikrai norite ištrinti šį gaminių tipą ir visas jo detales?")) return;

    try {
      await backend.product_types.deleteProductType({ id: typeId });
      refetch();
      toast({ title: "Gaminių tipas ištrintas" });
    } catch (error) {
      console.error("Failed to delete product type:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti gaminių tipo",
        variant: "destructive",
      });
    }
  };

  const handleCreatePart = async (productTypeId: string) => {
    const partName = newPartNames[productTypeId];
    if (!partName?.trim()) return;

    try {
      await backend.product_types.createPart({
        productTypeId,
        name: partName,
      });
      setNewPartNames(prev => ({ ...prev, [productTypeId]: "" }));
      loadParts(productTypeId);
      toast({ title: "Detalė pridėta" });
    } catch (error) {
      console.error("Failed to create part:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko pridėti detalės",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePart = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPart || !editPartName.trim()) return;

    try {
      await backend.product_types.updatePart({ id: editingPart.id, name: editPartName });
      setEditingPart(null);
      setEditPartName("");
      loadParts(editingPart.productTypeId);
      toast({ title: "Detalė atnaujinta" });
    } catch (error) {
      console.error("Failed to update part:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti detalės",
        variant: "destructive",
      });
    }
  };

  const handleDeletePart = async (part: ProductTypePart) => {
    if (!confirm("Ar tikrai norite ištrinti šią detalę?")) return;

    try {
      await backend.product_types.deletePart({ id: part.id });
      loadParts(part.productTypeId);
      toast({ title: "Detalė ištrinta" });
    } catch (error) {
      console.error("Failed to delete part:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti detalės",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gaminių tipai</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleCreateType} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Naujo tipo pavadinimas"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Pridėti tipą
            </Button>
          </form>

          <div className="space-y-2">
            {data?.productTypes.map((type) => (
              <Card key={type.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(type.id)}
                      >
                        {expandedTypes.has(type.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {editingType?.id === type.id ? (
                        <form onSubmit={handleUpdateType} className="flex gap-2 flex-1">
                          <Input
                            value={editTypeName}
                            onChange={(e) => setEditTypeName(e.target.value)}
                            autoFocus
                          />
                          <Button type="submit" size="sm">Išsaugoti</Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingType(null);
                              setEditTypeName("");
                            }}
                          >
                            Atšaukti
                          </Button>
                        </form>
                      ) : (
                        <span className="font-medium">{type.name}</span>
                      )}
                    </div>

                    {!editingType && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingType(type);
                            setEditTypeName(type.name);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteType(type.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {expandedTypes.has(type.id) && (
                    <div className="ml-10 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Naujos detalės pavadinimas"
                          value={newPartNames[type.id] || ""}
                          onChange={(e) =>
                            setNewPartNames(prev => ({ ...prev, [type.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreatePart(type.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCreatePart(type.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-1">
                        {partsData[type.id]?.map((part) => (
                          <div key={part.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                            {editingPart?.id === part.id ? (
                              <form onSubmit={handleUpdatePart} className="flex gap-2 flex-1">
                                <Input
                                  value={editPartName}
                                  onChange={(e) => setEditPartName(e.target.value)}
                                  autoFocus
                                />
                                <Button type="submit" size="sm">Išsaugoti</Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingPart(null);
                                    setEditPartName("");
                                  }}
                                >
                                  Atšaukti
                                </Button>
                              </form>
                            ) : (
                              <>
                                <span className="flex-1 text-sm">{part.name}</span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingPart(part);
                                      setEditPartName(part.name);
                                    }}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePart(part)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
