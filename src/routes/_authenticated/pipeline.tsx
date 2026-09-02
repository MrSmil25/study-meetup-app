import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DEAL_STAGES,
  DEAL_STAGE_HEADER_CLASS,
  DEAL_TYPES,
  DealTypeBadge,
  label,
} from "@/components/external/badges";
import { EnumSelect, NONE } from "@/components/external/form-fields";
import { DealFormDialog } from "@/components/external/forms";
import { useDeals, useUpdateDeal, type Deal, type DealWithRelations } from "@/hooks/useExternal";
import { useDivisions } from "@/hooks/useProfile";
import { formatDate, initialsOf, rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — OrgTool" },
      { name: "description", content: "Kanban pipeline deal sponsorship dan kerja sama eksternal." },
      { property: "og:title", content: "Pipeline — OrgTool" },
      {
        property: "og:description",
        content: "Kanban pipeline deal sponsorship dan kerja sama eksternal.",
      },
    ],
  }),
  component: PipelinePage,
});

function DealCard({ deal }: { deal: DealWithRelations }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
          : undefined
      }
      className={`cursor-grab rounded-xl border bg-card p-3 shadow-sm ${
        isDragging ? "opacity-80 shadow-lg" : ""
      }`}
    >
      <p className="text-sm font-semibold leading-snug">{deal.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {deal.companies?.name ?? "Tanpa perusahaan"}
      </p>
      <p className="mt-2 text-sm font-semibold">{rupiah(deal.value_idr)}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <DealTypeBadge value={deal.deal_type} />
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
          {initialsOf(deal.owner?.full_name)}
        </span>
      </div>
      {deal.events && (
        <span className="mt-2 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
          🎯 {deal.events.name}
        </span>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Deadline: {formatDate(deal.deadline)}</p>
    </div>
  );
}

function StageColumn({
  stage,
  deals,
}: {
  stage: string;
  deals: DealWithRelations[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((sum, d) => sum + Number(d.value_idr ?? 0), 0);
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      <div className={`rounded-xl px-3 py-2 ${DEAL_STAGE_HEADER_CLASS[stage] ?? "bg-muted"}`}>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{label(stage)}</span>
          <span>{deals.length}</span>
        </div>
        <p className="text-xs opacity-80">{rupiah(total)}</p>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-40 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-border bg-muted/40"
        }`}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">Belum ada deal.</p>
        )}
      </div>
    </div>
  );
}

function PipelinePage() {
  const { data: deals = [], isLoading } = useDeals();
  const { data: divisions = [] } = useDivisions();
  const updateDeal = useUpdateDeal();
  const [type, setType] = useState(NONE);
  const [division, setDivision] = useState(NONE);
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtered = useMemo(
    () =>
      deals.filter(
        (d) =>
          (type === NONE || d.deal_type === type) &&
          (division === NONE || d.owner_division === division),
      ),
    [deals, type, division],
  );

  async function handleDragEnd(event: DragEndEvent) {
    const stage = event.over?.id as string | undefined;
    const dealId = event.active.id as string;
    if (!stage) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === stage) return;
    try {
      await updateDeal.mutateAsync({ id: dealId, values: { stage: stage as Deal["stage"] } });
      toast.success(`Deal dipindah ke ${label(stage)}`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Geser kartu deal antar kolom untuk memperbarui stage.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Deal Baru
        </Button>
      </div>

      <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
        <EnumSelect value={type} onChange={setType} options={DEAL_TYPES} emptyLabel="Semua tipe" />
        <EnumSelect
          value={division}
          onChange={setDivision}
          options={divisions.map((d) => ({ value: d.code, label: d.code }))}
          emptyLabel="Semua divisi"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat pipeline…</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:-mx-8 lg:px-8">
            <div className="flex gap-4">
              {DEAL_STAGES.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  deals={filtered.filter((d) => d.stage === stage)}
                />
              ))}
            </div>
          </div>
        </DndContext>
      )}

      <DealFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
