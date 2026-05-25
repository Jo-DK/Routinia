// =====================================================
// CALENDÁRIO SEMANAL COM DRAG-AND-DROP
//
// Conceitos usados:
// - @dnd-kit/core: biblioteca de drag-and-drop
//   • DndContext: envolve toda a área de DnD
//   • useDraggable: torna um elemento arrastável
//   • useDroppable: torna um elemento destino de drop
//   • DragOverlay: preview do item sendo arrastado (em portal)
// - CSS position:absolute: eventos são posicionados dentro
//   da coluna de cada dia usando top/height calculados
// - Resize via pointer events nativos (mousedown/move/up)
//
// ESTRUTURA VISUAL:
//   [Sidebar filas] | [Grid: cabeçalho dias] [Horas | Seg … Dom]
// =====================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Layout from '../components/Layout';
import api from '../api/axios';

// ── Constantes do grid ────────────────────────────────
const START_HOUR  = 6;   // 06:00
const END_HOUR    = 23;  // 23:00
const SLOT_HEIGHT = 48;  // px por slot de 30 minutos
const HOUR_HEIGHT = SLOT_HEIGHT * 2; // 96px por hora
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2; // 34 slots
const TOTAL_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;   // 1632px

const DAYS_BR    = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Retorna true se o dia está ativo para a fila
// weekDays vazio = sem restrição (todo dia é válido)
function isDayActive(queue, dayIndex) {
  if (!queue?.weekDays || queue.weekDays.length === 0) return true;
  return queue.weekDays.includes(dayIndex);
}

// ── Helpers de tempo ──────────────────────────────────
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function getEventStyle(startTime, endTime) {
  const startMins = timeToMinutes(startTime) - START_HOUR * 60;
  const endMins   = timeToMinutes(endTime)   - START_HOUR * 60;
  return {
    top:    Math.max(0, (startMins / 30) * SLOT_HEIGHT),
    height: Math.max(SLOT_HEIGHT, ((endMins - startMins) / 30) * SLOT_HEIGHT),
  };
}

// Datas da semana atual (Seg–Dom)
function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Dom
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ── Componente: card arrastável da sidebar ────────────
function DraggableQueueCard({ queue }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `queue-${queue.id}`,
    data: { type: 'queue', queue },
  });

  const currentTask  = queue.tasks?.[queue.currentTaskIndex] ?? queue.tasks?.[0];
  const hasRestriction = queue.weekDays?.length > 0;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="bg-white rounded-xl border border-gray-200 p-3 cursor-grab active:cursor-grabbing select-none shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: queue.color }} />
        <span className="text-sm font-semibold text-gray-800 truncate">{queue.name}</span>
      </div>
      {currentTask && (
        <p className="text-xs text-gray-400 truncate pl-5">{currentTask.name}</p>
      )}
      <p className="text-xs text-gray-300 pl-5 mt-0.5">
        {queue.tasks?.length ?? 0} tarefa{queue.tasks?.length !== 1 ? 's' : ''}
      </p>

      {/* Indicador de dias ativos */}
      <div className="flex gap-0.5 mt-2 pl-5">
        {DAYS_SHORT.map((label, i) => {
          const active = isDayActive(queue, i);
          return (
            <span
              key={i}
              title={DAYS_BR[i]}
              className={`text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
                active
                  ? 'text-white'
                  : 'text-gray-300 bg-gray-100'
              }`}
              style={active ? { backgroundColor: queue.color } : {}}
            >
              {label[0]}
            </span>
          );
        })}
      </div>

      {/* Horário padrão */}
      {queue.defaultStartTime && queue.defaultEndTime && (
        <p className="text-[10px] text-gray-400 pl-5 mt-1.5 font-medium tabular-nums">
          🕐 {queue.defaultStartTime} – {queue.defaultEndTime}
        </p>
      )}
    </div>
  );
}

// ── Componente: slot de tempo (destino do drop) ───────
function TimeSlotCell({ dayOfWeek, slotIndex }) {
  const hour   = START_HOUR + Math.floor(slotIndex / 2);
  const minute = (slotIndex % 2) * 30;
  const id     = `slot-${dayOfWeek}-${hour}-${minute}`;

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { dayOfWeek, hour, minute },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ height: SLOT_HEIGHT }}
      className={`border-b transition-colors ${
        minute === 0 ? 'border-gray-200' : 'border-gray-100'
      } ${isOver ? 'bg-primary-50' : ''}`}
    />
  );
}

