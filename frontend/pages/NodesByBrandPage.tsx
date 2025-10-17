import React from "react";

const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderOpen, FileText, Upload, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddNodeDialog } from "@/components/AddNodeDialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
        const parts = fileName.split("_");
        
        const productCode = parts[0] || "UNKNOWN";
        const brandName = parts[1] || "UNKNOWN";
        const partName = parts[2] || fileName;
        const description = parts[3] || "Aprašymas";

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
              Failai bus grupuojami pagal brando pavadinimą iš failo pavadinimo (pvz: PRODUKTAS_BRANDAS_MAZGAS_APRASYMAS.pdf)
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
              <BrandFolder key={brand.name} brandName={brand.name} count={brand.count} />
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

function BrandFolder({ brandName, count }: { brandName: string; count: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["nodes-by-brand", brandName],
    queryFn: async () => backend.nodes.listByBrand({ brandName }),
  });

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
          <div className="space-y-2 pt-2">
            {data?.nodes.map((node) => (
              <NodeItem key={node.id} node={node} />
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function NodeItem({ node }: { node: any }) {
  const handleDownload = async () => {
    const { url } = await backend.nodes.getPdfUrl({ pdfPath: node.pdfUrl });
    window.open(url, "_blank");
  };

  return (
    <div
      className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted cursor-pointer transition-colors"
      onClick={handleDownload}
    >
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-red-600" />
        <div>
          <p className="font-medium text-sm">{node.partName}</p>
          <p className="text-xs text-muted-foreground">{node.description}</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {node.productCode}
      </div>
    </div>
  );
}
