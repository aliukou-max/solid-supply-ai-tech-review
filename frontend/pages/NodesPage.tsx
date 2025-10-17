import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderOpen, FileText, Upload } from "lucide-react";
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

export function NodesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [dragActiveProduct, setDragActiveProduct] = useState(false);
  const [dragActiveBrand, setDragActiveBrand] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const { data: productsData, refetch: refetchProducts } = useQuery({
    queryKey: ["nodes-products"],
    queryFn: async () => backend.nodes.listProducts(),
  });

  const { data: brandsData, refetch: refetchBrands } = useQuery({
    queryKey: ["nodes-brands"],
    queryFn: async () => backend.nodes.listBrands(),
  });

  const products = productsData?.products || [];
  const brands = brandsData?.brands || [];

  const handleSuccess = () => {
    setAddOpen(false);
    refetchProducts();
    refetchBrands();
  };

  const processFiles = async (files: File[], productCode?: string, brandName?: string) => {
    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      if (file.type !== "application/pdf") continue;

      try {
        const fileName = file.name.replace(".pdf", "");
        const parts = fileName.split("_");
        
        const finalProductCode = productCode || parts[0] || "UNKNOWN";
        const finalBrandName = brandName || parts[1] || "UNKNOWN";
        const partName = parts[2] || fileName;
        const description = parts[3] || "Aprašymas";

        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        await backend.nodes.create({
          productCode: finalProductCode,
          brandName: finalBrandName,
          partName: partName,
          description: description,
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
      refetchProducts();
      refetchBrands();
    }
    
    if (errorCount > 0) {
      toast({ title: `Nepavyko įkelti ${errorCount} failų`, variant: "destructive" });
    }
  };

  const handleProductDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActiveProduct(false);

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

  const handleBrandDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActiveBrand(false);

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

  return (
    <MainLayout
      title="Mazgų biblioteka"
      actions={
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Pridėti mazgą
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className={`p-6 transition-colors ${dragActiveProduct ? "border-primary bg-primary/5" : ""}`}
          onDrop={handleProductDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActiveProduct(true);
          }}
          onDragLeave={() => setDragActiveProduct(false)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Mazgai per gaminius</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>{products.reduce((sum, p) => sum + p.count, 0)} PDF</span>
            </div>
          </div>
          
          {dragActiveProduct && (
            <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center mb-4">
              <Upload className="h-12 w-12 mx-auto mb-2 text-primary" />
              <p className="text-primary font-medium">Paleiskite PDF failus čia</p>
              <p className="text-xs text-muted-foreground mt-1">
                Failai bus grupuojami pagal gaminio kodą iš failo pavadinimo
              </p>
            </div>
          )}
          
          {products.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">Nėra įkeltų mazgų</p>
              <p className="text-xs text-muted-foreground">
                Nutempkite PDF failus čia arba spauskite "Pridėti mazgą"
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {products.map((product) => (
                <ProductFolder key={product.code} productCode={product.code} count={product.count} />
              ))}
            </Accordion>
          )}
          
          {uploading && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Keliama...
            </div>
          )}
        </Card>

        <Card 
          className={`p-6 transition-colors ${dragActiveBrand ? "border-primary bg-primary/5" : ""}`}
          onDrop={handleBrandDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActiveBrand(true);
          }}
          onDragLeave={() => setDragActiveBrand(false)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Mazgai per Brandą</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>{brands.reduce((sum, b) => sum + b.count, 0)} PDF</span>
            </div>
          </div>
          
          {dragActiveBrand && (
            <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center mb-4">
              <Upload className="h-12 w-12 mx-auto mb-2 text-primary" />
              <p className="text-primary font-medium">Paleiskite PDF failus čia</p>
              <p className="text-xs text-muted-foreground mt-1">
                Failai bus grupuojami pagal brando pavadinimą iš failo pavadinimo
              </p>
            </div>
          )}
          
          {brands.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">Nėra įkeltų mazgų</p>
              <p className="text-xs text-muted-foreground">
                Nutempkite PDF failus čia arba spauskite "Pridėti mazgą"
              </p>
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
              Keliama...
            </div>
          )}
        </Card>
      </div>

      <AddNodeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  );
}

function ProductFolder({ productCode, count }: { productCode: string; count: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["nodes-by-product", productCode],
    queryFn: async () => backend.nodes.listByProduct({ productCode }),
  });

  return (
    <AccordionItem value={productCode} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          <span className="font-medium">{productCode}</span>
          <span className="text-sm text-muted-foreground">({count})</span>
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

function BrandFolder({ brandName, count }: { brandName: string; count: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["nodes-by-brand", brandName],
    queryFn: async () => backend.nodes.listByBrand({ brandName }),
  });

  return (
    <AccordionItem value={brandName} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          <span className="font-medium">{brandName}</span>
          <span className="text-sm text-muted-foreground">({count})</span>
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
      className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted cursor-pointer"
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
        {node.brandName}
      </div>
    </div>
  );
}
