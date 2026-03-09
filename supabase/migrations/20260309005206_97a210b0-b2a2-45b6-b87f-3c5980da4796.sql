-- Create table for UX patterns library
CREATE TABLE public.ux_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  pattern_type TEXT NOT NULL DEFAULT 'component', -- component, flow, principle
  difficulty_level TEXT NOT NULL DEFAULT 'beginner', -- beginner, intermediate, advanced
  use_cases TEXT[] NOT NULL DEFAULT '{}',
  preview_image TEXT DEFAULT '',
  code_examples JSON NOT NULL DEFAULT '{}', -- html, react, vue code examples
  design_tokens JSON NOT NULL DEFAULT '{}', -- colors, spacing, typography
  best_practices TEXT[] NOT NULL DEFAULT '{}',
  related_patterns UUID[] NOT NULL DEFAULT '{}',
  psychology_principles TEXT[] NOT NULL DEFAULT '{}', -- persuasion principles
  metrics JSON NOT NULL DEFAULT '{}', -- success metrics, conversion data
  examples JSON NOT NULL DEFAULT '[]', -- real world examples
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ux_patterns ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view published patterns" 
ON public.ux_patterns 
FOR SELECT 
USING (status = 'published' OR user_owns_project(project_id));

CREATE POLICY "Users can create their own patterns" 
ON public.ux_patterns 
FOR INSERT 
WITH CHECK (user_owns_project(project_id));

CREATE POLICY "Users can update their own patterns" 
ON public.ux_patterns 
FOR UPDATE 
USING (user_owns_project(project_id));

