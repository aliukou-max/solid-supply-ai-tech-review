import { useState } from "react";
import { Upload, X, Edit2, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ComponentPartsTabContentProps {
  partComponentParts: any[];
  allNodesData?: { nodes: any[] };
  allErrorsData?: { errors: any[] };
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
  onPhotoUpload,
  onRemovePhoto,
  onSavePart,
  onDeletePart,
  uploadingPhoto,
}: ComponentPartsTabContentProps) {
  const [editingPart, setEditingPart] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<number, any>>({});

  const updateEditData = (componentPartId: number, field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [componentPartId]: {
        ...(prev[componentPartId] || {}),
        [field]: value
      }
    }));
  };

  const getFieldValue = (componentPart: any, field: string) => {
    const editValue = editData[componentPart.id]?.[field];
    return editValue !== undefined ? editValue : componentPart[field];
  };

  const handleSave = async (componentPartId: number) => {
    await onSavePart(componentPartId, editData[componentPartId] || {});
    setEditingPart(null);
    setEditData(prev => ({ ...prev, [componentPartId]: {} }));
  };

  const handleCancel = (componentPartId: number) => {
    setEditingPart(null);
    setEditData(prev => ({ ...prev, [componentPartId]: {} }));
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
              <span>{componentPart.partName}</span>
              <div className="flex gap-2">
                {editingPart === componentPart.id ? (
                  <>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleSave(componentPart.id)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Išsaugoti
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancel(componentPart.id)}
                    >
                      Atšaukti
                    </Button>
                  </>
                ) : (
                  <>
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
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingPhoto === componentPart.id ? "Keliama..." : "Įkelti nuotrauką"}
                        </span>
                      </Button>
                    </label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingPart(componentPart.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDeletePart(componentPart.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`material-${componentPart.id}`}>Medžiaga</Label>
                <Input
                  id={`material-${componentPart.id}`}
                  value={getFieldValue(componentPart, 'material') || ''}
                  onChange={(e) => updateEditData(componentPart.id, 'material', e.target.value)}
                  disabled={editingPart !== componentPart.id}
                  placeholder="Pvz.: MDF, Fanera..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`finish-${componentPart.id}`}>Apdaila</Label>
                <Input
                  id={`finish-${componentPart.id}`}
                  value={getFieldValue(componentPart, 'finish') || ''}
                  onChange={(e) => updateEditData(componentPart.id, 'finish', e.target.value)}
                  disabled={editingPart !== componentPart.id}
                  placeholder="Pvz.: Dažyta, Laminuota..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`drawing-${componentPart.id}`}>Brėžinio kodas</Label>
                <Input
                  id={`drawing-${componentPart.id}`}
                  value={getFieldValue(componentPart, 'drawingCode') || ''}
                  onChange={(e) => updateEditData(componentPart.id, 'drawingCode', e.target.value)}
                  disabled={editingPart !== componentPart.id}
                  placeholder="Brėžinio kodas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`node-${componentPart.id}`}>Brėžinio mazgas</Label>
                {editingPart === componentPart.id ? (
                  <>
                    <Select
                      value={getFieldValue(componentPart, 'selectedNodeId') || 'none'}
                      onValueChange={(value) => updateEditData(componentPart.id, 'selectedNodeId', value === 'none' ? null : value)}
                    >
                      <SelectTrigger id={`node-${componentPart.id}`}>
                        <SelectValue placeholder="Pasirinkite mazgą..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Nepasirinkta --</SelectItem>
                        {allNodesData?.nodes
                          ?.filter(node => {
                            const partName = componentPart.partName?.toLowerCase().trim() || '';
                            const nodePart = node.partName?.toLowerCase().trim() || '';
                            
                            return partName === nodePart || 
                                   nodePart.includes(partName) || 
                                   partName.includes(nodePart);
                          })
                          .map(node => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.productCode} - {node.brandName} ({node.partName})
                            </SelectItem>
                          ))}
                        {(!allNodesData?.nodes || allNodesData.nodes.filter(node => {
                          const partName = componentPart.partName?.toLowerCase().trim() || '';
                          const nodePart = node.partName?.toLowerCase().trim() || '';
                          return partName === nodePart || 
                                 nodePart.includes(partName) || 
                                 partName.includes(nodePart);
                        }).length === 0) && (
                          <SelectItem value="none" disabled>Nerasta mazgų "{componentPart.partName}"</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {getFieldValue(componentPart, 'selectedNodeId') && getFieldValue(componentPart, 'selectedNodeId') !== 'none' && (() => {
                      const selectedNode = allNodesData?.nodes?.find(n => n.id === getFieldValue(componentPart, 'selectedNodeId'));
                      return selectedNode ? (
                        <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
                          <div className="text-sm font-medium">{selectedNode.productCode} - {selectedNode.brandName}</div>
                          <div className="text-xs text-muted-foreground">{selectedNode.description}</div>
                          <iframe
                            src={`/api/nodes/${selectedNode.id}/pdf`}
                            className="w-full h-96 border rounded"
                            title={`PDF: ${selectedNode.productCode}`}
                          />
                        </div>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-sm">
                      {componentPart.selectedNodeId 
                        ? allNodesData?.nodes?.find(n => n.id === componentPart.selectedNodeId)?.productCode || componentPart.selectedNodeId
                        : 'Nepasirinkta'}
                    </div>
                    {componentPart.selectedNodeId && (() => {
                      const selectedNode = allNodesData?.nodes?.find(n => n.id === componentPart.selectedNodeId);
                      return selectedNode ? (
                        <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
                          <div className="text-sm font-medium">{selectedNode.productCode} - {selectedNode.brandName}</div>
                          <div className="text-xs text-muted-foreground">{selectedNode.description}</div>
                          <iframe
                            src={`/api/nodes/${selectedNode.id}/pdf`}
                            className="w-full h-96 border rounded"
                            title={`PDF: ${selectedNode.productCode}`}
                          />
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`tech-desc-${componentPart.id}`}>Technologinis aprašymas</Label>
              <Textarea
                id={`tech-desc-${componentPart.id}`}
                value={getFieldValue(componentPart, 'technologicalDescription') || ''}
                onChange={(e) => updateEditData(componentPart.id, 'technologicalDescription', e.target.value)}
                disabled={editingPart !== componentPart.id}
                placeholder="Technologinis aprašymas..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`assembly-${componentPart.id}`}>Surinkimo technologija</Label>
              <Textarea
                id={`assembly-${componentPart.id}`}
                value={getFieldValue(componentPart, 'assemblyTechnology') || ''}
                onChange={(e) => updateEditData(componentPart.id, 'assemblyTechnology', e.target.value)}
                disabled={editingPart !== componentPart.id}
                placeholder="Surinkimo technologija..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`notes-${componentPart.id}`}>Pastabos</Label>
              <Textarea
                id={`notes-${componentPart.id}`}
                value={getFieldValue(componentPart, 'notes') || ''}
                onChange={(e) => updateEditData(componentPart.id, 'notes', e.target.value)}
                disabled={editingPart !== componentPart.id}
                placeholder="Pastabos..."
                rows={2}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`done-${componentPart.id}`}
                  checked={getFieldValue(componentPart, 'hasDone')}
                  onCheckedChange={(checked) => updateEditData(componentPart.id, 'hasDone', checked)}
                  disabled={editingPart !== componentPart.id}
                />
                <Label htmlFor={`done-${componentPart.id}`}>Atlikta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`has-node-${componentPart.id}`}
                  checked={getFieldValue(componentPart, 'hasNode')}
                  onCheckedChange={(checked) => updateEditData(componentPart.id, 'hasNode', checked)}
                  disabled={editingPart !== componentPart.id}
                />
                <Label htmlFor={`has-node-${componentPart.id}`}>Turi mazgą</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`errors-${componentPart.id}`}
                  checked={getFieldValue(componentPart, 'hadErrors')}
                  onCheckedChange={(checked) => updateEditData(componentPart.id, 'hadErrors', checked)}
                  disabled={editingPart !== componentPart.id}
                />
                <Label htmlFor={`errors-${componentPart.id}`}>Turėjo klaidų</Label>
              </div>
            </div>

            {getFieldValue(componentPart, 'hadErrors') && (
              <div className="space-y-2">
                <Label>Susijusios klaidos</Label>
                <Select
                  value="none"
                  onValueChange={(value) => {
                    if (value === 'none') return;
                    const currentErrors = getFieldValue(componentPart, 'linkedErrors') || [];
                    updateEditData(componentPart.id, 'linkedErrors', [...currentErrors, parseInt(value)]);
                  }}
                  disabled={editingPart !== componentPart.id}
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
                              if (editingPart !== componentPart.id) return;
                              const currentErrors = getFieldValue(componentPart, 'linkedErrors') || [];
                              updateEditData(componentPart.id, 'linkedErrors', currentErrors.filter((id: number) => id !== errorId));
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
