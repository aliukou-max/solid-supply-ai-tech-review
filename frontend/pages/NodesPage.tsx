import React from "react";
const useState = (React as any).useState;
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Box, Tag, ArrowRight, Settings } from "lucide-react";
import backend from "~backend/client";
import { MainLayout } from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductTypesDialog } from "@/components/ProductTypesDialog";

export function NodesPage() {
  const [productTypesOpen, setProductTypesOpen] = useState(false);
  const { data: productsData } = useQuery({
    queryKey: ["nodes-products"],
    queryFn: async () => backend.nodes.listProducts(),
  });

  const { data: brandsData } = useQuery({
    queryKey: ["nodes-brands"],
    queryFn: async () => backend.nodes.listBrands(),
  });

  const products = productsData?.products || [];
  const brands = brandsData?.brands || [];
  
  const totalProductNodes = products.reduce((sum, p) => sum + p.count, 0);
  const totalBrandNodes = brands.reduce((sum, b) => sum + b.count, 0);

  return (
    <MainLayout 
      title="Mazgų biblioteka"
      actions={
        <Button variant="outline" onClick={() => setProductTypesOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Gaminių tipai
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Link to="/nodes/by-product" className="block">
          <Card className="p-8 hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Box className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Mazgai per gaminius</h2>
                <p className="text-muted-foreground mb-4">
                  Peržiūrėkite ir tvarkykite mazgus pagal gaminių kodus
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{totalProductNodes}</p>
                    <p className="text-xs text-muted-foreground">mazgų</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{products.length}</p>
                    <p className="text-xs text-muted-foreground">gaminių</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="mt-4 group">
                Atidaryti
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </Link>

        <Link to="/nodes/by-brand" className="block">
          <Card className="p-8 hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Tag className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Mazgai per brandą</h2>
                <p className="text-muted-foreground mb-4">
                  Peržiūrėkite ir tvarkykite mazgus pagal brandų pavadinimus
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{totalBrandNodes}</p>
                    <p className="text-xs text-muted-foreground">mazgų</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{brands.length}</p>
                    <p className="text-xs text-muted-foreground">brandų</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="mt-4 group">
                Atidaryti
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </Link>
      </div>

      <ProductTypesDialog 
        open={productTypesOpen}
        onOpenChange={setProductTypesOpen}
      />
    </MainLayout>
  );
}
