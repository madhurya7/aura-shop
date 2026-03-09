import { useState } from "react";
import { useShippingZones, useShippingZoneMutations, type ShippingZone } from "@/hooks/useShippingZones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCountryName } from "@/lib/countries";

interface ZoneForm {
  name: string;
  countries: string;
  currency_code: string;
  currency_symbol: string;
  exchange_rate: string;
  standard_rate: string;
  express_rate: string;
  standard_days: string;
  express_days: string;
  free_delivery_above: string;
}

const emptyForm: ZoneForm = {
  name: "",
  countries: "",
  currency_code: "USD",
  currency_symbol: "$",
  exchange_rate: "1.0",
  standard_rate: "0",
  express_rate: "0",
  standard_days: "7-14 days",
  express_days: "3-5 days",
  free_delivery_above: "200",
};

export default function AdminShippingZones() {
  const { data: zones, isLoading } = useShippingZones();
  const { addZone, updateZone, deleteZone } = useShippingZoneMutations();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ShippingZone | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (zone: ShippingZone) => {
    setEditing(zone);
    setForm({
      name: zone.name,
      countries: zone.countries.join(", "),
      currency_code: zone.currency_code,
      currency_symbol: zone.currency_symbol,
      exchange_rate: String(zone.exchange_rate),
      standard_rate: String(zone.standard_rate),
      express_rate: String(zone.express_rate),
      standard_days: zone.standard_days,
      express_days: zone.express_days,
      free_delivery_above: String(zone.free_delivery_above),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: "Zone name is required", variant: "destructive" });
      return;
    }

    const countriesArr = form.countries.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    const payload = {
      name: form.name,
      countries: countriesArr,
      currency_code: form.currency_code,
      currency_symbol: form.currency_symbol,
      exchange_rate: parseFloat(form.exchange_rate) || 1,
      standard_rate: parseFloat(form.standard_rate) || 0,
      express_rate: parseFloat(form.express_rate) || 0,
      standard_days: form.standard_days,
      express_days: form.express_days,
      free_delivery_above: parseFloat(form.free_delivery_above) || 0,
    };

    try {
      if (editing) {
        await updateZone.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Shipping zone updated" });
      } else {
        await addZone.mutateAsync(payload);
        toast({ title: "Shipping zone created" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteZone.mutateAsync(deleteTarget.id);
      toast({ title: "Shipping zone deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Define shipping zones, rates, and currency for each region
        </p>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Zone
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead>Countries</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Standard</TableHead>
              <TableHead className="text-right">Express</TableHead>
              <TableHead className="text-right">Free Above</TableHead>
              <TableHead className="text-right">Exchange Rate</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones?.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {zone.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                  {zone.countries.includes("*")
                    ? "All remaining"
                    : zone.countries.map(getCountryName).join(", ")}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                    {zone.currency_symbol} {zone.currency_code}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {zone.currency_symbol}{zone.standard_rate}
                  <span className="text-xs text-muted-foreground ml-1">({zone.standard_days})</span>
                </TableCell>
                <TableCell className="text-right">
                  {zone.currency_symbol}{zone.express_rate}
                  <span className="text-xs text-muted-foreground ml-1">({zone.express_days})</span>
                </TableCell>
                <TableCell className="text-right font-medium text-sm">
                  {zone.free_delivery_above > 0 ? `$${zone.free_delivery_above}` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {zone.exchange_rate}x
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(zone)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(zone)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!zones || zones.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No shipping zones defined. Add your first zone!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Shipping Zone" : "Add Shipping Zone"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update zone details." : "Define a new shipping zone with rates and currency."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Zone Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Europe" />
            </div>
            <div>
              <Label>Country Codes (comma-separated, use * for Rest of World)</Label>
              <Input value={form.countries} onChange={(e) => setForm({ ...form, countries: e.target.value })} placeholder="e.g. GB, DE, FR or *" />
              <p className="text-xs text-muted-foreground mt-1">Use ISO 2-letter codes: IN, US, GB, DE, etc.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Currency Code</Label>
                <Input value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value })} placeholder="USD" />
              </div>
              <div>
                <Label>Symbol</Label>
                <Input value={form.currency_symbol} onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })} placeholder="$" />
              </div>
              <div>
                <Label>Exchange Rate (from USD)</Label>
                <Input type="number" step="0.01" min="0" value={form.exchange_rate} onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Standard Rate</Label>
                <Input type="number" step="0.01" min="0" value={form.standard_rate} onChange={(e) => setForm({ ...form, standard_rate: e.target.value })} />
              </div>
              <div>
                <Label>Express Rate</Label>
                <Input type="number" step="0.01" min="0" value={form.express_rate} onChange={(e) => setForm({ ...form, express_rate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Standard Delivery Time</Label>
                <Input value={form.standard_days} onChange={(e) => setForm({ ...form, standard_days: e.target.value })} placeholder="7-14 days" />
              </div>
              <div>
                <Label>Express Delivery Time</Label>
                <Input value={form.express_days} onChange={(e) => setForm({ ...form, express_days: e.target.value })} placeholder="3-5 days" />
              </div>
            </div>
            <div>
              <Label>Free Delivery Above (USD cart total, 0 = no free delivery)</Label>
              <Input type="number" step="1" min="0" value={form.free_delivery_above} onChange={(e) => setForm({ ...form, free_delivery_above: e.target.value })} placeholder="200" />
              <p className="text-xs text-muted-foreground mt-1">If cart subtotal (in USD) exceeds this amount, shipping is free.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={addZone.isPending || updateZone.isPending}>
                {(addZone.isPending || updateZone.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? "Save Changes" : "Create Zone"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipping Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
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
