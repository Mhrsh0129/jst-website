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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quantityNum = parseFloat(quantity) || 0;
  const totalAmount = quantityNum * Number(product.price_per_meter);

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

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: userId,
          status: "pending",
          total_amount: totalAmount,
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
        price_per_meter: product.price_per_meter,
        total_price: totalAmount,
        customer_id: userId,
      });

      if (itemError) throw itemError;

      // Generate bill
      const { data: billNumData } = await supabase.rpc("generate_bill_number");
      const billNumber = billNumData || `INV-${Date.now()}`;

      const taxAmount = totalAmount * 0.18; // 18% GST
      const totalWithTax = totalAmount + taxAmount;

      const { error: billError } = await supabase.from("bills").insert({
        bill_number: billNumber,
        customer_id: userId,
        order_id: order.id,
        subtotal: totalAmount,
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
              ₹{Number(product.price_per_meter)}/meter
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
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>₹{(totalAmount * 0.18).toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary flex items-center">
                <IndianRupee className="w-4 h-4" />
                {(totalAmount * 1.18).toLocaleString()}
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
