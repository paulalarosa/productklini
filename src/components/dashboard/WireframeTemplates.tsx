/* eslint-disable react-refresh/only-export-components */
import { Smartphone, ShoppingCart, LayoutDashboard, LogIn, MessageSquare, UserPlus, Settings, ListTodo, Search } from "lucide-react";

interface CanvasElement {
  id: string;
  type: "rect" | "circle" | "text" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  rotation: number;
  visible: boolean;
  name: string;
}

interface Template {
  label: string;
  description: string;
  icon: React.ElementType;
  elements: Omit<CanvasElement, "id">[];
}

const t = (type: CanvasElement["type"], x: number, y: number, w: number, h: number, fill: string, name: string, extra?: Partial<CanvasElement>): Omit<CanvasElement, "id"> => ({
  type, x, y, width: w, height: h, fill, rotation: 0, visible: true, name, ...extra,
});

export const WIREFRAME_TEMPLATES: Template[] = [
  {
    label: "Login",
    description: "Tela de autenticação com email e senha",
    icon: LogIn,
    elements: [
      t("rect", 0, 0, 375, 812, "hsl(0, 0%, 97%)", "Background"),
      t("text", 120, 120, 140, 32, "hsl(0, 0%, 15%)", "Title", { text: "Bem-vindo", fontSize: 24 }),
      t("text", 100, 170, 180, 20, "hsl(0, 0%, 50%)", "Subtitle", { text: "Entre na sua conta", fontSize: 14 }),
      t("rect", 32, 240, 311, 48, "hsl(0, 0%, 100%)", "Email Input", { stroke: "hsl(0, 0%, 80%)", strokeWidth: 1 }),
      t("text", 48, 252, 200, 20, "hsl(0, 0%, 60%)", "Email Label", { text: "Email", fontSize: 13 }),
      t("rect", 32, 304, 311, 48, "hsl(0, 0%, 100%)", "Password Input", { stroke: "hsl(0, 0%, 80%)", strokeWidth: 1 }),
      t("text", 48, 316, 200, 20, "hsl(0, 0%, 60%)", "Password Label", { text: "Senha", fontSize: 13 }),
      t("text", 240, 364, 100, 16, "hsl(214, 90%, 60%)", "Forgot", { text: "Esqueceu?", fontSize: 12 }),
      t("rect", 32, 400, 311, 48, "hsl(214, 90%, 60%)", "Login Button"),
      t("text", 148, 412, 80, 20, "hsl(0, 0%, 100%)", "Login Label", { text: "Entrar", fontSize: 15 }),
      t("text", 100, 480, 180, 16, "hsl(0, 0%, 50%)", "Register Link", { text: "Não tem conta? Cadastre-se", fontSize: 12 }),
      t("rect", 32, 540, 145, 44, "hsl(0, 0%, 95%)", "Google Btn", { stroke: "hsl(0, 0%, 85%)", strokeWidth: 1 }),
      t("text", 68, 552, 100, 16, "hsl(0, 0%, 40%)", "Google Label", { text: "Google", fontSize: 12 }),
      t("rect", 198, 540, 145, 44, "hsl(0, 0%, 95%)", "Apple Btn", { stroke: "hsl(0, 0%, 85%)", strokeWidth: 1 }),
      t("text", 240, 552, 100, 16, "hsl(0, 0%, 40%)", "Apple Label", { text: "Apple", fontSize: 12 }),
    ],
  },
  {
    label: "Onboarding",
    description: "Fluxo de boas-vindas com steps",
    icon: UserPlus,
    elements: [
      t("rect", 0, 0, 375, 812, "hsl(0, 0%, 97%)", "Background"),
      t("rect", 0, 0, 375, 56, "hsl(0, 0%, 95%)", "Status Bar"),
      t("rect", 60, 150, 255, 255, "hsl(0, 0%, 90%)", "Illustration"),
      t("line", 60, 150, 255, 255, "hsl(0, 0%, 80%)", "Diag"),
      t("text", 72, 440, 240, 28, "hsl(0, 0%, 15%)", "Headline", { text: "Organize seu time", fontSize: 22 }),
      t("text", 52, 490, 280, 40, "hsl(0, 0%, 50%)", "Description", { text: "Gerencie projetos de UX com seu time de forma colaborativa", fontSize: 13 }),
      t("rect", 150, 570, 75, 8, "hsl(0, 0%, 85%)", "Dots BG"),
      t("circle", 170, 566, 12, 12, "hsl(214, 90%, 60%)", "Dot Active"),
      t("circle", 190, 566, 12, 12, "hsl(0, 0%, 80%)", "Dot 2"),
      t("circle", 210, 566, 12, 12, "hsl(0, 0%, 80%)", "Dot 3"),
      t("rect", 32, 640, 311, 48, "hsl(214, 90%, 60%)", "Next Button"),
      t("text", 146, 652, 80, 20, "hsl(0, 0%, 100%)", "Next Label", { text: "Próximo", fontSize: 15 }),
      t("text", 150, 710, 80, 16, "hsl(0, 0%, 50%)", "Skip", { text: "Pular", fontSize: 13 }),
    ],
  },
  {
    label: "E-commerce",
    description: "Tela de produto com carrinho",
    icon: ShoppingCart,
    elements: [
      t("rect", 0, 0, 375, 812, "hsl(0, 0%, 97%)", "Background"),
      t("rect", 0, 0, 375, 56, "hsl(0, 0%, 100%)", "Navbar", { stroke: "hsl(0, 0%, 90%)", strokeWidth: 1 }),
      t("text", 155, 16, 80, 24, "hsl(0, 0%, 15%)", "Logo", { text: "Shop", fontSize: 18 }),
      t("circle", 330, 16, 28, 28, "hsl(0, 0%, 90%)", "Cart Icon"),
      t("rect", 0, 64, 375, 320, "hsl(0, 0%, 90%)", "Product Image"),
      t("line", 0, 64, 375, 320, "hsl(0, 0%, 80%)", "Img Diag"),
      t("text", 20, 400, 300, 24, "hsl(0, 0%, 15%)", "Product Name", { text: "Wireless Headphones Pro", fontSize: 20 }),
      t("text", 20, 440, 100, 24, "hsl(214, 90%, 50%)", "Price", { text: "R$ 299,90", fontSize: 20 }),
      t("text", 20, 480, 340, 50, "hsl(0, 0%, 50%)", "Description", { text: "Cancelamento de ruído ativo, 30h de bateria, design ergonômico", fontSize: 13 }),
      t("rect", 20, 560, 80, 36, "hsl(0, 0%, 92%)", "Size S", { stroke: "hsl(0, 0%, 80%)", strokeWidth: 1 }),
      t("text", 44, 568, 30, 16, "hsl(0, 0%, 40%)", "S Label", { text: "P", fontSize: 13 }),
      t("rect", 110, 560, 80, 36, "hsl(214, 90%, 95%)", "Size M", { stroke: "hsl(214, 90%, 60%)", strokeWidth: 2 }),
      t("text", 134, 568, 30, 16, "hsl(214, 90%, 50%)", "M Label", { text: "M", fontSize: 13 }),
      t("rect", 200, 560, 80, 36, "hsl(0, 0%, 92%)", "Size L", { stroke: "hsl(0, 0%, 80%)", strokeWidth: 1 }),
      t("text", 224, 568, 30, 16, "hsl(0, 0%, 40%)", "L Label", { text: "G", fontSize: 13 }),
      t("rect", 20, 640, 335, 52, "hsl(214, 90%, 60%)", "Add to Cart"),
      t("text", 120, 654, 160, 20, "hsl(0, 0%, 100%)", "Cart Label", { text: "Adicionar ao Carrinho", fontSize: 15 }),
      t("rect", 0, 756, 375, 56, "hsl(0, 0%, 100%)", "Tab Bar", { stroke: "hsl(0, 0%, 90%)", strokeWidth: 1 }),
    ],
  },
  {
    label: "Dashboard",
    description: "Painel com cards e gráficos",
    icon: LayoutDashboard,
    elements: [
      t("rect", 0, 0, 375, 812, "hsl(228, 14%, 8%)", "Background"),
      t("rect", 0, 0, 375, 56, "hsl(228, 12%, 11%)", "Header"),
      t("text", 16, 16, 200, 24, "hsl(210, 20%, 92%)", "Title", { text: "Dashboard", fontSize: 18 }),
      t("circle", 330, 16, 28, 28, "hsl(228, 12%, 18%)", "Avatar"),
      t("rect", 16, 72, 165, 80, "hsl(228, 12%, 13%)", "Card 1", { stroke: "hsl(228, 10%, 18%)", strokeWidth: 1 }),
      t("text", 28, 88, 80, 16, "hsl(215, 12%, 50%)", "Card1 Label", { text: "Receita", fontSize: 11 }),
      t("text", 28, 112, 100, 24, "hsl(160, 70%, 50%)", "Card1 Value", { text: "R$ 12.5k", fontSize: 20 }),
      t("rect", 194, 72, 165, 80, "hsl(228, 12%, 13%)", "Card 2", { stroke: "hsl(228, 10%, 18%)", strokeWidth: 1 }),
      t("text", 206, 88, 80, 16, "hsl(215, 12%, 50%)", "Card2 Label", { text: "Usuários", fontSize: 11 }),
      t("text", 206, 112, 100, 24, "hsl(214, 90%, 60%)", "Card2 Value", { text: "2.4k", fontSize: 20 }),
      t("rect", 16, 168, 343, 200, "hsl(228, 12%, 13%)", "Chart Area", { stroke: "hsl(228, 10%, 18%)", strokeWidth: 1 }),
      t("text", 28, 180, 100, 16, "hsl(215, 12%, 50%)", "Chart Title", { text: "Visão Geral", fontSize: 12 }),
      t("rect", 40, 220, 40, 120, "hsl(252, 80%, 65%)", "Bar 1"),
      t("rect", 100, 250, 40, 90, "hsl(214, 90%, 60%)", "Bar 2"),
      t("rect", 160, 200, 40, 140, "hsl(252, 80%, 65%)", "Bar 3"),
      t("rect", 220, 270, 40, 70, "hsl(214, 90%, 60%)", "Bar 4"),
      t("rect", 280, 230, 40, 110, "hsl(252, 80%, 65%)", "Bar 5"),
      t("rect", 16, 384, 343, 120, "hsl(228, 12%, 13%)", "List Area", { stroke: "hsl(228, 10%, 18%)", strokeWidth: 1 }),
      t("text", 28, 396, 100, 16, "hsl(215, 12%, 50%)", "List Title", { text: "Atividade Recente", fontSize: 12 }),
    ],
  },
  {
    label: "Chat",
    description: "Tela de mensagens estilo WhatsApp",
    icon: MessageSquare,
    elements: [
      t("rect", 0, 0, 375, 812, "hsl(0, 0%, 95%)", "Background"),
      t("rect", 0, 0, 375, 64, "hsl(0, 0%, 100%)", "Header", { stroke: "hsl(0, 0%, 90%)", strokeWidth: 1 }),
      t("circle", 16, 16, 36, 36, "hsl(0, 0%, 85%)", "Avatar"),
      t("text", 64, 14, 200, 20, "hsl(0, 0%, 15%)", "Contact Name", { text: "Ana Silva", fontSize: 15 }),
      t("text", 64, 36, 100, 14, "hsl(160, 70%, 50%)", "Status", { text: "Online", fontSize: 11 }),
      t("rect", 16, 100, 200, 48, "hsl(0, 0%, 100%)", "Msg Received 1"),
      t("text", 28, 112, 180, 16, "hsl(0, 0%, 25%)", "Msg Text 1", { text: "Oi! Como vai o projeto?", fontSize: 13 }),
      t("rect", 155, 170, 204, 48, "hsl(214, 90%, 95%)", "Msg Sent 1"),
      t("text", 167, 182, 180, 16, "hsl(0, 0%, 25%)", "Msg Sent Text", { text: "Vai bem! Terminei os wireframes", fontSize: 13 }),
      t("rect", 16, 240, 240, 48, "hsl(0, 0%, 100%)", "Msg Received 2"),
      t("text", 28, 252, 220, 16, "hsl(0, 0%, 25%)", "Msg Text 2", { text: "Ótimo! Me manda o link depois", fontSize: 13 }),
      t("rect", 195, 310, 164, 48, "hsl(214, 90%, 95%)", "Msg Sent 2"),
      t("text", 207, 322, 140, 16, "hsl(0, 0%, 25%)", "Msg Sent Text 2", { text: "Claro, vou enviar 👍", fontSize: 13 }),
      t("rect", 0, 756, 375, 56, "hsl(0, 0%, 100%)", "Input Bar", { stroke: "hsl(0, 0%, 90%)", strokeWidth: 1 }),
      t("rect", 16, 764, 295, 40, "hsl(0, 0%, 95%)", "Message Input"),
      t("text", 28, 774, 200, 16, "hsl(0, 0%, 60%)", "Input Placeholder", { text: "Digite uma mensagem...", fontSize: 13 }),
      t("circle", 326, 768, 36, 36, "hsl(214, 90%, 60%)", "Send Button"),
    ],
  },
  {
    label: "Lista/Feed",
    description: "Feed de conteúdo com cards",
    icon: ListTodo,
    elements: [
      t("rect", 0, 0, 375, 812, "hsl(0, 0%, 97%)", "Background"),
      t("rect", 0, 0, 375, 56, "hsl(0, 0%, 100%)", "Navbar", { stroke: "hsl(0, 0%, 90%)", strokeWidth: 1 }),
      t("text", 140, 16, 100, 24, "hsl(0, 0%, 15%)", "Title", { text: "Feed", fontSize: 18 }),
      t("rect", 16, 72, 343, 44, "hsl(0, 0%, 92%)", "Search Bar"),
      t("text", 44, 84, 200, 16, "hsl(0, 0%, 60%)", "Search Placeholder", { text: "Buscar...", fontSize: 13 }),
      t("rect", 16, 132, 343, 140, "hsl(0, 0%, 100%)", "Card 1", { stroke: "hsl(0, 0%, 92%)", strokeWidth: 1 }),
      t("rect", 28, 144, 80, 80, "hsl(0, 0%, 90%)", "Card1 Thumb"),
      t("text", 124, 148, 220, 18, "hsl(0, 0%, 15%)", "Card1 Title", { text: "Como criar wireframes", fontSize: 14 }),
      t("text", 124, 172, 220, 32, "hsl(0, 0%, 50%)", "Card1 Desc", { text: "Guia prático para iniciar no design de interfaces", fontSize: 11 }),
      t("text", 124, 210, 100, 14, "hsl(0, 0%, 60%)", "Card1 Meta", { text: "5 min · Design", fontSize: 10 }),
      t("rect", 16, 288, 343, 140, "hsl(0, 0%, 100%)", "Card 2", { stroke: "hsl(0, 0%, 92%)", strokeWidth: 1 }),
      t("rect", 28, 300, 80, 80, "hsl(0, 0%, 90%)", "Card2 Thumb"),
      t("text", 124, 304, 220, 18, "hsl(0, 0%, 15%)", "Card2 Title", { text: "Pesquisa com usuários", fontSize: 14 }),
      t("text", 124, 328, 220, 32, "hsl(0, 0%, 50%)", "Card2 Desc", { text: "Métodos para entrevistar e validar hipóteses", fontSize: 11 }),
      t("text", 124, 366, 100, 14, "hsl(0, 0%, 60%)", "Card2 Meta", { text: "8 min · UX Research", fontSize: 10 }),
      t("rect", 0, 756, 375, 56, "hsl(0, 0%, 100%)", "Tab Bar", { stroke: "hsl(0, 0%, 90%)", strokeWidth: 1 }),
    ],
  },
  {
    label: "Perfil/Settings",
    description: "Tela de configurações do usuário",
    icon: Settings,
    elements: [
      t("rect", 0, 0, 375, 812, "hsl(0, 0%, 97%)", "Background"),
      t("rect", 0, 0, 375, 56, "hsl(0, 0%, 100%)", "Header", { stroke: "hsl(0, 0%, 90%)", strokeWidth: 1 }),
      t("text", 140, 16, 100, 24, "hsl(0, 0%, 15%)", "Title", { text: "Perfil", fontSize: 18 }),
      t("circle", 148, 100, 80, 80, "hsl(0, 0%, 85%)", "Avatar"),
      t("text", 130, 196, 120, 20, "hsl(0, 0%, 15%)", "Name", { text: "João Silva", fontSize: 16 }),
      t("text", 118, 222, 150, 16, "hsl(0, 0%, 50%)", "Email", { text: "joao@email.com", fontSize: 12 }),
      t("rect", 16, 270, 343, 48, "hsl(0, 0%, 100%)", "Option 1", { stroke: "hsl(0, 0%, 92%)", strokeWidth: 1 }),
      t("text", 28, 284, 200, 16, "hsl(0, 0%, 25%)", "Opt1 Label", { text: "Editar Perfil", fontSize: 14 }),
      t("rect", 16, 326, 343, 48, "hsl(0, 0%, 100%)", "Option 2", { stroke: "hsl(0, 0%, 92%)", strokeWidth: 1 }),
      t("text", 28, 340, 200, 16, "hsl(0, 0%, 25%)", "Opt2 Label", { text: "Notificações", fontSize: 14 }),
      t("rect", 16, 382, 343, 48, "hsl(0, 0%, 100%)", "Option 3", { stroke: "hsl(0, 0%, 92%)", strokeWidth: 1 }),
      t("text", 28, 396, 200, 16, "hsl(0, 0%, 25%)", "Opt3 Label", { text: "Privacidade", fontSize: 14 }),
      t("rect", 16, 438, 343, 48, "hsl(0, 0%, 100%)", "Option 4", { stroke: "hsl(0, 0%, 92%)", strokeWidth: 1 }),
      t("text", 28, 452, 200, 16, "hsl(0, 0%, 25%)", "Opt4 Label", { text: "Tema", fontSize: 14 }),
      t("rect", 32, 530, 311, 44, "hsl(0, 72%, 55%)", "Logout Button"),
      t("text", 156, 542, 80, 16, "hsl(0, 0%, 100%)", "Logout Label", { text: "Sair", fontSize: 14 }),
    ],
  },
];

export function WireframeTemplatePanel({ onApply }: { onApply: (elements: Omit<CanvasElement, "id">[]) => void }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-foreground">📱 Templates Prontos</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {WIREFRAME_TEMPLATES.map((tmpl) => (
          <button key={tmpl.label} onClick={() => onApply(tmpl.elements)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50 hover:bg-accent/50 transition-colors text-center group">
            <tmpl.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-medium text-foreground">{tmpl.label}</span>
            <span className="text-[8px] text-muted-foreground leading-tight">{tmpl.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
