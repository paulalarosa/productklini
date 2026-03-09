import React from "react";
import { FolderTree, ExternalLink, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SitemapNode {
  id: string;
  node_name: string;
  url_path?: string;
  description?: string;
  hierarchy_level: number;
}

interface SitemapTreeProps {
  nodes: SitemapNode[];
  onDelete: (id: string) => void;
}

export function SitemapTree({ nodes, onDelete }: SitemapTreeProps) {
  // Sort by hierarchy and then by name
  const sortedNodes = [...nodes].sort((a, b) => a.hierarchy_level - b.hierarchy_level);

  return (
    <div className="space-y-4">
      {sortedNodes.map((node) => (
        <Card key={node.id} className="p-4 bg-card/50 border-muted hover:border-primary/50 transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{node.node_name}</h4>
                  {node.url_path && (
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {node.url_path}
                    </span>
                  )}
                </div>
                {node.description && (
                   <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary/70">
                    Nível {node.hierarchy_level}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
