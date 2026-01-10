import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_per_meter: number;
  category: string;
  min_order_quantity: number;
  stock_status: string;
}

const ProductsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("price_per_meter", { ascending: true });

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
    };

    if (user) {
      fetchProducts();
    }
  }, [user, toast]);

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

  const getCategoryColor = (category: string) => {
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
  };

  const handleRequestSample = async (product: Product) => {
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
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
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
              <div
                key={product.id}
                className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-all"
              >
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

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRequestSample(product)}
                  >
                    Request Sample
                  </Button>
                  <Button variant="gold" size="sm" className="flex-1">
                    <ShoppingCart className="w-4 h-4" />
                    Order
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductsPage;
