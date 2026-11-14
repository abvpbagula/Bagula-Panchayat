import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Baby,
  Skull,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  type MasterDataItem,
  broadcastMasterDataUpdate,
  saveMasterDataOverride,
} from "@/lib/masterData";
import { MasterDataService } from "@/lib/api/MasterDataService";
import { logActivity } from "@/lib/activityLog";

interface Props {
  items: MasterDataItem[];
  onRefresh: () => void;
  onEdit: (item: MasterDataItem) => void;
  onDelete: (item: MasterDataItem) => void;
}

export function AdminDelayedDocsMasterManager({
  items,
  onRefresh,
  onEdit,
  onDelete,
}: Props) {
  const [newLabel, setNewLabel] = useState("");
  const [newLabelBn, setNewLabelBn] = useState("");
  const [newScope, setNewScope] = useState<"delayed_registration" | "delayed_birth" | "delayed_death">("delayed_registration");
  const [adding, setAdding] = useState(false);

  // Filter delayed registration master documents
  const delayedDocs = items.filter(
    (i) =>
      i.parent_code === "delayed_registration" ||
      i.parent_code === "delayed_birth" ||
      i.parent_code === "delayed_death"
  );

  // Group 1: Five People Declaration
  const fivePeopleDoc = delayedDocs.find((i) => i.code === "doc_five_people_prodhan");

  // Group 2: Form 10
  const form10Doc = delayedDocs.find((i) => i.code === "doc_form_10_non_availability");

  // Group 3: Daima (For Birth only, 2 documents)
  const daimaAttestationDoc = delayedDocs.find((i) => i.code === "doc_daima_attestation");
  const daimaIdDoc = delayedDocs.find((i) => i.code === "doc_daima_identity");

  // Group 4: Other / Custom documents
  const standardCodes = new Set([
    "doc_five_people_prodhan",
    "doc_form_10_non_availability",
    "doc_daima_attestation",
    "doc_daima_identity",
  ]);

  const otherDocs = delayedDocs.filter((i) => !standardCodes.has(i.code));

  // Quick stats
  const activeCount = delayedDocs.filter((i) => i.is_active).length;
  const birthActiveCount = delayedDocs.filter(
    (i) => i.is_active && (i.parent_code === "delayed_registration" || i.parent_code === "delayed_birth")
  ).length;
  const deathActiveCount = delayedDocs.filter(
    (i) => i.is_active && (i.parent_code === "delayed_registration" || i.parent_code === "delayed_death")
  ).length;

  const handleToggle = async (item: MasterDataItem) => {
    const nextState = !item.is_active;
    saveMasterDataOverride(item.id, nextState);
    toast.success(
      nextState
        ? `Selected for Public: "${item.label}"`
        : `Deselected from Public: "${item.label}"`
    );

    try {
      await supabase
        .from("master_data" as never)
        .update({ is_active: nextState } as never)
        .eq("id", item.id);
      MasterDataService.clearCache();
      broadcastMasterDataUpdate("document_type");
      onRefresh();
    } catch {
      // non-fatal, local override already applied
    }
  };

  const handleAddCustom = async () => {
    const label = newLabel.trim();
    if (!label) {
      toast.error("Please enter a document name");
      return;
    }

    setAdding(true);
    try {
      const code = `doc_delayed_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_${Date.now().toString().slice(-4)}`;
      const sortOrder = (items[items.length - 1]?.sort_order ?? 10) + 1;

      const { data, error } = await supabase
        .from("master_data" as never)
        .insert({
          category: "document_type",
          code,
          label,
          label_bn: newLabelBn.trim() || null,
          parent_code: newScope,
          sort_order: sortOrder,
          is_active: true,
        } as never)
        .select()
        .single();

      if (error) {
        toast.error(`Database error: ${error.message}`);
      } else {
        if (data) {
          saveMasterDataOverride((data as any).id, true);
        }
        await logActivity({
          action: "master_data_add",
          targetType: "document_type",
          targetId: code,
          details: { label, scope: newScope },
        });
        toast.success(`Added document "${label}" to Master Data! Public will now receive this item.`);
        setNewLabel("");
        setNewLabelBn("");
        MasterDataService.clearCache();
        broadcastMasterDataUpdate("document_type");
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Could not add document");
    } finally {
      setAdding(false);
    }
  };

  const handleSeedDelayedDefaults = async () => {
    try {
      const seeds = [
        {
          category: "document_type",
          code: "doc_five_people_prodhan",
          label: "Declaration of Five People with Signature of Prodhan",
          label_bn: "প্রধানের স্বাক্ষরযুক্ত ৫ জন ব্যক্তির ঘোষণাপত্র",
          parent_code: "delayed_registration",
          sort_order: 8,
          is_active: true,
        },
        {
          category: "document_type",
          code: "doc_form_10_non_availability",
          label: "Form-10 Non Availability Certificate",
          label_bn: "ফর্ম-১০ অপ্রাপ্যতা শংসাপত্র",
          parent_code: "delayed_registration",
          sort_order: 9,
          is_active: true,
        },
        {
          category: "document_type",
          code: "doc_daima_attestation",
          label: "Daima Certificate (Midwife Delivery Attestation - For Birth Only)",
          label_bn: "দাইমা প্রত্যয়নপত্র (শুধুমাত্র জন্মের ক্ষেত্রে)",
          parent_code: "delayed_birth",
          sort_order: 10,
          is_active: true,
        },
        {
          category: "document_type",
          code: "doc_daima_identity",
          label: "Daima Identity Proof (Aadhaar / Voter ID - For Birth Only)",
          label_bn: "দাইমার পরিচয়পত্র (শুধুমাত্র জন্মের ক্ষেত্রে)",
          parent_code: "delayed_birth",
          sort_order: 11,
          is_active: true,
        },
      ];

      for (const s of seeds) {
        await supabase
          .from("master_data" as never)
          .upsert(s as never, { onConflict: "category,code" } as never);
      }

      MasterDataService.clearCache();
      broadcastMasterDataUpdate("document_type");
      toast.success("Statutory delayed registration documents seeded to Master Data!");
      onRefresh();
    } catch (err: any) {
      toast.error("Failed to seed: " + err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Master Data Guidance Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Delayed Registration Master Documents Control
            </h3>
            <Badge className="bg-primary text-white text-[10px]">Master Data Only</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Public citizens do <strong>not</strong> have direct configuration access. The public portal will strictly get only what master data has been selected below.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground block">Active for Birth</span>
            <strong className="text-emerald-600 font-mono">{birthActiveCount} docs</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground block">Active for Death</span>
            <strong className="text-slate-700 dark:text-slate-300 font-mono">{deathActiveCount} docs</strong>
          </div>
        </div>
      </div>

      {/* 4 Required Statutory Categories */}
      <div className="grid gap-3">
        {/* 1. Declaration of Five People */}
        <div className="rounded-xl border border-border/50 bg-white/80 dark:bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-primary/30 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="text-sm font-semibold text-foreground">
                Declaration of Five People with the signature of the Prodhan
              </h4>
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                Both Birth & Death
              </Badge>
              {fivePeopleDoc?.is_active ? (
                <Badge className="bg-emerald-600 text-white text-[10px]">Selected (Active)</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Deselected</Badge>
              )}
            </div>
            <p className="text-xs text-primary/80 font-bengali pl-8">
              প্রধানের স্বাক্ষরযুক্ত ৫ জন স্থানীয় গণ্যমান্য ব্যক্তির ঘোষণাপত্র
            </p>
            <p className="text-[11px] text-muted-foreground pl-8">
              Statutory neighborhood testimony under Section 13(3) of RBD Act, countersigned by Pradhan Smt. Susmita Biswas Barman.
            </p>
          </div>

          <div className="flex items-center gap-3 pl-8 sm:pl-0 shrink-0">
            {fivePeopleDoc ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="toggle-five-people"
                  checked={fivePeopleDoc.is_active}
                  onCheckedChange={() => handleToggle(fivePeopleDoc)}
                />
                <Label htmlFor="toggle-five-people" className="text-xs cursor-pointer font-medium">
                  {fivePeopleDoc.is_active ? "Selected" : "Deselected"}
                </Label>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => onEdit(fivePeopleDoc)}
                  title="Edit Master Data Entry"
                >
                  <Edit3 size={13} />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={handleSeedDelayedDefaults} className="text-xs">
                <Plus size={12} className="mr-1" /> Add to Master Data
              </Button>
            )}
          </div>
        </div>

        {/* 2. Form-10 Non Availability Certificate */}
        <div className="rounded-xl border border-border/50 bg-white/80 dark:bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-primary/30 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="text-sm font-semibold text-foreground">
                Form-10 Non Availability Certificate
              </h4>
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                Both Birth & Death
              </Badge>
              {form10Doc?.is_active ? (
                <Badge className="bg-emerald-600 text-white text-[10px]">Selected (Active)</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Deselected</Badge>
              )}
            </div>
            <p className="text-xs text-primary/80 font-bengali pl-8">
              ফর্ম-১০ অপ্রাপ্যতা শংসাপত্র (গ্রাম পঞ্চায়েত উপ-নিবন্ধক কর্তৃক প্রদত্ত)
            </p>
            <p className="text-[11px] text-muted-foreground pl-8">
              Official certificate issued by Bagula 2 No Gram Panchayat Sub-Registrar certifying register search returned no prior entry.
            </p>
          </div>

          <div className="flex items-center gap-3 pl-8 sm:pl-0 shrink-0">
            {form10Doc ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="toggle-form-10"
                  checked={form10Doc.is_active}
                  onCheckedChange={() => handleToggle(form10Doc)}
                />
                <Label htmlFor="toggle-form-10" className="text-xs cursor-pointer font-medium">
                  {form10Doc.is_active ? "Selected" : "Deselected"}
                </Label>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => onEdit(form10Doc)}
                  title="Edit Master Data Entry"
                >
                  <Edit3 size={13} />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={handleSeedDelayedDefaults} className="text-xs">
                <Plus size={12} className="mr-1" /> Add to Master Data
              </Button>
            )}
          </div>
        </div>

        {/* 3. Daima Certificate (For Birth only, 2 documents) */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="text-sm font-semibold text-foreground">
                Daima Certificate (For Birth only, 2 documents)
              </h4>
              <Badge className="bg-amber-600 text-white text-[10px] flex items-center gap-1">
                <Baby size={11} /> Birth Only (2 Documents)
              </Badge>
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-900 dark:text-amber-200">
                Excluded from Death
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground italic">
              Public death registration automatically omits these 2 documents.
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            {/* 3A: Delivery Attestation */}
            <div className="p-3 rounded-lg border border-border/40 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  3A. Daima Delivery Attestation
                </p>
                <p className="text-[11px] text-primary/80 font-bengali">দাইমার প্রসব প্রত্যয়নপত্র</p>
                <p className="text-[10px] text-muted-foreground">Traditional midwife birth certificate</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {daimaAttestationDoc && (
                  <>
                    <Switch
                      checked={daimaAttestationDoc.is_active}
                      onCheckedChange={() => handleToggle(daimaAttestationDoc)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => onEdit(daimaAttestationDoc)}
                    >
                      <Edit3 size={12} />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* 3B: Identity Proof */}
            <div className="p-3 rounded-lg border border-border/40 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  3B. Daima Identity Proof
                </p>
                <p className="text-[11px] text-primary/80 font-bengali">দাইমার পরিচয়পত্র (আধার / ভোটার)</p>
                <p className="text-[10px] text-muted-foreground">Midwife Aadhaar / Voter ID proof</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {daimaIdDoc && (
                  <>
                    <Switch
                      checked={daimaIdDoc.is_active}
                      onCheckedChange={() => handleToggle(daimaIdDoc)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => onEdit(daimaIdDoc)}
                    >
                      <Edit3 size={12} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Other Documents: Add Names & Can Add More Documents */}
        <div className="rounded-xl border border-border/50 bg-white/80 dark:bg-slate-900/60 p-4 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h4 className="text-sm font-semibold text-foreground">
                Other Documents (Add Names & Configure More Documents)
              </h4>
              <Badge variant="outline" className="text-[10px] bg-slate-50">
                {otherDocs.length} Custom Master Docs
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Add any number of document names below into Master Data.
            </span>
          </div>

          {/* Quick Document Name Adder */}
          <div className="p-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Plus size={13} className="text-primary" />
              <span>Add New Document Name to Master Data Catalogue:</span>
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium" htmlFor="custom-doc-name">
                  Document Name (English) *
                </Label>
                <Input
                  id="custom-doc-name"
                  placeholder="e.g. SDO Order Copy, Hospital Slip, Admit Card"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="text-xs h-8 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium" htmlFor="custom-doc-bn">
                  বাংলা নাম (Bengali Label)
                </Label>
                <Input
                  id="custom-doc-bn"
                  placeholder="e.g. এসডিও অর্ডার কপি, হাসপাতাল ছাড়পত্র"
                  value={newLabelBn}
                  onChange={(e) => setNewLabelBn(e.target.value)}
                  className="text-xs h-8 bg-white dark:bg-slate-900 font-bengali"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium" htmlFor="custom-doc-scope">
                  Applicable Scope
                </Label>
                <select
                  id="custom-doc-scope"
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as any)}
                  className="w-full text-xs h-8 rounded-md border border-input bg-white dark:bg-slate-900 px-2 py-1 text-foreground"
                >
                  <option value="delayed_registration">Both Birth & Death</option>
                  <option value="delayed_birth">Birth Only</option>
                  <option value="delayed_death">Death Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                onClick={handleAddCustom}
                disabled={adding}
                className="text-xs h-8 px-4"
              >
                <Plus size={13} className="mr-1" />
                {adding ? "Adding to Master Data…" : "Add Document to Master Data"}
              </Button>
            </div>
          </div>

          {/* List of Custom / Other Documents */}
          {otherDocs.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">
              No additional custom document names added yet. Use the form above to add more names (e.g. SDO Order Copy, School Admit Card).
            </div>
          ) : (
            <div className="divide-y divide-border/30 border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              {otherDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-muted-foreground">4.{idx + 1}</span>
                      <p className="text-xs font-semibold text-foreground">{doc.label}</p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono"
                      >
                        {doc.parent_code === "delayed_birth"
                          ? "Birth Only"
                          : doc.parent_code === "delayed_death"
                          ? "Death Only"
                          : "Birth & Death"}
                      </Badge>
                      {doc.is_active ? (
                        <Badge className="bg-emerald-600 text-white text-[10px]">Selected</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
                      )}
                    </div>
                    {doc.label_bn && (
                      <p className="text-xs text-primary/80 font-bengali">{doc.label_bn}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={doc.is_active}
                      onCheckedChange={() => handleToggle(doc)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => onEdit(doc)}
                      title="Edit Document Name"
                    >
                      <Edit3 size={12} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => onDelete(doc)}
                      title="Delete from Master Data"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
