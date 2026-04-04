import { useState, useEffect } from "react";
import { base44 } from "@/api/mockBase44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  Link2,
  X,
  Pencil,
} from "lucide-react";

const EMPTY_ITEM = {
  title: "",
  description: "",
  image_url: "",
  project_url: "",
  category: "",
  tags: [],
};

export default function StudentPortfolioTab({ profileId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = new
  const [form, setForm] = useState(EMPTY_ITEM);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    base44.entities.Portfolio.filter(
      { student_profile_id: profileId },
      "-created_date",
      50,
    ).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [profileId]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_ITEM);
    setTagInput("");
    setDialogOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...item });
    setTagInput("");
    setDialogOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, image_url: file_url }));
    setImageUploading(false);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t))
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const removeTag = (t) =>
    setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, student_profile_id: profileId };
    if (editing) {
      const updated = await base44.entities.Portfolio.update(editing.id, data);
      setItems((is) =>
        is.map((i) => (i.id === editing.id ? { ...i, ...data } : i)),
      );
    } else {
      const created = await base44.entities.Portfolio.create(data);
      setItems((is) => [created, ...is]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this portfolio item?")) return;
    setDeletingId(id);
    await base44.entities.Portfolio.delete(id);
    setItems((is) => is.filter((i) => i.id !== id));
    setDeletingId(null);
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          className="gradient-primary text-white border-0 gap-1"
          onClick={openNew}
        >
          <Plus className="w-4 h-4" /> Add Portfolio Item
        </Button>
      </div>

      {items.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-foreground text-sm">
              No portfolio items yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Showcase your best work to attract clients.
            </p>
            <Button
              size="sm"
              className="mt-4 gradient-primary text-white border-0"
              onClick={openNew}
            >
              Add First Item
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="border-border overflow-hidden group">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-muted/50 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}
              {item.project_url && (
                <a
                  href={item.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Link2 className="w-3 h-3" /> View Project
                </a>
              )}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Portfolio Item" : "Add Portfolio Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. E-commerce Website Redesign"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe this project..."
              />
            </div>
            <div>
              <Label>Cover Image</Label>
              <label className="mt-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    className="w-full h-28 object-cover rounded"
                    alt="cover"
                  />
                ) : imageUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">
                      Click to upload image
                    </span>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                />
              </label>
            </div>
            <div>
              <Label>Project URL</Label>
              <Input
                className="mt-1"
                value={form.project_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, project_url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                className="mt-1"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="e.g. Web Design, Mobile App"
              />
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  placeholder="Add a tag"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addTag}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="text-xs gap-1 pr-1"
                  >
                    {t}
                    <button
                      onClick={() => removeTag(t)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white border-0"
              onClick={handleSave}
              disabled={saving || !form.title}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editing ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
