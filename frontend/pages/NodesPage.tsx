import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderOpen, FileText } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddNodeDialog } from "@/components/AddNodeDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function NodesPage() {
  const [addOpen, setAddOpen] = useState(false);

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
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Mazgai per gaminius</h2>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nėra įkeltų mazgų
            </p>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {products.map((product) => (
                <ProductFolder key={product.code} productCode={product.code} count={product.count} />
              ))}
            </Accordion>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Mazgai per Brandą</h2>
          {brands.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nėra įkeltų mazgų
            </p>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {brands.map((brand) => (
                <BrandFolder key={brand.name} brandName={brand.name} count={brand.count} />
              ))}
            </Accordion>
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