CREATE POLICY "Users can delete their own patterns" 
ON public.ux_patterns 
FOR DELETE 
USING (user_owns_project(project_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ux_patterns_updated_at
BEFORE UPDATE ON public.ux_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ux_patterns_category ON public.ux_patterns(category);
CREATE INDEX idx_ux_patterns_pattern_type ON public.ux_patterns(pattern_type);
CREATE INDEX idx_ux_patterns_status ON public.ux_patterns(status);
CREATE INDEX idx_ux_patterns_tags ON public.ux_patterns USING GIN(tags);

-- Insert some sample UX patterns
INSERT INTO public.ux_patterns (project_id, name, description, category, tags, pattern_type, difficulty_level, use_cases, psychology_principles, best_practices, examples, design_tokens, code_examples, metrics) VALUES 
((SELECT id FROM public.projects LIMIT 1), 'Social Proof Cards', 'Exibir depoimentos e avaliações para aumentar credibilidade e conversões através de prova social', 'persuasion', ARRAY['social-proof', 'testimonials', 'credibility'], 'component', 'beginner', 
ARRAY['Landing pages', 'Product pages', 'Checkout process'], 
ARRAY['Social Proof', 'Authority', 'Consensus'], 
ARRAY['Use fotos reais dos clientes', 'Inclua nomes e empresas verificáveis', 'Mostre métricas específicas', 'Posicione próximo ao CTA'], 
'[{"company": "Airbnb", "description": "Reviews e ratings em cada listagem"}, {"company": "Amazon", "description": "Sistema de avaliações com verificação de compra"}]'::json,
'{"colors": {"primary": "hsl(var(--primary))", "background": "hsl(var(--card))", "text": "hsl(var(--foreground))"}, "spacing": {"padding": "1rem", "gap": "0.75rem"}, "typography": {"heading": "text-lg font-semibold", "body": "text-sm text-muted-foreground"}}'::json,
'{"react": "const TestimonialCard = ({ name, company, avatar, rating, review }) => (\n  <Card className=\"p-4\">\n    <div className=\"flex items-center gap-3 mb-3\">\n      <Avatar><AvatarImage src={avatar} /></Avatar>\n      <div>\n        <h4 className=\"font-semibold\">{name}</h4>\n        <p className=\"text-sm text-muted-foreground\">{company}</p>\n      </div>\n    </div>\n    <div className=\"flex mb-2\">{Array.from({length: rating}).map(() => <Star />)}</div>\n    <p className=\"text-sm\">{review}</p>\n  </Card>\n);"}'::json,
'{"conversion_lift": "15-30%", "trust_increase": "25%", "bounce_rate_reduction": "10%"}'::json),

((SELECT id FROM public.projects LIMIT 1), 'Urgency Timer', 'Contador regressivo para criar senso de urgência e acelerar decisões de compra', 'persuasion', ARRAY['urgency', 'scarcity', 'timer'], 'component', 'intermediate',
ARRAY['Flash sales', 'Limited offers', 'Event registration', 'Course enrollment'],
ARRAY['Scarcity', 'Loss Aversion', 'Urgency'],
ARRAY['Use tempo real, não fake', 'Combine com oferta genuína', 'Design visualmente proeminente', 'Inclua call-to-action claro'],
'[{"company": "Booking.com", "description": "Timer para ofertas de hotel com desconto"}, {"company": "Coursera", "description": "Prazo para inscrições em cursos com desconto"}]'::json,
'{"colors": {"danger": "hsl(var(--destructive))", "warning": "hsl(var(--warning))", "background": "hsl(var(--card))"}, "typography": {"timer": "text-2xl font-bold tabular-nums", "label": "text-sm font-medium"}}'::json,
'{"react": "const UrgencyTimer = ({ endTime, onExpire }) => {\n  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());\n  \n  useEffect(() => {\n    const timer = setInterval(() => {\n      const newTimeLeft = calculateTimeLeft();\n      setTimeLeft(newTimeLeft);\n      if (newTimeLeft.total <= 0) onExpire();\n    }, 1000);\n    return () => clearInterval(timer);\n  }, []);\n  \n  return (\n    <div className=\"bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center\">\n      <h3 className=\"font-bold text-destructive mb-2\">Oferta Limitada!</h3>\n      <div className=\"text-2xl font-bold tabular-nums\">\n        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s\n      </div>\n    </div>\n  );\n};"}'::json,
'{"conversion_increase": "20-40%", "urgency_effectiveness": "35%"}'::json),

((SELECT id FROM public.projects LIMIT 1), 'Progressive Disclosure', 'Revelar informações gradualmente para reduzir cognitive load e melhorar usabilidade', 'navigation', ARRAY['progressive-disclosure', 'forms', 'complexity'], 'principle', 'intermediate',
ARRAY['Complex forms', 'Onboarding flows', 'Configuration screens', 'Product details'],
ARRAY['Cognitive Load Theory', 'Progressive Enhancement'],
ARRAY['Agrupe informações relacionadas', 'Use labels descritivos', 'Permita navegação não-linear', 'Salve progresso automaticamente'],
'[{"company": "TurboTax", "description": "Formulário de impostos dividido em etapas simples"}, {"company": "Typeform", "description": "Uma pergunta por tela para reduzir abandono"}]'::json,
'{"spacing": {"step": "2rem", "section": "1.5rem"}, "colors": {"progress": "hsl(var(--primary))", "complete": "hsl(var(--success))", "inactive": "hsl(var(--muted))"}}'::json,
'{"react": "const StepIndicator = ({ steps, currentStep }) => (\n  <div className=\"flex items-center space-x-4 mb-6\">\n    {steps.map((step, index) => (\n      <div key={index} className=\"flex items-center\">\n        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${\n          index < currentStep ? \"bg-success text-success-foreground\" :\n          index === currentStep ? \"bg-primary text-primary-foreground\" :\n          \"bg-muted text-muted-foreground\"\n        }`}>\n          {index < currentStep ? <Check className=\"w-4 h-4\" /> : index + 1}\n        </div>\n        {index < steps.length - 1 && <div className=\"w-12 h-px bg-border ml-2\" />}\n      </div>\n    ))}\n  </div>\n);"}'::json,
'{"completion_rate": "40% higher", "user_satisfaction": "25% increase"}'::json);