import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">Carregando...</p>
    </div>
  );
}

export default PageLoader;