// ── Componente: evento no calendário ─────────────────
function CalendarEvent({ schedule, onDelete, onResized }) {
  const { queue }    = schedule;
  const evStyle = getEventStyle(schedule.startTime, schedule.endTime);
  const offDay  = !isDayActive(queue, schedule.dayOfWeek);

  // Drag para mover o evento
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `schedule-${schedule.id}`,
    data: { type: 'schedule', schedule },
  });

  // ── Resize ──────────────────────────────────────────
  const resizeRef      = useRef(null);
  const [resizeH, setResizeH] = useState(evStyle.height);

  useEffect(() => { setResizeH(evStyle.height); }, [schedule.startTime, schedule.endTime]);

  function handleResizeDown(e) {
    e.preventDefault();
    e.stopPropagation(); // não aciona o drag do evento

    const startY      = e.clientY;
    const startHeight = resizeH;

    function onMove(ev) {
      const delta  = ev.clientY - startY;
      const slots  = Math.round(delta / SLOT_HEIGHT);
      const newH   = Math.max(SLOT_HEIGHT, startHeight + slots * SLOT_HEIGHT);
      setResizeH(newH);
    }

    function onUp(ev) {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);

      const delta    = ev.clientY - startY;
      const slots    = Math.round(delta / SLOT_HEIGHT);
      if (slots === 0) return;

      const startMin = timeToMinutes(schedule.startTime);
      const endMin   = timeToMinutes(schedule.endTime);
      const duration = endMin - startMin;
      const newEnd   = Math.min(
        END_HOUR * 60,
        Math.max(startMin + 30, endMin + slots * 30)
      );
      onResized(schedule.id, schedule.dayOfWeek, schedule.startTime, minutesToTime(newEnd));
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }

  return (
    <>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          position: 'absolute',
          left: 2, right: 2,
          top: evStyle.top,
          height: isDragging ? evStyle.height : resizeH,
          backgroundColor: queue?.color ?? '#6366f1',
          opacity: isDragging ? 0.3 : offDay ? 0.55 : 0.92,
          transform: CSS.Transform.toString(transform),
          zIndex: isDragging ? 0 : 10,
          outline: offDay ? '2px dashed rgba(255,255,255,0.7)' : 'none',
          outlineOffset: '-2px',
        }}
        className="group rounded-lg px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        {/* Botão ✕ — aparece no hover, remove direto */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(schedule.id); }}
          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/25 hover:bg-black/50 text-white
                     flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title="Remover do calendário"
        >
          <span className="text-[10px] leading-none font-bold">✕</span>
        </button>

        <div className="flex items-center gap-1 pr-4">
          {offDay && <span title="Fora dos dias ativos desta fila" className="text-white text-[10px] leading-none">⚠️</span>}
          <p className="text-white text-xs font-semibold truncate leading-tight">{queue?.name}</p>
        </div>
        <p className="text-white/75 text-xs truncate">
          {schedule.startTime} – {schedule.endTime}
        </p>
        {/* Handle de resize */}
        <div
          onMouseDown={handleResizeDown}
          className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize flex items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-6 h-0.5 bg-white/50 rounded-full" />
        </div>
      </div>
    </>
  );
}

// ── Componente: preview do item sendo arrastado ───────
function DragPreview({ activeDrag, queues }) {
  if (!activeDrag) return null;

  if (activeDrag.type === 'queue') {
    // Usa a state para garantir dados frescos (defaultStartTime/defaultEndTime)
    const queue    = queues.find(q => q.id === activeDrag.queue.id) ?? activeDrag.queue;
    const hasTimes = queue.defaultStartTime && queue.defaultEndTime;
    return (
      <div
        style={{ backgroundColor: queue.color }}
        className="rounded-lg px-3 py-2 opacity-90 shadow-lg w-36"
      >
        <p className="text-white text-xs font-semibold">{queue.name}</p>
        <p className="text-white/70 text-xs tabular-nums">
          {hasTimes
            ? `${queue.defaultStartTime} – ${queue.defaultEndTime}`
            : 'Solte para agendar'}
        </p>
      </div>
    );
  }

  if (activeDrag.type === 'schedule') {
    const { schedule } = activeDrag;
    const h = getEventStyle(schedule.startTime, schedule.endTime).height;
    return (
      <div
        style={{ backgroundColor: schedule.queue?.color ?? '#6366f1', height: h, width: 100 }}
        className="rounded-lg px-2 py-1 opacity-80 shadow-lg"
      >
        <p className="text-white text-xs font-semibold">{schedule.queue?.name}</p>
      </div>
    );
  }
  return null;
}

