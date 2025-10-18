import { useState, useEffect } from "react";
import { Upload, X, Edit2, Trash2, Save, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import backend from "~backend/client";

interface ComponentPartsTabContentProps {
  partComponentParts: any[];
  allNodesData?: { nodes: any[] };
  allErrorsData?: { errors: any[] };
  productType: string;
  onPhotoUpload: (componentPartId: number, files: FileList) => Promise<void>;
  onRemovePhoto: (componentPartId: number, photoUrl: string) => Promise<void>;
  onSavePart: (componentPartId: number, updates: any) => Promise<void>;
  onDeletePart: (componentPartId: number) => Promise<void>;
  uploadingPhoto: number | null;
}

export function ComponentPartsTabContent({
  partComponentParts,
  allNodesData,
  allErrorsData,
  productType,
  onPhotoUpload,
  onRemovePhoto,
  onSavePart,
  onDeletePart,
  uploadingPhoto,
}: ComponentPartsTabContentProps) {
  const [editData, setEditData] = useState<Record<number, any>>({});
  const [nodeRecommendations, setNodeRecommendations] = useState<Record<number, any[]>>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<number | null>(null);
  const [expandedNodeView, setExpandedNodeView] = useState<number | null>(null);

  const updateEditData = (componentPartId: number, field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [componentPartId]: {
        ...(prev[componentPartId] || {}),
        [field]: value
      }
    }));
  };

  const loadNodeRecommendations = async (componentPart: any) => {
    setLoadingRecommendations(componentPart.id);
    try {
      const result = await backend.nodes.recommendForPart({
        partName: componentPart.partName,
        productType: productType,
        material: componentPart.material,
        finish: componentPart.finish,
      });
      setNodeRecommendations(prev => ({
        ...prev,
        [componentPart.id]: result.recommendations,
      }));
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setLoadingRecommendations(null);
    }
  };

  useEffect(() => {
    partComponentParts.forEach(part => {
      if (!nodeRecommendations[part.id] && !part.selectedNodeId) {
        loadNodeRecommendations(part);
      }
    });
  }, [partComponentParts.map(p => p.id).join(',')]);

  const getFieldValue = (componentPart: any, field: string) => {
    const editValue = editData[componentPart.id]?.[field];
    return editValue !== undefined ? editValue : componentPart[field];
  };

  const handleSave = async (componentPartId: number) => {
    if (Object.keys(editData[componentPartId] || {}).length > 0) {
      await onSavePart(componentPartId, editData[componentPartId]);
      setEditData(prev => ({ ...prev, [componentPartId]: {} }));
    }
  };

  if (partComponentParts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Šiai detalei dar nėra sukurtų mazgų
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {partComponentParts.map((componentPart) => (
        <Card key={componentPart.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-base">{componentPart.partName}</span>
              <div className="flex gap-1">
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) onPhotoUpload(componentPart.id, files);
                        }}
                        disabled={uploadingPhoto === componentPart.id}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={uploadingPhoto === componentPart.id} 
                        className="h-7 px-2"
                        asChild
                      >
                        <span>
                          <Upload className="h-3 w-3" />
                        </span>
                      </Button>
                    </label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDeletePart(componentPart.id)}
                  className="h-7 px-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {componentPart.photos && componentPart.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {componentPart.photos.map((photoUrl: string, idx: number) => (
                  <div key={idx} className="relative h-32 rounded-lg overflow-hidden bg-muted group">
                    <img src={photoUrl} alt={`${componentPart.partName} ${idx + 1}`} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemovePhoto(componentPart.id, photoUrl)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`material-${componentPart.id}`} className="text-xs">Medžiaga</Label>
                <Input
                  id={`material-${componentPart.id}`}
                  value={getFieldValue(componentPart, 'material') || ''}
                  onChange={(e) => updateEditData(componentPart.id, 'material', e.target.value)}
                  onBlur={() => handleSave(componentPart.id)}
                  placeholder="Pvz.: MDF, Fanera..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`finish-${componentPart.id}`} className="text-xs">Apdaila</Label>
                <Input
                  id={`finish-${componentPart.id}`}
                  value={getFieldValue(componentPart, 'finish') || ''}
                  onChange={(e) => updateEditData(componentPart.id, 'finish', e.target.value)}
                  onBlur={() => handleSave(componentPart.id)}
                  placeholder="Pvz.: Dažyta, Laminuota..."
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`drawing-${componentPart.id}`} className="text-xs">Brėžinio kodas</Label>
              <Input
                id={`drawing-${componentPart.id}`}
                value={getFieldValue(componentPart, 'drawingCode') || ''}
                onChange={(e) => updateEditData(componentPart.id, 'drawingCode', e.target.value)}
                onBlur={() => handleSave(componentPart.id)}
                placeholder="Brėžinio kodas"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Brėžinio mazgas</Label>
                {getFieldValue(componentPart, 'selectedNodeId') ? (
                  <Badge variant="default" className="text-xs gap-1 bg-green-600">
                    ✓ Pasirinktas
                  </Badge>
                ) : nodeRecommendations[componentPart.id]?.length > 0 ? (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    {nodeRecommendations[componentPart.id].length} pasiūlymai
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    value={getFieldValue(componentPart, 'selectedNodeId') || "__none__"}
                    onValueChange={(value) => {
                      if (value === "search") {
                        setExpandedNodeView(expandedNodeView === componentPart.id ? null : componentPart.id);
                        return;
                      }
                      if (value === "__clear__") {
                        updateEditData(componentPart.id, 'selectedNodeId', null);
                        updateEditData(componentPart.id, 'hasNode', false);
                        handleSave(componentPart.id);
                        return;
                      }
                      if (value === "__none__") return;
                      updateEditData(componentPart.id, 'selectedNodeId', value);
                      updateEditData(componentPart.id, 'hasNode', true);
                      handleSave(componentPart.id);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder={loadingRecommendations === componentPart.id ? "Ieškoma..." : "Pasirinkite mazgą..."}>
                        {getFieldValue(componentPart, 'selectedNodeId') && (
                          <span>
                            {nodeRecommendations[componentPart.id]?.find(r => r.node.id === getFieldValue(componentPart, 'selectedNodeId'))?.node.partName || 
                             allNodesData?.nodes.find(n => n.id === getFieldValue(componentPart, 'selectedNodeId'))?.partName ||
                             getFieldValue(componentPart, 'selectedNodeId')}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {getFieldValue(componentPart, 'selectedNodeId') && (
                        <SelectItem value="__clear__">-- Išvalyti --</SelectItem>
                      )}
                      {nodeRecommendations[componentPart.id]?.map((rec) => (
                        <SelectItem key={rec.node.id} value={rec.node.id} className="py-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-500/20">
                              {Math.round(rec.matchScore)}
                            </Badge>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{rec.node.partName}</span>
                              <span className="text-xs text-muted-foreground">{rec.node.brandName} • {rec.reason}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      {(!nodeRecommendations[componentPart.id] || nodeRecommendations[componentPart.id]?.length === 0) && (
                        <SelectItem value="__none__" disabled>
                          {loadingRecommendations === componentPart.id ? "Ieškoma pasiūlymų..." : "Nerasta pasiūlymų"}
                        </SelectItem>
                      )}
                      <SelectItem value="search" className="text-blue-600 font-medium">
                        🔍 {expandedNodeView === componentPart.id ? 'Paslėpti' : 'Rodyti'} visus mazgus
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {expandedNodeView === componentPart.id && (
                  <Card className="border-2 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Visi mazgai - {componentPart.partName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedNodeView(null)}
                          className="h-6 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                      {allNodesData?.nodes
                        ?.filter(node => {
                          const partName = componentPart.partName?.toLowerCase() || '';
                          const nodePart = node.partName?.toLowerCase() || '';
                          return nodePart.includes(partName) || partName.includes(nodePart);
                        })
                        .map(node => (
                          <Button
                            key={node.id}
                            variant={getFieldValue(componentPart, 'selectedNodeId') === node.id ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start h-auto py-2 px-3"
                            onClick={() => {
                              updateEditData(componentPart.id, 'selectedNodeId', node.id);
                              updateEditData(componentPart.id, 'hasNode', true);
                              handleSave(componentPart.id);
                              setExpandedNodeView(null);
                            }}
                          >
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-2 w-full">
                                <span className="font-medium text-sm">{node.partName}</span>
                                {node.pdfUrl && (
                                  <ExternalLink className="h-3 w-3 ml-auto" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {node.brandName} • {node.productName}
                              </span>
                            </div>
                          </Button>
                        ))}
                      {allNodesData?.nodes?.filter(node => {
                        const partName = componentPart.partName?.toLowerCase() || '';
                        const nodePart = node.partName?.toLowerCase() || '';
                        return nodePart.includes(partName) || partName.includes(nodePart);
                      }).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Nerasta mazgų su pavadinimu "{componentPart.partName}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`tech-desc-${componentPart.id}`} className="text-xs">Technologinis aprašymas</Label>
              <Textarea
                id={`tech-desc-${componentPart.id}`}
                value={getFieldValue(componentPart, 'technologicalDescription') || ''}
                onChange={(e) => updateEditData(componentPart.id, 'technologicalDescription', e.target.value)}
                onBlur={() => handleSave(componentPart.id)}
                placeholder="Technologinis aprašymas..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`assembly-${componentPart.id}`} className="text-xs">Surinkimo technologija</Label>
              <Textarea
                id={`assembly-${componentPart.id}`}
                value={getFieldValue(componentPart, 'assemblyTechnology') || ''}
                onChange={(e) => updateEditData(componentPart.id, 'assemblyTechnology', e.target.value)}
                onBlur={() => handleSave(componentPart.id)}
                placeholder="Surinkimo technologija..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`notes-${componentPart.id}`} className="text-xs">Pastabos</Label>
              <Textarea
                id={`notes-${componentPart.id}`}
                value={getFieldValue(componentPart, 'notes') || ''}
                onChange={(e) => updateEditData(componentPart.id, 'notes', e.target.value)}
                onBlur={() => handleSave(componentPart.id)}
                placeholder="Pastabos..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex items-center space-x-1.5">
                <Checkbox
                  id={`done-${componentPart.id}`}
                  checked={getFieldValue(componentPart, 'hasDone')}
                  onCheckedChange={(checked) => {
                    updateEditData(componentPart.id, 'hasDone', checked);
                    handleSave(componentPart.id);
                  }}
                />
                <Label htmlFor={`done-${componentPart.id}`} className="text-xs">Atlikta</Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <Checkbox
                  id={`has-node-${componentPart.id}`}
                  checked={getFieldValue(componentPart, 'hasNode')}
                  onCheckedChange={(checked) => {
                    updateEditData(componentPart.id, 'hasNode', checked);
                    handleSave(componentPart.id);
                  }}
                />
                <Label htmlFor={`has-node-${componentPart.id}`} className="text-xs">Turi mazgą</Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <Checkbox
                  id={`errors-${componentPart.id}`}
                  checked={getFieldValue(componentPart, 'hadErrors')}
                  onCheckedChange={(checked) => {
                    updateEditData(componentPart.id, 'hadErrors', checked);
                    handleSave(componentPart.id);
                  }}
                />
                <Label htmlFor={`errors-${componentPart.id}`} className="text-xs">Turėjo klaidų</Label>
              </div>
            </div>

            {getFieldValue(componentPart, 'hadErrors') && (
              <div className="space-y-1">
                <Label className="text-xs">Susijusios klaidos</Label>
                <Select
                  value="none"
                  onValueChange={(value) => {
                    if (value === 'none') return;
                    const currentErrors = getFieldValue(componentPart, 'linkedErrors') || [];
                    updateEditData(componentPart.id, 'linkedErrors', [...currentErrors, parseInt(value)]);
                    handleSave(componentPart.id);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pridėti klaidą..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Pasirinkite klaidą --</SelectItem>
                    {allErrorsData?.errors
                      ?.filter(error => {
                        const partName = componentPart.partName?.toLowerCase() || '';
                        const errorPartName = error.partName?.toLowerCase() || '';
                        const errorDesc = error.errorDescription?.toLowerCase() || '';
                        
                        return errorPartName.includes(partName) || 
                               partName.includes(errorPartName) ||
                               errorDesc.includes(partName);
                      })
                      .map(error => (
                        <SelectItem key={error.id} value={error.id.toString()}>
                          [{error.partName || '?'}] {error.errorDescription}
                        </SelectItem>
                      ))}
                    {allErrorsData?.errors?.filter(error => {
                      const partName = componentPart.partName?.toLowerCase() || '';
                      const errorPartName = error.partName?.toLowerCase() || '';
                      const errorDesc = error.errorDescription?.toLowerCase() || '';
                      return errorPartName.includes(partName) || 
                             partName.includes(errorPartName) ||
                             errorDesc.includes(partName);
                    }).length === 0 && (
                      <SelectItem value="none" disabled>Nerasta klaidų šiai detalei</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {(getFieldValue(componentPart, 'linkedErrors') && getFieldValue(componentPart, 'linkedErrors').length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getFieldValue(componentPart, 'linkedErrors').map((errorId: number) => {
                      const error = allErrorsData?.errors.find(e => e.id === errorId);
                      return error ? (
                        <Badge key={errorId} variant="secondary" className="gap-1">
                          [{error.partName || '?'}] {error.errorDescription}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              const currentErrors = getFieldValue(componentPart, 'linkedErrors') || [];
                              updateEditData(componentPart.id, 'linkedErrors', currentErrors.filter((id: number) => id !== errorId));
                              handleSave(componentPart.id);
                            }}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
