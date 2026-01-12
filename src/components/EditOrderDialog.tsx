import { useState, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  notes: string | null;
  total_amount: number;
}

interface OrderItem {
  id: string;
  quantity_meters: number;
  total_price: number;
  price_per_meter: number;
  product_name: string;
}

interface EditOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onOrderUpdated: () => void;
}

const EditOrderDialog = ({ isOpen, onClose, order, onOrderUpdated }: EditOrderDialogProps) => {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    setIsFetchingInfo(true);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOrderItem(data as unknown as OrderItem);
        setQuantity(data.quantity_meters.toString());
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load order details.",
      });
      onClose();
    } finally {
      setIsFetchingInfo(false);
    }
  }, [order.id, onClose, toast]);

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderDetails();
      setNotes(order.notes || "");
    }
  }, [isOpen, order, fetchOrderDetails]);

  const handleUpdate = async () => {
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
      });
      return;
    }

    if (!orderItem) return;

    setIsLoading(true);
    try {
      const newQuantity = parseFloat(quantity);
      // Assuming price hasn't changed from original order time
      // We use the price_per_meter stored in order_item to preserve the deal
      const pricePerMeter = Number(orderItem.price_per_meter);
      const newSubtotal = newQuantity * pricePerMeter;

      // Calculate totals
      const taxAmount = newSubtotal * 0.05; // 5% GST
      const newTotalWithTax = newSubtotal + taxAmount;

      // 1. Update Order Item
      const { error: itemError } = await supabase
        .from("order_items")
        .update({
          quantity_meters: newQuantity,
          total_price: newSubtotal
        })
        .eq("id", orderItem.id);

      if (itemError) throw itemError;

      // 2. Update Order
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          total_amount: newTotalWithTax,
          notes: notes
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // 3. Update Bill (if exists)
      // We try to find the linked bill
      const { data: bill } = await supabase
        .from("bills")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle();

      if (bill) {
        const { error: billError } = await supabase
          .from("bills")
          .update({
            subtotal: newSubtotal,
            tax_amount: taxAmount,
            total_amount: newTotalWithTax,
            balance_due: newTotalWithTax // Assuming unpaid, reset balance to new total
            // If it was partially paid, this logic would be more complex, 
            // but for "Pending" orders usually no payment is made yet.
          })
          .eq("id", bill.id);

        if (billError) throw billError;
      }

      toast({
        title: "Order Updated",
        description: "Your order details have been updated successfully.",
      });

      onOrderUpdated();
      onClose();

    } catch (error) {
      console.error("Update error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the order. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary" />
            Edit Order
          </DialogTitle>
        </DialogHeader>

        {isFetchingInfo ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium">{orderItem?.product_name}</p>
              <p className="text-xs text-muted-foreground">Price: ₹{orderItem?.price_per_meter}/meter</p>
            </div>

            <div className="space-y-2">
              <Label>Quantity (Meters)</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading || isFetchingInfo || !orderItem}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;
