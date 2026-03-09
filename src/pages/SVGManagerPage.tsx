import { useState, useCallback } from "react";
import { Upload, Search, Copy, Check, Trash2, Download, Grid3X3, List, Loader2 } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { toast } from "sonner";

interface SVGAsset {
  id: string;
  name: string;
  svg: string;
  category: string;
  size: number; // bytes
  optimizedSize?: number;
  createdAt: string;
}

const CATEGORIES = ["Todos", "Navigation", "Actions", "Status", "Social", "Custom"];

function optimizeSVG(raw: string): { optimized: string; saved: number } {
  const result = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s*xmlns:[\w]+="[^"]*"/g, "")
    .replace(/\s*data-[\w-]+="[^"]*"/g, "")
    .replace(/\s*(id|class)="[^"]*"/g, "")
    .trim();
  const saved = raw.length - result.length;
  return { optimized: result, saved };
}

export function SVGManagerPage() {
  const [assets, setAssets] = useState<SVGAsset[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copied, setCopied] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.name.endsWith(".svg")) {
        toast.error(`${file.name} não é SVG`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const raw = e.target?.result as string;
        const { optimized, saved } = optimizeSVG(raw);
        const asset: SVGAsset = {
          id: crypto.randomUUID(),
          name: file.name.replace(".svg", ""),
          svg: optimized,
          category: "Custom",
          size: raw.length,
          optimizedSize: optimized.length,
          createdAt: new Date().toISOString(),
        };
        setAssets((prev) => [...prev, asset]);
        toast.success(`${file.name} importado! ${saved > 0 ? `(-${saved} bytes otimizado)` : ""}`);
      };
      reader.readAsText(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const copyAsset = (asset: SVGAsset) => {
    navigator.clipboard.writeText(asset.svg);
    setCopied(asset.id);
    toast.success("SVG copiado!");
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadAsset = (asset: SVGAsset) => {
    const blob = new Blob([asset.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success("Asset removido");
  };

  const filtered = assets.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Todos" || a.category === category;
    return matchSearch && matchCat;
  });

  const totalSaved = assets.reduce((acc, a) => acc + (a.size - (a.optimizedSize || a.size)), 0);

  return (
    <ModulePage title="Assets SVG" subtitle="Gerenciador de ícones e ilustrações com otimização automática" icon={<Grid3X3 className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`glass-card p-8 text-center border-2 border-dashed transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-2">Arraste arquivos SVG aqui ou</p>
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Selecionar arquivos
            <input type="file" accept=".svg" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
          </label>
          {totalSaved > 0 && (
            <p className="text-[10px] text-emerald-400 mt-2">✨ Total otimizado: -{totalSaved} bytes</p>
          )}
        </div>

        {/* Filters */}
        {assets.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ícone..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
                    category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Assets */}
        {filtered.length === 0 && assets.length > 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhum asset encontrado</p>
        )}

        {viewMode === "grid" ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.map((a) => (
              <div key={a.id} className="glass-card p-3 flex flex-col items-center group relative">
                <div
                  className="w-10 h-10 mb-2 flex items-center justify-center text-foreground"
                  dangerouslySetInnerHTML={{ __html: a.svg }}
                />
                <p className="text-[9px] text-muted-foreground truncate w-full text-center">{a.name}</p>
                {a.optimizedSize && a.size > a.optimizedSize && (
                  <p className="text-[8px] text-emerald-400">-{Math.round((1 - a.optimizedSize / a.size) * 100)}%</p>
                )}
                <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 rounded-lg">
                  <button onClick={() => copyAsset(a)} className="p-1.5 rounded bg-secondary hover:bg-secondary/80">
                    {copied === a.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-foreground" />}
                  </button>
                  <button onClick={() => downloadAsset(a)} className="p-1.5 rounded bg-secondary hover:bg-secondary/80">
                    <Download className="w-3 h-3 text-foreground" />
                  </button>
                  <button onClick={() => removeAsset(a.id)} className="p-1.5 rounded bg-destructive/20 hover:bg-destructive/30">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors group">
                <div className="w-8 h-8 flex items-center justify-center shrink-0 text-foreground" dangerouslySetInnerHTML={{ __html: a.svg }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{a.name}</p>
                  <p className="text-[9px] text-muted-foreground">{a.category} • {a.optimizedSize || a.size} bytes</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyAsset(a)} className="p-1 rounded bg-secondary hover:bg-secondary/80">
                    {copied === a.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-foreground" />}
                  </button>
                  <button onClick={() => downloadAsset(a)} className="p-1 rounded bg-secondary hover:bg-secondary/80">
                    <Download className="w-3 h-3 text-foreground" />
                  </button>
                  <button onClick={() => removeAsset(a.id)} className="p-1 rounded bg-destructive/20 hover:bg-destructive/30">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {assets.length === 0 && (
          <div className="text-center py-12">
            <Grid3X3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum asset SVG ainda</p>
            <p className="text-xs text-muted-foreground/60">Arraste ícones SVG para começar</p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
