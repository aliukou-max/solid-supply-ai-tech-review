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

export function NodesByProductPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const { data: partsData, refetch } = useQuery({
    queryKey: ["nodes-parts"],
    queryFn: async () => backend.nodes.listParts(),
  });

  const parts = partsData?.parts || [];
  const totalNodes = parts.reduce((sum, p) => sum + p.count, 0);

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
      title="Mazgai per gaminius"
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
            <h2 className="text-xl font-bold">Mazgai pagal detales</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {parts.length} detalių tipų • {totalNodes} mazgų
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
        
        {parts.length === 0 ? (
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
            {parts.map((part) => (
              <PartFolder key={part.partName} partName={part.partName} count={part.count} onUpdate={refetch} />
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

function PartFolder({ partName, count, onUpdate }: { partName: string; count: number; onUpdate: () => void }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["nodes-by-part", partName],
    queryFn: async () => backend.nodes.listByPartName({ partName }),
  });

  const handleNodeUpdate = () => {
    refetch();
    onUpdate();
  };

  return (
    <AccordionItem value={partName} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-lg">{partName}</span>
          <span className="text-sm text-muted-foreground">({count} mazgų)</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Kraunama...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
            {(data?.nodes || []).map((node: any) => (
              <NodeCard key={node.id} node={node} onUpdate={handleNodeUpdate} />
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function NodeCard({ node, onUpdate }: { node: any; onUpdate: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const { url } = await backend.nodes.getPdfUrl({ pdfPath: node.pdfUrl });
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to open PDF:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atidaryti PDF",
        variant: "destructive",
      });
    }
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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer" onClick={handleDownload}>
        <div className="relative aspect-[3/4] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center">
          <FileText className="h-16 w-16 text-red-600 dark:text-red-400" />
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            PDF
          </div>
        </div>
        <div className="p-3">
          <p className="font-medium text-sm truncate">{node.brandName}</p>
          <p className="text-xs text-muted-foreground truncate">{node.description}</p>
          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Redaguoti
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>

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
              Šis veiksmas negrįžtamas. Mazgas "{node.partName}" - "{node.brandName}" bus ištrintas.
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
