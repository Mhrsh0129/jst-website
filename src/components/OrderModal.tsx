import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Package, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price_per_meter: number;
  min_order_quantity: number;
  category: string;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  userId: string;
}

const OrderModal = ({ isOpen, onClose, product, userId }: OrderModalProps) => {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(product.min_order_quantity.toString());
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quantityNum = parseFloat(quantity) || 0;
  let pricePerMeter = Number(product.price_per_meter);
  
  // Apply discount if available
  if (discount > 0) {
    pricePerMeter -= discount;
  }
  
  const totalAmount = quantityNum * pricePerMeter;

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setDiscount(0);
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const { data: coupon, error } = await (supabase
        .from("coupons" as any)
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("product_id", product.id)
        .eq("is_active", true)
        .maybeSingle() as any);

      if (error) throw error;

      if (coupon) {
        const couponData = coupon as any;
        if (couponData.discount_type === "fixed") {
          setDiscount(couponData.discount_value);
          toast({
            title: "Coupon Applied",
            description: `₹${couponData.discount_value} discount applied!`,
          });
        } else {
          const percentageDiscount = (Number(product.price_per_meter) * couponData.discount_value) / 100;
          setDiscount(percentageDiscount);
          toast({
            title: "Coupon Applied",
            description: `${couponData.discount_value}% discount applied!`,
          });
        }
      } else {
        setDiscount(0);
        toast({
          title: "Invalid Coupon",
          description: "This coupon code is not valid for this product.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setDiscount(0);
      toast({
        title: "Error",
        description: "Failed to validate coupon.",
        variant: "destructive",
      });
    }
    setIsValidatingCoupon(false);
  };

  const handleSubmit = async () => {
    if (quantityNum < product.min_order_quantity) {
      toast({
        title: "Invalid Quantity",
        description: `Minimum order is ${product.min_order_quantity} meters`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate order number
      const { data: orderNumData } = await supabase.rpc("generate_order_number");
      const orderNumber = orderNumData || `JST-${Date.now()}`;

      // Calculate amounts with GST
      const subtotal = totalAmount;
      const taxAmount = subtotal * 0.05; // 5% GST
      const totalWithTax = subtotal + taxAmount;

      // Create order with GST-inclusive total
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: userId,
          status: "pending",
          total_amount: totalWithTax,
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity_meters: quantityNum,
        price_per_meter: pricePerMeter, // Already has discount applied
        total_price: subtotal,
        coupon_code: couponCode || null,
        discount_applied: discount,
      });

      if (itemError) throw itemError;

      // Generate bill
      const { data: billNumData } = await supabase.rpc("generate_bill_number");
      const billNumber = billNumData || `INV-${Date.now()}`;

      const { error: billError } = await supabase.from("bills").insert({
        bill_number: billNumber,
        customer_id: userId,
        order_id: order.id,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalWithTax,
        paid_amount: 0,
        balance_due: totalWithTax,
        status: "unpaid",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 30 days from now
      });

      if (billError) throw billError;

      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Order ${orderNumber} has been created. Check your bills for payment details.`,
      });

      onClose();
      setQuantity(product.min_order_quantity.toString());
      setNotes("");
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "Order Failed",
        description: "Could not place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Place Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1 uppercase">
              {product.category}
            </p>
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            <p className="text-primary font-medium">
              {discount > 0 ? (
                <>
                  <span className="line-through text-muted-foreground text-sm">
                    ₹{Number(product.price_per_meter)}
                  </span>
                  <span className="ml-2">₹{pricePerMeter.toFixed(2)}/meter</span>
                </>
              ) : (
                `₹${Number(product.price_per_meter)}/meter`
              )}
            </p>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity (meters){" "}
              <span className="text-muted-foreground text-xs">
                Min: {product.min_order_quantity}m
              </span>
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={product.min_order_quantity}
              step="0.5"
              placeholder={`Minimum ${product.min_order_quantity} meters`}
            />
          </div>

          {/* Coupon Code */}
          <div className="space-y-2">
            <Label htmlFor="coupon">Apply Coupon Code (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={isValidatingCoupon}
              />
              <Button
                type="button"
                onClick={validateCoupon}
                disabled={isValidatingCoupon || !couponCode.trim()}
                size="sm"
                className="whitespace-nowrap"
              >
                {isValidatingCoupon ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
            {discount > 0 && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Discount applied: ₹{discount.toFixed(2)} off
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Special Instructions (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={2}
            />
          </div>

          {/* Order Summary */}
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per meter</span>
              <span>₹{pricePerMeter.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span>{quantityNum}m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (5%)</span>
              <span>₹{(totalAmount * 0.05).toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary flex items-center">
                <IndianRupee className="w-4 h-4" />
                {(totalAmount * 1.05).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || quantityNum < product.min_order_quantity}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              "Place Order"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You'll receive an invoice and can pay via UPI or bank transfer
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
