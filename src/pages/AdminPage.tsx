import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAllProducts, type Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Upload, Loader2, ShieldAlert, GripVertical } from "lucide-react";
import AdminOrders from "@/components/AdminOrders";
import AdminShippingZones from "@/components/AdminShippingZones";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  stock_quantity: string;
  image_url: string;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock_quantity: "0",
  image_url: "",
};

function SortableRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="w-10 text-center text-muted-foreground text-xs">
        {product.display_order}
      </TableCell>
      <TableCell>
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="h-10 w-10 rounded object-cover bg-secondary"
        />
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell className="text-muted-foreground">{product.category}</TableCell>
      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
      <TableCell className="text-right">{product.stock_quantity}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(product)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminPage() {
  const { isAdmin, loading: adminLoading, user } = useAdminCheck();
  const { data: products, isLoading } = useAllProducts();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [reordering, setReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Please sign in to access the admin dashboard.</p>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="font-heading text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have admin privileges.</p>
        <Button variant="outline" onClick={() => navigate("/")}>Back to Store</Button>
      </div>
    );
  }

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Image uploaded" });
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      image_url: form.image_url,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editing.id));
    } else {
      const maxOrder = products?.reduce((max, p) => Math.max(max, p.display_order), 0) || 0;
      ({ error } = await supabase.from("products").insert({ ...payload, display_order: maxOrder + 1 }));
    }

    if (error) {
      toast({ title: "Error saving product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Product updated" : "Product created" });
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
    setDeleteTarget(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !products) return;

    const sorted = [...products].sort((a, b) => a.display_order - b.display_order);
    const oldIndex = sorted.findIndex((p) => p.id === active.id);
    const newIndex = sorted.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sorted, oldIndex, newIndex);

    // Optimistically update cache
    queryClient.setQueryData(["all-products"], reordered.map((p, i) => ({ ...p, display_order: i + 1 })));

    setReordering(true);
    try {
      // Batch update all display_order values
      const updates = reordered.map((p, i) =>
        supabase.from("products").update({ display_order: i + 1 }).eq("id", p.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) {
        throw new Error(failed.error.message);
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Order updated" });
    } catch (err: any) {
      toast({ title: "Failed to save order", description: err.message, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
    } finally {
      setReordering(false);
    }
  };

  const sortedProducts = products ? [...products].sort((a, b) => a.display_order - b.display_order) : [];

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Manage your store</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-muted-foreground">
              {reordering ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving order…
                </span>
              ) : (
                "Drag rows to reorder products"
              )}
            </p>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-10 text-center">Order</TableHead>
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext items={sortedProducts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <TableBody>
                      {sortedProducts.map((product) => (
                        <SortableRow
                          key={product.id}
                          product={product}
                          onEdit={openEdit}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                      {sortedProducts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                            No products yet. Add your first product!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </SortableContext>
                </Table>
              </DndContext>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          <AdminOrders />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the product details below." : "Fill in the details for your new product."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Price *</label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Stock</label>
                <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" />
            </div>
            <div>
              <label className="text-sm font-medium">Product Image</label>
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="h-24 w-24 rounded object-cover mb-2 bg-secondary" />
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <label className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploading ? "Uploading..." : "Upload Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
