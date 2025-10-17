import React from "react";

const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderOpen, FileText, Upload, ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddNodeDialog } from "@/components/AddNodeDialog";
import { EditNodeDialog } from "@/components/EditNodeDialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function NodesByBrandPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const { data: brandsData, refetch } = useQuery({
    queryKey: ["nodes-brands"],
    queryFn: async () => backend.nodes.listBrands(),
  });

  const brands = brandsData?.brands || [];
  const totalNodes = brands.reduce((sum, b) => sum + b.count, 0);

  const handleSuccess = () => {
    setAddOpen(false);
    refetch();
  };

  const processFiles = async (files: File[]) => {
    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      if (file.type !== "application/pdf") continue;

      try {
        const fileName = file.name.replace(".pdf", "");
        const parts = fileName.split(" - ").map(p => p.trim());
        
        const brandName = parts[0] || "UNKNOWN";
        const partName = parts[1] || fileName;
        const description = parts[2] || "Aprašymas";
        const productCode = brandName;

        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        await backend.nodes.create({
          productCode,
          brandName,
          partName,
          description,
          pdfData: base64,
          pdfFilename: file.name,
        });

        successCount++;
      } catch (error) {
        console.error(error);
        errorCount++;
      }
    }

    setUploading(false);
    
    if (successCount > 0) {
      toast({ title: `Sėkmingai įkelta ${successCount} failų` });
      refetch();
    }
    
    if (errorCount > 0) {
      toast({ title: `Nepavyko įkelti ${errorCount} failų`, variant: "destructive" });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files: File[] = [];
    
    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    } else {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i]);
      }
    }

    await processFiles(files);
  };

  const handleFileSelect = async (e: any) => {
    const files = Array.from(e.target.files as FileList);
    await processFiles(files);
    e.target.value = "";
  };

  return (
    <MainLayout
      title="Mazgai per brandą"
      actions={
        <Link to="/nodes">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Grįžti
          </Button>
        </Link>
      }
    >
      <Card 
        className={`p-6 transition-colors ${dragActive ? "border-primary bg-primary/5" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Visi mazgai pagal brandą</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {brands.length} brandų • {totalNodes} mazgų
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Importuoti PDF
                </span>
              </Button>
            </label>
          </div>
        </div>
        
        {dragActive && (
          <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center mb-4">
            <Upload className="h-12 w-12 mx-auto mb-2 text-primary" />
            <p className="text-primary font-medium">Paleiskite PDF failus čia</p>
            <p className="text-xs text-muted-foreground mt-1">
              Failų pavadinimai: BRANDAS - DETALĖ - APRAŠYMAS.pdf (pvz: Dior - Header - Removable.pdf)
            </p>
          </div>
        )}
        
        {brands.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Nėra įkeltų mazgų</p>
            <p className="text-sm text-muted-foreground mb-4">
              Nutempkite PDF failus čia, importuokite arba pridėkite rankiniu būdu
            </p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Pridėti pirmą mazgą
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {brands.map((brand) => (
              <BrandFolder key={brand.name} brandName={brand.name} count={brand.count} onUpdate={refetch} />
            ))}
          </Accordion>
        )}
        
        {uploading && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Upload className="h-4 w-4 inline-block mr-2 animate-pulse" />
            Keliama...
          </div>
        )}
      </Card>

      <AddNodeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  );
}

function BrandFolder({ brandName, count, onUpdate }: { brandName: string; count: number; onUpdate: () => void }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["nodes-by-brand", brandName],
    queryFn: async () => backend.nodes.listByBrand({ brandName }),
  });

  const nodesByPart: Record<string, any[]> = {};
  (data?.nodes || []).forEach((node: any) => {
    if (!nodesByPart[node.partName]) {
      nodesByPart[node.partName] = [];
    }
    nodesByPart[node.partName].push(node);
  });

  const handleNodeUpdate = () => {
    refetch();
    onUpdate();
  };

  return (
    <AccordionItem value={brandName} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-purple-600" />
          <span className="font-medium">{brandName}</span>
          <span className="text-sm text-muted-foreground">({count} mazgų)</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Kraunama...</p>
        ) : (
          <div className="space-y-3 pt-2">
            {Object.entries(nodesByPart).map(([partName, nodes]) => (
              <PartFolder key={partName} partName={partName} nodes={nodes} onUpdate={handleNodeUpdate} />
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function PartFolder({ partName, nodes, onUpdate }: { partName: string; nodes: any[]; onUpdate: () => void }) {
  return (
    <div className="border rounded-md">
      <Accordion type="single" collapsible>
        <AccordionItem value={partName} className="border-none">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">{partName}</span>
              <span className="text-xs text-muted-foreground">({nodes.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2">
            <div className="space-y-1">
              {nodes.map((node) => (
                <NodeItem key={node.id} node={node} onUpdate={onUpdate} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function NodeItem({ node, onUpdate }: { node: any; onUpdate: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    const { url } = await backend.nodes.getPdfUrl({ pdfPath: node.pdfUrl });
    window.open(url, "_blank");
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await backend.nodes.deleteNode({ id: node.id });
      toast({ title: "Mazgas ištrintas sėkmingai" });
      setDeleteOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to delete node:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti mazgo",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={handleDownload}>
          <FileText className="h-3 w-3 text-red-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{node.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <EditNodeDialog
        node={node}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onUpdate}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ar tikrai norite ištrinti?</AlertDialogTitle>
            <AlertDialogDescription>
              Šis veiksmas negrįžtamas. Mazgas "{node.partName}" bus ištrintas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Trinama..." : "Ištrinti"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