// ── Coluna de um dia ──────────────────────────────────
function DayColumn({ dayOfWeek, schedules, onDelete, onResized, activeDrag }) {
  // Durante o drag de uma fila, indica se este dia é válido para ela
  const draggingQueue = activeDrag?.type === 'queue' ? activeDrag.queue : null;
  const isValid   = !draggingQueue || isDayActive(draggingQueue, dayOfWeek);
  const isDraggingQueue = !!draggingQueue;

  return (
    <div
      className={`relative border-l border-gray-200 transition-colors duration-150 ${
        isDraggingQueue && !isValid ? 'bg-gray-100/80' : ''
      }`}
      style={{ minWidth: 0 }}
    >
      {/* Faixa de "dia inválido" durante o drag */}
      {isDraggingQueue && !isValid && (
        <div className="absolute inset-0 pointer-events-none z-20 flex items-start justify-center pt-3">
          <span className="text-[10px] text-gray-400 font-medium bg-gray-200/80 rounded-full px-2 py-0.5 select-none">
            Inativo
          </span>
        </div>
      )}

      {/* Slots (drop zones) */}
      <div>
        {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
          <TimeSlotCell key={i} dayOfWeek={dayOfWeek} slotIndex={i} />
        ))}
      </div>
      {/* Eventos posicionados absolutamente */}
      {schedules.map(s => (
        <CalendarEvent
          key={s.id}
          schedule={s}
          onDelete={onDelete}
          onResized={onResized}
        />
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────
export default function Calendar() {
  const [queues,    setQueues]    = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeDrag, setActiveDrag] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const weekDates = getWeekDates();
  const today     = new Date().getDay(); // 0=Dom
  const todayCol  = today === 0 ? 6 : today - 1; // converte para 0=Seg

  // Carrega filas e agendamentos
  useEffect(() => {
    Promise.all([api.get('/queues'), api.get('/schedules')])
      .then(([qRes, sRes]) => {
        setQueues(qRes.data.queues);
        setSchedules(sRes.data.schedules);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Agrupa agendamentos por dia da semana
  const schedulesByDay = Array.from({ length: 7 }, (_, day) =>
    schedules.filter(s => s.dayOfWeek === day)
  );

  // ── Drag Start ──────────────────────────────────────
  function handleDragStart(event) {
    setActiveDrag(event.active.data.current);
  }

  // ── Drag End ────────────────────────────────────────
  async function handleDragEnd(event) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const slot     = over.data.current;   // { dayOfWeek, hour, minute }
    const dragged  = active.data.current; // { type, queue | schedule }

    const startTime = `${String(slot.hour).padStart(2,'0')}:${String(slot.minute).padStart(2,'0')}`;

    if (dragged.type === 'queue') {
      // Busca sempre da state (fonte de verdade) para garantir que
      // defaultStartTime/defaultEndTime estão actualizados.
      const queue = queues.find(q => q.id === dragged.queue.id) ?? dragged.queue;

      // Horário: usa o padrão da fila se existir; senão usa o slot do drop + 1 h
      const finalStart = queue.defaultStartTime || startTime;
      const finalEnd   = queue.defaultEndTime   || (() => {
        const endHour = slot.hour + 1 >= END_HOUR ? END_HOUR - 1 : slot.hour + 1;
        return `${String(endHour).padStart(2,'0')}:${String(slot.minute).padStart(2,'0')}`;
      })();

      // Dias: expande para todos os weekDays ou só o dia do drop
      const targetDays = queue.weekDays?.length > 0
        ? queue.weekDays
        : [slot.dayOfWeek];

      const results = await Promise.allSettled(
        targetDays.map(day =>
          api.post('/schedules', { queueId: queue.id, dayOfWeek: day, startTime: finalStart, endTime: finalEnd })
        )
      );

      const created = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data.schedule);

      if (created.length > 0) {
        setSchedules(prev => [...prev, ...created]);
      }

      const skipped = results.filter(r => r.status === 'rejected').length;
      if (created.length === 0) {
        alert('Não foi possível agendar: conflito de horário em todos os dias.');
      } else if (skipped > 0) {
        alert(`Agendado em ${created.length} dia(s). ${skipped} dia(s) ignorado(s) por conflito de horário.`);
      }
    } else if (dragged.type === 'schedule') {
      // Mover agendamento existente (mantém a duração original)
      const s        = dragged.schedule;
      const duration = timeToMinutes(s.endTime) - timeToMinutes(s.startTime);
      const newEnd   = minutesToTime(
        Math.min(END_HOUR * 60, timeToMinutes(startTime) + duration)
      );
      try {
        const { data } = await api.put(`/schedules/${s.id}`, {
          dayOfWeek: slot.dayOfWeek,
          startTime,
          endTime:   newEnd,
        });
        setSchedules(prev => prev.map(sc => sc.id === s.id ? data.schedule : sc));
      } catch (e) {
        const msg = e.response?.data?.error ?? 'Erro ao mover agendamento.';
        alert(msg);
      }
    }
  }

  // ── Deletar agendamento ──────────────────────────────
  async function handleDelete(scheduleId) {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    } catch {
      alert('Erro ao remover agendamento.');
    }
  }

  // ── Redimensionar (resize) ───────────────────────────
  async function handleResized(scheduleId, dayOfWeek, startTime, newEndTime) {
    try {
      const { data } = await api.put(`/schedules/${scheduleId}`, {
        dayOfWeek, startTime, endTime: newEndTime,
      });
      setSchedules(prev => prev.map(s => s.id === scheduleId ? data.schedule : s));
    } catch (e) {
      const msg = e.response?.data?.error ?? 'Erro ao redimensionar.';
      alert(msg);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout className="overflow-hidden">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

          {/* ── Sidebar de filas ── */}
          <aside className="w-48 shrink-0 border-r border-gray-200 bg-white flex flex-col">
            <div className="px-3 pt-4 pb-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filas</p>
              <p className="text-xs text-gray-400 mt-0.5">Arraste para o calendário</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {queues.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Crie filas primeiro
                </p>
              )}
              {queues.map(q => (
                <DraggableQueueCard key={q.id} queue={q} />
              ))}
            </div>
          </aside>

          {/* ── Grid do calendário ── */}
          <div className="flex-1 overflow-auto">
            {/* Cabeçalho dos dias */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex">
              {/* Espaço da coluna de horas */}
              <div className="w-14 shrink-0" />
              {/* Dias */}
              {DAYS_SHORT.map((day, i) => {
                const date   = weekDates[i];
                const isToday = i === todayCol;
                return (
                  <div
                    key={i}
                    className={`flex-1 text-center py-2 border-l border-gray-200 ${isToday ? 'bg-primary-50' : ''}`}
                  >
                    <p className={`text-xs font-medium ${isToday ? 'text-primary-600' : 'text-gray-500'}`}>
                      {day}
                    </p>
                    <p className={`text-sm font-bold ${isToday ? 'text-primary-700' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Grid de horas × dias */}
            <div className="flex" style={{ height: TOTAL_HEIGHT }}>
              {/* Coluna de labels de hora */}
              <div className="w-14 shrink-0 relative">
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div
                    key={i}
                    style={{ top: i * HOUR_HEIGHT - 8 }}
                    className="absolute right-2 text-xs text-gray-400 select-none"
                  >
                    {String(START_HOUR + i).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Colunas dos dias */}
              {Array.from({ length: 7 }, (_, day) => (
                <div
                  key={day}
                  className={`flex-1 relative min-w-0 ${todayCol === day ? 'bg-primary-50/30' : ''}`}
                >
                  <DayColumn
                    dayOfWeek={day}
                    schedules={schedulesByDay[day]}
                    onDelete={handleDelete}
                    onResized={handleResized}
                    activeDrag={activeDrag}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview flutuante do item arrastado */}
        <DragOverlay dropAnimation={null}>
          <DragPreview activeDrag={activeDrag} queues={queues} />
        </DragOverlay>
      </DndContext>
    </Layout>
  );
}
