import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const PLATAFORMAS = ["tiktok","instagram","youtube","facebook","otra"];
const TIPOS_VIDEO = ["pov","lyrics","clip","dia1","hook","trend","otro"];

const EMPTY = {
  fecha: "", cuenta: "", editor: "", cliente_proyecto: "", plataforma: "tiktok",
  tipo_video: "pov", formato_exacto: "", hook: "", texto_pantalla: "", cancion: "",
  duracion_seg: "", url: "", views: "", likes: "", comments: "", shares: "",
  saves: "", followers_ganados: "", clicks: "", streams_estimados: "", costo_edit: "", notas: ""
};

export default function EditFormModal({ open, edit, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (edit) {
      setForm({ ...EMPTY, ...edit });
    } else {
      setForm({ ...EMPTY, fecha: new Date().toISOString().slice(0, 10) });
    }
  }, [edit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setNum = (key, val) => setForm(f => ({ ...f, [key]: val === "" ? "" : Number(val) }));

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      duracion_seg: form.duracion_seg !== "" ? Number(form.duracion_seg) : undefined,
      views: form.views !== "" ? Number(form.views) : 0,
      likes: form.likes !== "" ? Number(form.likes) : 0,
      comments: form.comments !== "" ? Number(form.comments) : 0,
      shares: form.shares !== "" ? Number(form.shares) : 0,
      saves: form.saves !== "" ? Number(form.saves) : 0,
      followers_ganados: form.followers_ganados !== "" ? Number(form.followers_ganados) : 0,
      clicks: form.clicks !== "" ? Number(form.clicks) : 0,
      streams_estimados: form.streams_estimados !== "" ? Number(form.streams_estimados) : 0,
      costo_edit: form.costo_edit !== "" ? Number(form.costo_edit) : 0,
    };
    if (edit?.id) {
      await base44.entities.Edit.update(edit.id, payload);
    } else {
      await base44.entities.Edit.create(payload);
    }
    setSaving(false);
    onSaved();
  };

  const Field = ({ label, k, type = "text", placeholder = "" }) => (
    <div>
      <Label className="text-xs font-medium mb-1 block">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[k] ?? ""}
        onChange={e => type === "number" ? setNum(k, e.target.value) : set(k, e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-space">{edit ? "Editar registro" : "Nuevo Edit"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Info básica */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" k="fecha" type="date" />
            <Field label="Cuenta" k="cuenta" placeholder="@cuenta" />
            <Field label="Editor" k="editor" placeholder="Nombre del editor" />
            <Field label="Cliente / Proyecto" k="cliente_proyecto" placeholder="Ej: Love Ghost" />
          </div>

          {/* Plataforma y tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium mb-1 block">Plataforma</Label>
              <Select value={form.plataforma} onValueChange={v => set("plataforma", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATAFORMAS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Tipo de Video</Label>
              <Select value={form.tipo_video} onValueChange={v => set("tipo_video", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_VIDEO.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contenido */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Formato exacto" k="formato_exacto" placeholder="Ej: pov montaje" />
            <Field label="Canción" k="cancion" placeholder="Nombre del track" />
          </div>
          <Field label="Hook (primer segundo)" k="hook" placeholder="Frase o acción inicial" />
          <Field label="Texto en pantalla" k="texto_pantalla" placeholder="Texto superpuesto en el video" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duración (seg)" k="duracion_seg" type="number" placeholder="15" />
            <Field label="URL del video" k="url" placeholder="https://..." />
          </div>

          {/* Métricas */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Métricas de rendimiento</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Views" k="views" type="number" placeholder="0" />
            <Field label="Likes" k="likes" type="number" placeholder="0" />
            <Field label="Comments" k="comments" type="number" placeholder="0" />
            <Field label="Shares" k="shares" type="number" placeholder="0" />
            <Field label="Saves" k="saves" type="number" placeholder="0" />
            <Field label="Followers Ganados" k="followers_ganados" type="number" placeholder="0" />
            <Field label="Clicks" k="clicks" type="number" placeholder="0" />
            <Field label="Streams Estimados" k="streams_estimados" type="number" placeholder="0" />
            <Field label="Costo Edit ($)" k="costo_edit" type="number" placeholder="0" />
          </div>

          <div>
            <Label className="text-xs font-medium mb-1 block">Notas</Label>
            <Input
              placeholder="Observaciones adicionales..."
              value={form.notas ?? ""}
              onChange={e => set("notas", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}