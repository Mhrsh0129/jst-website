import { useEffect, useState, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Package,
  Loader2,
  ShoppingCart,
  IndianRupee,
  Plus,
  Edit2,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIChatWidget from "@/components/AIChatWidget";
import OrderModal from "@/components/OrderModal";
import ProductFormDialog, { ProductFormData } from "@/components/ProductFormDialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_per_meter: number;
  category: string;
  min_order_quantity: number;
  stock_status: string;
  image_url: string | null;
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  price_per_meter: "",
  category: "standard",
  min_order_quantity: "1",
  stock_status: "in_stock",
  image_url: "",
};

// Memoized product card for better performance
const ProductCard = memo(({ 
  product, 
  userRole, 
  onEdit, 
  onDelete, 
  onRequestSample, 
  onOrder,
  getCategoryColor
}: {
  product: Product;
  userRole: string | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRequestSample: (product: Product) => void;
  onOrder: (product: Product) => void;
  getCategoryColor: (category: string) => string;
}) => (
  <div className="bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-all">
    {/* Product Image */}
    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
        <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
      </div>
      {/* Admin Edit/Delete Buttons */}
      {userRole === "admin" && (
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>

    <div className="p-6">
      {/* Category Badge */}
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 capitalize ${getCategoryColor(
          product.category
        )}`}
      >
        {product.category}
      </span>

      {/* Product Info */}
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
        {product.name}
      </h3>
      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
        {product.description || "Premium quality pocketing fabric"}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-4">
        <IndianRupee className="w-5 h-5 text-primary" />
        <span className="font-display text-3xl font-bold text-primary">
          {Number(product.price_per_meter)}
        </span>
        <span className="text-muted-foreground text-sm">/ meter</span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Min. Order</span>
          <span className="font-medium text-foreground">
            {product.min_order_quantity} meters
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Availability</span>
          <span
            className={`font-medium ${
              product.stock_status === "in_stock"
                ? "text-green-600"
                : "text-amber-600"
            }`}
          >
            {product.stock_status === "in_stock"
              ? "In Stock"
              : "Limited"}
          </span>
        </div>
      </div>

      {/* Actions - Only for customers, not admin */}
      {userRole !== "admin" && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onRequestSample(product)}
          >
            Request Sample
          </Button>
          <Button
            variant="gold"
            size="sm"
            className="flex-1"
            onClick={() => onOrder(product)}
          >
            <ShoppingCart className="w-4 h-4" />
            Order
          </Button>
        </div>
      )}
    </div>
  </div>
));

ProductCard.displayName = "ProductCard";

const ProductsPage = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // Admin CRUD states
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    
    // Admin can see all products (including inactive), others only active
    const query = userRole === "admin"
      ? supabase.from("products").select("*").order("price_per_meter", { ascending: true })
      : supabase.from("products").select("*").eq("is_active", true).order("price_per_meter", { ascending: true });
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }

    setIsLoadingProducts(false);
  }, [user, userRole, toast]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case "economy":
        return "bg-muted text-muted-foreground";
      case "standard":
        return "bg-secondary text-secondary-foreground";
      case "premium":
        return "bg-accent/20 text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  }, []);

  const handleRequestSample = useCallback(async (product: Product) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("sample_requests").insert({
        customer_id: user.id,
        product_id: product.id,
        product_name: product.name,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Sample Requested!",
        description: `We'll contact you about the ${product.name} sample.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request sample. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Admin functions
  const openAddDialog = useCallback(() => {
    setFormData(initialFormData);
    setIsAddingProduct(true);
  }, []);

  const openEditDialog = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price_per_meter: product.price_per_meter.toString(),
      category: product.category,
      min_order_quantity: product.min_order_quantity.toString(),
      stock_status: product.stock_status,
      image_url: product.image_url || "",
    });
    setIsEditingProduct(true);
  }, []);

  const handleAddProduct = useCallback(async () => {
    if (!formData.name.trim() || !formData.price_per_meter) {
      toast({
        title: "Validation Error",
        description: "Product name and price are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.from("products").insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price_per_meter: parseFloat(formData.price_per_meter),
        category: formData.category,
        min_order_quantity: parseInt(formData.min_order_quantity) || 1,
        stock_status: formData.stock_status,
        image_url: formData.image_url.trim() || null,
        is_active: true,
      }).select().single();

      if (error) throw error;

      setProducts(prev => [...prev, data]);
      toast({ title: "Product added", description: `${formData.name} has been added.` });
      setIsAddingProduct(false);
      setFormData(initialFormData);
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, toast]);

  const handleUpdateProduct = useCallback(async () => {
    if (!editingProduct || !formData.name.trim() || !formData.price_per_meter) {
      toast({
        title: "Validation Error",
        description: "Product name and price are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("products").update({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price_per_meter: parseFloat(formData.price_per_meter),
        category: formData.category,
        min_order_quantity: parseInt(formData.min_order_quantity) || 1,
        stock_status: formData.stock_status,
        image_url: formData.image_url.trim() || null,
      }).eq("id", editingProduct.id);

      if (error) throw error;

      setProducts(prev =>
        prev.map(p =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                price_per_meter: parseFloat(formData.price_per_meter),
                category: formData.category,
                min_order_quantity: parseInt(formData.min_order_quantity) || 1,
                stock_status: formData.stock_status,
                image_url: formData.image_url.trim() || null,
              }
            : p
        )
      );
      toast({ title: "Product updated", description: `${formData.name} has been updated.` });
      setIsEditingProduct(false);
      setEditingProduct(null);
      setFormData(initialFormData);
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [editingProduct, formData, toast]);

  const handleDeleteProduct = useCallback(async (product: Product) => {
    // Use a more reliable confirmation approach
    const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);
      
      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast({ title: "Product deleted", description: `${product.name} has been removed.` });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product. Make sure you have admin permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleOrder = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const categories = ["all", "economy", "standard", "premium"];
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-display text-xl font-bold text-foreground">
                Product Catalog
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              {userRole === "admin" && (
                <Button variant="gold" size="sm" onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Product
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {category === "all" ? "All Products" : category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                userRole={userRole}
                onEdit={openEditDialog}
                onDelete={handleDeleteProduct}
                onRequestSample={handleRequestSample}
                onOrder={handleOrder}
                getCategoryColor={getCategoryColor}
              />
            ))}
          </div>
        )}
      </main>

      {/* Order Modal */}
      {selectedProduct && user && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          userId={user.id}
        />
      )}

      {/* Add/Edit Product Dialogs - Now using external component */}
      <ProductFormDialog
        isOpen={isAddingProduct}
        onClose={() => setIsAddingProduct(false)}
        title="Add New Product"
        onSubmit={handleAddProduct}
        formData={formData}
        setFormData={setFormData}
        isSaving={isSaving}
      />
      <ProductFormDialog
        isOpen={isEditingProduct}
        onClose={() => {
          setIsEditingProduct(false);
          setEditingProduct(null);
        }}
        title="Edit Product"
        onSubmit={handleUpdateProduct}
        formData={formData}
        setFormData={setFormData}
        isSaving={isSaving}
      />

      {/* AI Product Assistant Chat */}
      <AIChatWidget type="product" title="Product Assistant" />
    </div>
  );
};

export default ProductsPage;
