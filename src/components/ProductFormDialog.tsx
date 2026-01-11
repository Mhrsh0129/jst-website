import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface ProductFormData {
  name: string;
  description: string;
  price_per_meter: string;
  category: string;
  min_order_quantity: string;
  stock_status: string;
  image_url: string;
}

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  isSaving: boolean;
}

const ProductFormDialog = memo(({ 
  isOpen, 
  onClose, 
  title, 
  onSubmit, 
  formData, 
  setFormData, 
  isSaving 
}: ProductFormDialogProps) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="prod-name">Product Name *</Label>
          <Input
            id="prod-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Premium Pocketing Fabric"
          />
        </div>
        <div>
          <Label htmlFor="prod-description">Description</Label>
          <Textarea
            id="prod-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Product description..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="prod-price">Price per Meter *</Label>
            <Input
              id="prod-price"
              type="number"
              step="0.01"
              value={formData.price_per_meter}
              onChange={(e) => setFormData(prev => ({ ...prev, price_per_meter: e.target.value }))}
              placeholder="₹"
            />
          </div>
          <div>
            <Label htmlFor="prod-min-order">Min Order (m)</Label>
            <Input
              id="prod-min-order"
              type="number"
              value={formData.min_order_quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, min_order_quantity: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Stock Status</Label>
            <Select value={formData.stock_status} onValueChange={(v) => setFormData(prev => ({ ...prev, stock_status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="prod-image-url">Image URL</Label>
          <Input
            id="prod-image-url"
            value={formData.image_url}
            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
));

ProductFormDialog.displayName = "ProductFormDialog";

export default ProductFormDialog;
