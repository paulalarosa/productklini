import { useState, useRef } from "react";
import { Paperclip, Image, FileText, Link2, X } from "lucide-react";
import { ChatAttachment } from "@/hooks/useAIChat";
import { toast } from "sonner";

interface ChatAttachmentsProps {
  attachments: ChatAttachment[];
  onAdd: (att: ChatAttachment) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatAttachments({ attachments, onAdd, onRemove, disabled }: ChatAttachmentsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 10MB)");
      return;
    }
    try {
      const data = await fileToBase64(file);
      onAdd({ type: "image", data, mime_type: file.type, name: file.name });
    } catch {
      toast.error("Erro ao processar imagem");
    }
    e.target.value = "";
    setShowMenu(false);
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("PDF muito grande (máx 20MB)");
      return;
    }
    try {
      const data = await fileToBase64(file);
      onAdd({ type: "pdf", data, mime_type: "application/pdf", name: file.name });
    } catch {
      toast.error("Erro ao processar PDF");
    }
    e.target.value = "";
    setShowMenu(false);
  };

  const handleUrlAdd = () => {
    if (!urlValue.trim()) return;
    onAdd({ type: "url", url: urlValue.trim(), name: urlValue.trim().slice(0, 40) });
    setUrlValue("");
    setShowUrlInput(false);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfSelect} />

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-1.5">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-1 bg-muted rounded px-1.5 py-0.5 text-[10px] text-muted-foreground max-w-[120px]">
              {att.type === "image" ? <Image className="w-3 h-3 shrink-0" /> : att.type === "pdf" ? <FileText className="w-3 h-3 shrink-0" /> : <Link2 className="w-3 h-3 shrink-0" />}
              <span className="truncate">{att.name || att.type}</span>
              <button onClick={() => onRemove(i)} className="shrink-0 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* URL inline input */}
      {showUrlInput && (
        <div className="flex gap-1 mb-1.5">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
            placeholder="https://figma.com/..."
            className="flex-1 bg-muted rounded px-2 py-1 text-[11px] text-foreground outline-none"
            autoFocus
          />
          <button onClick={handleUrlAdd} className="text-[10px] text-primary font-medium px-1.5">OK</button>
          <button onClick={() => { setShowUrlInput(false); setShowMenu(false); }} className="text-[10px] text-muted-foreground px-1">✕</button>
        </div>
      )}

      {/* Attach button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        className="p-1.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50 shrink-0"
        title="Anexar arquivo"
      >
        <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute bottom-8 left-0 bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[140px] z-50">
          <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[11px] text-foreground hover:bg-accent rounded transition-colors">
            <Image className="w-3.5 h-3.5" /> Imagem
          </button>
          <button onClick={() => pdfInputRef.current?.click()} className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[11px] text-foreground hover:bg-accent rounded transition-colors">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => { setShowUrlInput(true); setShowMenu(false); }} className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[11px] text-foreground hover:bg-accent rounded transition-colors">
            <Link2 className="w-3.5 h-3.5" /> Link / Figma
          </button>
        </div>
      )}
    </div>
  );
}
