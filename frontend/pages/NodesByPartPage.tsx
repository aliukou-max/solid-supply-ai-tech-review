import React from "react";

const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Edit2, Trash2, FolderOpen } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export function NodesByPartPage() {
  const [searchParams] = useSearchParams();
  const partName = searchParams.get("name") || "";

  const { data, refetch } = useQuery({
    queryKey: ["nodes-by-part", partName],
    queryFn: async () => backend.nodes.listByPartName({ partName }),
  });

  const nodes = data?.nodes || [];

  const nodesByBrand: Record<string, any[]> = {};
  nodes.forEach((node: any) => {
    if (!nodesByBrand[node.brandName]) {
      nodesByBrand[node.brandName] = [];
    }
    nodesByBrand[node.brandName].push(node);
  });

  return (
    <MainLayout
      title={`Mazgai: ${partName}`}
      actions={
        <Link to="/nodes">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Grįžti
          </Button>
        </Link>
      }
    >
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Mazgai detalei "{partName}"</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {Object.keys(nodesByBrand).length} brandų • {nodes.length} mazgų
          </p>
        </div>
        
        {nodes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Nerasta mazgų</p>
            <p className="text-sm text-muted-foreground mb-4">
              Detalei "{partName}" dar nėra pridėtų mazgų
            </p>
            <Link to="/nodes">
              <Button variant="outline">
                Eiti į mazgų bibliotek ą
              </Button>
            </Link>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {Object.entries(nodesByBrand).map(([brandName, brandNodes]) => (
              <BrandFolder key={brandName} brandName={brandName} nodes={brandNodes} onUpdate={refetch} />
            ))}
          </Accordion>
        )}
      </Card>
    </MainLayout>
  );
}

function BrandFolder({ brandName, nodes, onUpdate }: { brandName: string; nodes: any[]; onUpdate: () => void }) {
  return (
    <AccordionItem value={brandName} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-purple-600" />
          <span className="font-medium">{brandName}</span>
          <span className="text-sm text-muted-foreground">({nodes.length} mazgų)</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1 pt-2">
          {nodes.map((node) => (
            <NodeItem key={node.id} node={node} onUpdate={onUpdate} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
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
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={handleDownload}>
          <FileText className="h-4 w-4 text-red-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{node.productCode}</p>
            <p className="text-xs text-muted-foreground truncate">{node.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
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
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
