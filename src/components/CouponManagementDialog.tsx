import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price_per_meter: number;
}

interface Coupon {
  id: string;
  code: string;
  product_id: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  is_active: boolean;
  product?: Product;
}

interface CouponManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CouponManagementDialog = ({
  isOpen,
  onClose,
}: CouponManagementDialogProps) => {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProductsAndCoupons = async () => {
    setIsLoading(true);
    try {
      // Try fetching only active products first; fall back to all if none
      const { data: productsActive, error: productsActiveError } = await supabase
        .from("products")
        .select("id, name, price_per_meter, is_active")
        .eq("is_active", true);

      if (productsActiveError) throw productsActiveError;

      let finalProducts = productsActive || [];
      if (!finalProducts.length) {
        const { data: productsAll, error: productsAllError } = await supabase
          .from("products")
          .select("id, name, price_per_meter, is_active");
        if (productsAllError) throw productsAllError;
        finalProducts = productsAll || [];
      }

      // Debug visibility
      console.log("CouponManagementDialog: fetched products count:", finalProducts.length);
      setProducts(finalProducts);
      if (!finalProducts.length) {
        toast({
          title: "No products found",
          description: "Create a product first to attach coupons.",
        });
      }

      // Fetch coupons

      const { data: couponsData, error: couponsError } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("coupons" as any)
        .select("*, product:product_id(id, name, price_per_meter)")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .order("created_at", { ascending: false }) as any);

      if (couponsError) throw couponsError;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCoupons((couponsData as any) || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure data loads whenever dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchProductsAndCoupons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!couponCode.trim() || !selectedProduct || !discountValue) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");


      const { error } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("coupons" as any)
        .insert({
          code: couponCode.toUpperCase().trim(),
          product_id: selectedProduct,
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          is_active: true,
          created_by: userData.user.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Coupon "${couponCode}" created successfully`,
      });

      setCouponCode("");
      setDiscountValue("");
      setSelectedProduct("");
      await fetchProductsAndCoupons();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {

      const { error } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("coupons" as any)
        .delete()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq("id", couponId) as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });

      await fetchProductsAndCoupons();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Close handler only; fetch handled by effect above
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Coupons & Discounts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Coupon Form */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-4">Create New Coupon</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon-code">Coupon Code</Label>
                  <Input
                    id="coupon-code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SAVE20, SUMMER2025"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No products found
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (₹{product.price_per_meter})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(value: "fixed" | "percentage") => setDiscountType(value)}
                  >
                    <SelectTrigger id="discount-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-value">
                    Discount Value{" "}
                    <span className="text-xs text-muted-foreground">
                      ({discountType === "fixed" ? "₹" : "%"})
                    </span>
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={
                      discountType === "fixed"
                        ? "e.g., 3 (for 3 rupees off)"
                        : "e.g., 10 (for 10% off)"
                    }
                    step={discountType === "fixed" ? "0.01" : "0.1"}
                    min="0"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Coupon"
                )}
              </Button>
            </form>
          </div>

          {/* Existing Coupons List */}
          <div>
            <h3 className="font-semibold mb-4">Active Coupons</h3>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : coupons.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{coupon.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {coupon.product?.name} •{" "}
                        {coupon.discount_type === "fixed"
                          ? `₹${coupon.discount_value} off`
                          : `${coupon.discount_value}% off`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No coupons yet. Create one above!
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponManagementDialog;
