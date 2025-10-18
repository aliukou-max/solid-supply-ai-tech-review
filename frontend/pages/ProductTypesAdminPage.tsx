import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import backend from "~backend/client";
import type { ProductType } from "~backend/product-types/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ProductTypeManagementCard from "@/components/ProductTypeManagementCard";
import AddProductTypeDialog from "@/components/AddProductTypeDialog";

export default function ProductTypesAdminPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const loadProductTypes = async () => {
    try {
      const response = await backend.product_types.list();
      setProductTypes(response.productTypes);
    } catch (error) {
      console.error("Failed to load product types:", error);
      toast({
        title: "Error",
        description: "Failed to load product types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductTypes();
  }, []);

  const handleProductTypeAdded = () => {
    setShowAddDialog(false);
    loadProductTypes();
  };

  const handleProductTypeUpdated = () => {
    loadProductTypes();
  };

  const handleProductTypeDeleted = (id: string) => {
    setProductTypes(productTypes.filter(pt => pt.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Type Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage product types and their default component parts
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product Type
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {productTypes.map((productType) => (
          <ProductTypeManagementCard
            key={productType.id}
            productType={productType}
            onUpdated={handleProductTypeUpdated}
            onDeleted={handleProductTypeDeleted}
          />
        ))}
      </div>

      {productTypes.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No product types yet</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Product Type
          </Button>
        </div>
      )}

      <AddProductTypeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdded={handleProductTypeAdded}
      />
    </div>
  );
}
