// =====================================================
// DETALHE DA FILA — exibe e gerencia as tarefas
// =====================================================
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getQueue, advanceQueue,
  createTask, updateTask, deleteTask, reorderTasks,
} from '../api/queuesApi';

// ── Formulário inline de tarefa ───────────────────────
function TaskForm({ queueId, task, onSave, onCancel }) {
  const isEditing = !!task;
  const [name, setName]       = useState(task?.name ?? '');
  const [desc, setDesc]       = useState(task?.description ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (isEditing) {
        const { data } = await updateTask(queueId, task.id, { name, description: desc });
        onSave(data.task);
      } else {
        const { data } = await createTask(queueId, { name, description: desc });
        onSave(data.task);
      }
    } catch {
      alert('Erro ao salvar tarefa.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nome da tarefa *"
        autoFocus
      />
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="Descrição (opcional)"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading || !name.trim()}
          className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm py-1.5 rounded-lg font-medium">
          {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}

// ── Item de tarefa ────────────────────────────────────
function TaskItem({ task, isCurrent, index, total, queueId, onUpdate, onDelete, onMove }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTask(queueId, task.id);
      onDelete(task.id);
    } catch {
      alert('Erro ao excluir tarefa.');
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <TaskForm
        queueId={queueId}
        task={task}
        onSave={updated => { onUpdate(updated); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border transition ${
      isCurrent ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-100'
    }`}>
      {/* Indicador de posição */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isCurrent ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
      }`}>
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${isCurrent ? 'text-primary-700' : 'text-gray-700'}`}>
          {task.name}
          {isCurrent && <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full">atual</span>}
        </p>
        {task.description && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* Reordenação */}
      <div className="flex flex-col gap-0.5">
        <button
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none"
          title="Mover para cima"
        >▲</button>
        <button
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none"
          title="Mover para baixo"
        >▼</button>
      </div>

      {/* Ações */}
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setEditing(true)}
          className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg text-sm">
          ✏️
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg text-sm disabled:opacity-40">
          🗑️
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────
export default function QueueDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [queue,       setQueue]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [addingTask,  setAddingTask]  = useState(false);
  const [advancing,   setAdvancing]   = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const { data } = await getQueue(id);
      setQueue(data.queue);
    } catch {
      navigate('/queues');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Avança para próxima tarefa
  async function handleAdvance() {
    setAdvancing(true);
    try {
      const { data } = await advanceQueue(id);
      setQueue(data.queue);
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao avançar.');
    } finally {
      setAdvancing(false);
    }
  }

  // Adiciona nova tarefa à lista local
  function handleTaskCreated(task) {
    setQueue(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
      taskCount: prev.taskCount + 1,
    }));
    setAddingTask(false);
  }

  // Atualiza tarefa editada
  function handleTaskUpdated(updated) {
    setQueue(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === updated.id ? updated : t),
    }));
  }

  // Remove tarefa excluída
  function handleTaskDeleted(taskId) {
    setQueue(prev => {
      const tasks = prev.tasks.filter(t => t.id !== taskId);
      const idx   = Math.min(prev.currentTaskIndex, tasks.length - 1);
      return { ...prev, tasks, taskCount: tasks.length, currentTaskIndex: Math.max(0, idx) };
    });
  }

  // Troca de posição e salva no servidor
  async function handleMove(fromIdx, toIdx) {
    const tasks    = [...queue.tasks];
    const [moved]  = tasks.splice(fromIdx, 1);
    tasks.splice(toIdx, 0, moved);

    // Atualiza local imediatamente (optimistic update)
    setQueue(prev => ({ ...prev, tasks }));

    try {
      await reorderTasks(id, tasks.map(t => t.id));
    } catch {
      loadQueue(); // Reverte se der erro
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Carregando...</div>;
  }

  const currentIdx = queue.currentTaskIndex ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com cor da fila */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/queues')}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >←</button>
          <div
            className="w-4 h-4 rounded-full shrink-0"
            style={{ backgroundColor: queue.color }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-800 truncate">{queue.name}</h1>
            <p className="text-xs text-gray-400">
              {queue.taskCount} tarefa{queue.taskCount !== 1 ? 's' : ''} · {queue.rotationType === 'sequential' ? 'Rotação automática' : 'Rotação manual'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-4">
        {/* Card de tarefa atual + botão avançar */}
        {queue.tasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Tarefa atual da fila</p>
              <p className="font-semibold text-gray-800 text-lg">
                {queue.tasks[currentIdx]?.name ?? '—'}
              </p>
              {queue.tasks[currentIdx]?.description && (
                <p className="text-sm text-gray-500 mt-0.5">{queue.tasks[currentIdx].description}</p>
              )}
            </div>
            <button
              onClick={handleAdvance}
              disabled={advancing || queue.tasks.length <= 1}
              title="Avançar para a próxima tarefa"
              className="shrink-0 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              {advancing ? '...' : '⏭ Próxima'}
            </button>
          </div>
        )}

        {/* Lista de tarefas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Tarefas</h2>
            {!addingTask && (
              <button
                onClick={() => setAddingTask(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Adicionar tarefa
              </button>
            )}
          </div>

          <div className="space-y-2">
            {addingTask && (
              <TaskForm
                queueId={id}
                onSave={handleTaskCreated}
                onCancel={() => setAddingTask(false)}
              />
            )}

            {queue.tasks.length === 0 && !addingTask ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-sm">Nenhuma tarefa ainda.</p>
                <button
                  onClick={() => setAddingTask(true)}
                  className="mt-3 text-primary-600 text-sm font-medium hover:underline"
                >
                  Adicionar a primeira tarefa
                </button>
              </div>
            ) : (
              queue.tasks.map((task, idx) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={idx}
                  total={queue.tasks.length}
                  isCurrent={idx === currentIdx}
                  queueId={id}
                  onUpdate={handleTaskUpdated}
                  onDelete={handleTaskDeleted}
                  onMove={handleMove}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
