import { useState } from "react";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useCreateABExperiment } from "@/hooks/useABExperiments";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().min(10, "Descreva o experimento"),
  hypothesis: z.string().min(10, "Formule sua hipótese"),
  traffic_allocation: z.number().min(0.1).max(1),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Nome da variante"),
    description: z.string(),
    is_control: z.boolean(),
  })).min(2, "Mínimo 2 variantes"),
  success_metrics: z.array(z.object({
    name: z.string().min(1, "Nome da métrica"),
    type: z.string(),
    target_value: z.number().optional(),
  })).min(1, "Adicione pelo menos 1 métrica"),
});

type FormData = z.infer<typeof schema>;

interface ABExperimentFormProps {
  onClose: () => void;
}

export function ABExperimentForm({ onClose }: ABExperimentFormProps) {
  const [trafficPct, setTrafficPct] = useState(50);
  const { mutate: createExperiment, isPending } = useCreateABExperiment();

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      hypothesis: "",
      traffic_allocation: 0.5,
      variants: [
        { id: "control", name: "Controle (A)", description: "Versão atual", is_control: true },
        { id: "variant-b", name: "Variante (B)", description: "Nova versão a testar", is_control: false },
      ],
      success_metrics: [
        { name: "Taxa de Conversão", type: "conversion_rate", target_value: undefined },
      ],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: "variants" });
  const { fields: metricFields, append: appendMetric, remove: removeMetric } = useFieldArray({ control, name: "success_metrics" });

  const onSubmit = (data: FormData) => {
    createExperiment({
      name: data.name,
      description: data.description,
      hypothesis: data.hypothesis,
      traffic_allocation: data.traffic_allocation,
      variants: data.variants,
      success_metrics: data.success_metrics,
    }, {
      onSuccess: () => {
        toast.success("Experimento criado com sucesso!");
        onClose();
      },
      onError: (err) => toast.error("Erro ao criar: " + err.message),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h3 className="text-lg font-semibold text-foreground">Novo Experimento A/B</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Experimento *</Label>
                <Input {...register("name")} placeholder="ex: CTA Button Color Test" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Alocação de Tráfego: {trafficPct}%</Label>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={[trafficPct]}
                  onValueChange={([v]) => {
                    setTrafficPct(v);
                    setValue("traffic_allocation", v / 100);
                  }}
                  className="mt-3"
                />
                <p className="text-xs text-muted-foreground">% dos usuários no experimento</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea {...register("description")} placeholder="O que você está testando e por quê..." rows={2} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Hipótese *</Label>
              <Textarea {...register("hypothesis")} placeholder="Se mudarmos X, então Y aumentará porque Z..." rows={2} />
              {errors.hypothesis && <p className="text-xs text-destructive">{errors.hypothesis.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Variantes ({variantFields.length})</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendVariant({ id: crypto.randomUUID(), name: "", description: "", is_control: false })}
                disabled={variantFields.length >= 4}
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {variantFields.map((field, i) => (
              <div key={field.id} className="flex gap-3 items-start p-3 rounded-lg bg-muted/30">
                <div className="flex-1 grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome da Variante</Label>
                    <Input {...register(`variants.${i}.name`)} placeholder={i === 0 ? "Controle (A)" : `Variante (${String.fromCharCode(66 + i - 1)})`} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição</Label>
                    <Input {...register(`variants.${i}.description`)} placeholder="O que muda nesta variante..." />
                  </div>
                </div>
                {i > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(i)} className="mt-5">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {errors.variants && <p className="text-xs text-destructive">Mínimo de 2 variantes</p>}
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Métricas de Sucesso</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendMetric({ name: "", type: "custom", target_value: undefined })}
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {metricFields.map((field, i) => (
              <div key={field.id} className="flex gap-3 items-end">
                <div className="flex-1 grid md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Métrica</Label>
                    <Input {...register(`success_metrics.${i}.name`)} placeholder="ex: Taxa de cliques no CTA" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Meta (%)</Label>
                    <Input
                      type="number"
                      {...register(`success_metrics.${i}.target_value`, { valueAsNumber: true })}
                      placeholder="ex: 5"
                    />
                  </div>
                </div>
                {i > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMetric(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Criando..." : "Criar Experimento"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
