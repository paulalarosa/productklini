import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Shuffle, Check, Plus, X, Trash2 } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { toast } from "sonner";

interface Card { id: string; label: string; }
interface Group { id: string; name: string; cards: Card[]; }

let cid = 1;
const uid = () => `card-${cid++}`;
let gid = 1;
const gUid = () => `group-${gid++}`;

const defaultCards: Card[] = [
  "Perfil", "Configurações", "Dashboard", "Notificações", "Ajuda",
  "Relatórios", "Equipe", "Tarefas", "Pesquisas", "Design System",
  "Documentos", "Chat", "Métricas", "Exportar", "Integrações",
].map(label => ({ id: uid(), label }));

export function CardSortingPage() {
  const [unsorted, setUnsorted] = useState<Card[]>(defaultCards);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newCard, setNewCard] = useState("");
  const [draggingCard, setDraggingCard] = useState<Card | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null);

  const addGroup = () => {
    setGroups(prev => [...prev, { id: gUid(), name: "Novo Grupo", cards: [] }]);
  };

  const addCard = () => {
    if (!newCard.trim()) return;
    setUnsorted(prev => [...prev, { id: uid(), label: newCard.trim() }]);
    setNewCard("");
  };

  const handleDragStart = (card: Card, source: string) => {
    setDraggingCard(card);
    setDragSource(source);
  };

  const handleDrop = (targetGroupId: string) => {
    if (!draggingCard || !dragSource) return;

    // Remove from source
    if (dragSource === "unsorted") {
      setUnsorted(prev => prev.filter(c => c.id !== draggingCard.id));
    } else {
      setGroups(prev => prev.map(g =>
        g.id === dragSource ? { ...g, cards: g.cards.filter(c => c.id !== draggingCard.id) } : g
      ));
    }

    // Add to target
    if (targetGroupId === "unsorted") {
      setUnsorted(prev => [...prev, draggingCard]);
    } else {
      setGroups(prev => prev.map(g =>
        g.id === targetGroupId ? { ...g, cards: [...g.cards, draggingCard] } : g
      ));
    }

    setDraggingCard(null);
    setDragSource(null);
  };

  const renameGroup = (id: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  };

  const deleteGroup = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) setUnsorted(prev => [...prev, ...group.cards]);
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const totalCards = unsorted.length + groups.reduce((acc, g) => acc + g.cards.length, 0);
  const sortedCards = groups.reduce((acc, g) => acc + g.cards.length, 0);

  const CardChip = ({ card, source }: { card: Card; source: string }) => (
    <motion.div
      layout
      draggable
      onDragStart={() => handleDragStart(card, source)}
      className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors select-none"
    >
      {card.label}
    </motion.div>
  );

  return (
    <ModulePage title="Card Sorting" subtitle="Simule como usuários agrupariam itens de navegação" icon={<LayoutGrid className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-muted-foreground">
            Arraste cards para os grupos • {sortedCards}/{totalCards} organizados
          </p>
          <div className="flex gap-2">
            <button onClick={addGroup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">
              <Plus className="w-3.5 h-3.5" /> Novo Grupo
            </button>
            <button onClick={() => {
              const allCards = [...unsorted, ...groups.flatMap(g => g.cards)];
              const shuffled = allCards.sort(() => Math.random() - 0.5);
              setUnsorted(shuffled);
              setGroups(prev => prev.map(g => ({ ...g, cards: [] })));
              toast.info("Cards embaralhados!");
            }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Shuffle className="w-3.5 h-3.5" /> Embaralhar
            </button>
          </div>
        </div>

        {/* Add card */}
        <div className="flex gap-2">
          <input value={newCard} onChange={e => setNewCard(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCard()}
            placeholder="Adicionar novo card..."
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button onClick={addCard} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Unsorted pile */}
        <div
          className="glass-card p-4 min-h-[80px] border-dashed border-2 border-border"
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop("unsorted")}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Não classificados ({unsorted.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unsorted.map(card => <CardChip key={card.id} card={card} source="unsorted" />)}
            {unsorted.length === 0 && (
              <p className="text-xs text-muted-foreground/50 italic">Todos os cards foram organizados!</p>
            )}
          </div>
        </div>

        {/* Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <div
              key={group.id}
              className="glass-card p-4 min-h-[120px]"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(group.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <input
                  value={group.name}
                  onChange={e => renameGroup(group.id, e.target.value)}
                  className="text-xs font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                />
                <button onClick={() => deleteGroup(group.id)} className="p-1 rounded hover:bg-destructive/10 shrink-0">
                  <Trash2 className="w-3 h-3 text-destructive/70" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.cards.map(card => <CardChip key={card.id} card={card} source={group.id} />)}
                {group.cards.length === 0 && (
                  <p className="text-xs text-muted-foreground/40 italic">Arraste cards aqui</p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{group.cards.length} cards</p>
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-8">
            <LayoutGrid className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Crie grupos e arraste os cards para organizá-los</p>
            <button onClick={addGroup} className="mt-3 px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">
              Criar Primeiro Grupo
            </button>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
