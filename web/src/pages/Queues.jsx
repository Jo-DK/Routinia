// =====================================================
// PÁGINA DE FILAS — lista todas as filas do usuário
// =====================================================
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getQueues, createQueue, updateQueue, deleteQueue } from '../api/queuesApi';
import Layout from '../components/Layout';

// Paleta de cores para as filas
const COLORS = [
  { label: 'Índigo',   value: '#6366f1' },
  { label: 'Roxo',     value: '#8b5cf6' },
  { label: 'Rosa',     value: '#ec4899' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Laranja',  value: '#f97316' },
  { label: 'Verde',    value: '#22c55e' },
  { label: 'Azul',     value: '#3b82f6' },
  { label: 'Ciano',    value: '#06b6d4' },
];

// Dias da semana — 0=Seg … 6=Dom
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Atalhos de seleção rápida
const DAY_PRESETS = [
  { label: 'Todo dia',       days: [] },
  { label: 'Seg – Sex',      days: [0, 1, 2, 3, 4] },
  { label: 'Fins de semana', days: [5, 6] },
];

// Converte array de índices em texto legível
function weekDaysLabel(days) {
  if (!days || days.length === 0) return 'Todo dia';
  if (days.length === 7) return 'Todo dia';
  if (JSON.stringify([...days].sort((a,b)=>a-b)) === '[0,1,2,3,4]') return 'Seg – Sex';
  return days.map(d => DAYS[d]).join(' · ');
}

// ── Modal de criar / editar fila ──────────────────────
function QueueModal({ queue, onClose, onSave }) {
  const isEditing = !!queue;
  const [form, setForm] = useState({
    name:         queue?.name         ?? '',
    description:  queue?.description  ?? '',
    color:        queue?.color        ?? '#6366f1',
    rotationType: queue?.rotationType ?? 'sequential',
    weekDays:     queue?.weekDays     ?? [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function toggleDay(index) {
    setForm(f => {
      const days = f.weekDays.includes(index)
        ? f.weekDays.filter(d => d !== index)
        : [...f.weekDays, index].sort((a, b) => a - b);
      return { ...f, weekDays: days };
    });
  }

  function isPresetActive(presetDays) {
    const a = JSON.stringify([...presetDays].sort((a,b)=>a-b));
    const b = JSON.stringify([...form.weekDays].sort((a,b)=>a-b));
    return a === b;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        const { data } = await updateQueue(queue.id, form);
        onSave(data.queue);
      } else {
        const { data } = await createQueue(form);
        onSave(data.queue);
      }
      onClose();
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Editar fila' : 'Nova fila'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: Academia, Leitura, Trabalho..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => set('color', c.value)}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* ── Dias da semana ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dias da semana</label>

            {/* Atalhos rápidos */}
            <div className="flex gap-2 mb-3">
              {DAY_PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => set('weekDays', p.days)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition ${
                    isPresetActive(p.days)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Seletor individual */}
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((label, i) => {
                const active = form.weekDays.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full text-xs font-semibold border-2 transition ${
                      active
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-2">
              {form.weekDays.length === 0
                ? '✅ Ativa todos os dias'
                : `📅 Ativa: ${form.weekDays.map(d => DAYS[d]).join(', ')}`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de rotação</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'sequential', label: '🔄 Automática',  desc: 'Avança sozinha a cada execução' },
                { value: 'manual',     label: '✋ Manual',      desc: 'Você avança ao concluir' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('rotationType', opt.value)}
                  className={`text-left p-3 rounded-xl border-2 transition ${
                    form.rotationType === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Card de fila ──────────────────────────────────────
function QueueCard({ queue, onEdit, onDelete, onClick }) {
  const rotationLabel = queue.rotationType === 'sequential' ? '🔄 Automática' : '✋ Manual';
  const daysLabel = weekDaysLabel(queue.weekDays);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Barra de cor */}
      <div className="h-2" style={{ backgroundColor: queue.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800 truncate">{queue.name}</h3>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: queue.color + '22', color: queue.color }}
              >
                {daysLabel}
              </span>
            </div>
            {queue.description && (
              <p className="text-gray-500 text-sm mt-0.5 truncate">{queue.description}</p>
            )}
          </div>
          {/* Botões de ação — aparecem no hover */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onEdit(queue)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Editar"
            >✏️</button>
            <button
              onClick={() => onDelete(queue)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              title="Excluir"
            >🗑️</button>
          </div>
        </div>

        {/* Tarefa atual */}
        {queue.currentTask ? (
          <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-0.5">Tarefa atual</p>
            <p className="text-sm font-medium text-gray-700 truncate">{queue.currentTask.name}</p>
          </div>
        ) : (
          <div className="mt-3 p-2.5 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-400">Nenhuma tarefa ainda</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <span>{queue.taskCount} tarefa{queue.taskCount !== 1 ? 's' : ''}</span>
          <span>{rotationLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────
export default function Queues() {
  const navigate  = useNavigate();
  const { user } = useAuth();

  const [queues,     setQueues]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);  // null | 'create' | queue_object
  const [deleteConf, setDeleteConf] = useState(null);  // queue a confirmar exclusão

  const loadQueues = useCallback(async () => {
    try {
      const { data } = await getQueues();
      setQueues(data.queues);
    } catch {
      console.error('Erro ao carregar filas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueues(); }, [loadQueues]);

  function handleSave(saved) {
    setQueues(prev => {
      const exists = prev.find(q => q.id === saved.id);
      return exists
        ? prev.map(q => q.id === saved.id ? saved : q)
        : [saved, ...prev];
    });
  }

  async function handleDelete(queue) {
    try {
      await deleteQueue(queue.id);
      setQueues(prev => prev.filter(q => q.id !== queue.id));
    } catch {
      alert('Erro ao excluir fila.');
    } finally {
      setDeleteConf(null);
    }
  }

  return (
    <Layout>
      <main className="max-w-5xl mx-auto p-6">
        {/* Título + botão novo */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Minhas Filas</h2>
            <p className="text-gray-500 text-sm mt-1">Organize suas rotinas em filas de tarefas</p>
          </div>
          <button
            onClick={() => setModal('create')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <span className="text-lg">+</span> Nova Fila
          </button>
        </div>

        {/* Grid de filas */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : queues.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma fila ainda</h3>
            <p className="text-gray-500 text-sm mb-6">
              Crie sua primeira fila para começar a organizar sua rotina
            </p>
            <button
              onClick={() => setModal('create')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-xl"
            >
              Criar primeira fila
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {queues.map(queue => (
              <QueueCard
                key={queue.id}
                queue={queue}
                onClick={() => navigate(`/queues/${queue.id}`)}
                onEdit={q => setModal(q)}
                onDelete={q => setDeleteConf(q)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal criar/editar */}
      {modal && (
        <QueueModal
          queue={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Confirmação de exclusão */}
      {deleteConf && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">Excluir fila?</h3>
            <p className="text-gray-500 text-sm mb-4">
              A fila <strong>"{deleteConf.name}"</strong> e todas as suas tarefas serão excluídas permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConf(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConf)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
