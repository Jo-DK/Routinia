// =====================================================
// SERVIÇO DE FILAS E TAREFAS
// Toda a lógica de negócio do módulo Queue/Task.
//
// Padrão importante: todo método recebe userId e verifica
// se o recurso pertence ao usuário antes de agir.
// Isso evita que um usuário acesse dados de outro.
// Em PHP/Laravel isso seria feito com Policy ou Gate.
// =====================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── QUEUES ───────────────────────────────────────────

/**
 * Lista todas as filas do usuário com contagem de tarefas
 * e qual é a tarefa atual.
 */
async function getUserQueues(userId) {
  const queues = await prisma.queue.findMany({
    where: { userId },
    include: {
      tasks: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Adiciona a tarefa atual calculada pelo índice
  return queues.map(q => ({
    ...q,
    taskCount: q.tasks.length,
    currentTask: q.tasks[q.currentTaskIndex] ?? q.tasks[0] ?? null,
  }));
}

/**
 * Retorna uma fila com todas as suas tarefas ordenadas.
 * Lança erro se a fila não pertencer ao usuário.
 */
async function getQueue(userId, queueId) {
  const queue = await prisma.queue.findFirst({
    where: { id: queueId, userId },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });

  if (!queue) throw new Error('QUEUE_NOT_FOUND');

  return {
    ...queue,
    taskCount: queue.tasks.length,
    currentTask: queue.tasks[queue.currentTaskIndex] ?? queue.tasks[0] ?? null,
  };
}

/**
 * Cria uma nova fila.
 * weekDays: array de inteiros 0–6 (0=Seg, 6=Dom).
 * Array vazio [] = sem restrição de dias (ativa todo dia).
 */
async function createQueue(userId, { name, description, color, rotationType, weekDays, defaultStartTime, defaultEndTime }) {
  return prisma.queue.create({
    data: {
      name,
      description:      description      || null,
      color:            color            || '#6366f1',
      rotationType:     rotationType     || 'sequential',
      weekDays:         Array.isArray(weekDays) ? weekDays : [],
      defaultStartTime: defaultStartTime || null,
      defaultEndTime:   defaultEndTime   || null,
      userId,
    },
    include: { tasks: true },
  });
}

/**
 * Atualiza uma fila existente.
 * weekDays: array de inteiros 0–6. undefined = não altera; [] = sem restrição.
 */
async function updateQueue(userId, queueId, { name, description, color, rotationType, weekDays, defaultStartTime, defaultEndTime }) {
  const queue = await prisma.queue.findFirst({ where: { id: queueId, userId } });
  if (!queue) throw new Error('QUEUE_NOT_FOUND');

  return prisma.queue.update({
    where: { id: queueId },
    data: {
      name,
      description,
      color,
      rotationType,
      ...(Array.isArray(weekDays) ? { weekDays } : {}),
      // undefined = não altera; null = limpa; string = actualiza
      ...(defaultStartTime !== undefined ? { defaultStartTime: defaultStartTime || null } : {}),
      ...(defaultEndTime   !== undefined ? { defaultEndTime:   defaultEndTime   || null } : {}),
    },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });
}

/**
 * Exclui uma fila (e todas as tarefas por cascade).
 */
async function deleteQueue(userId, queueId) {
  const queue = await prisma.queue.findFirst({ where: { id: queueId, userId } });
  if (!queue) throw new Error('QUEUE_NOT_FOUND');

  await prisma.queue.delete({ where: { id: queueId } });
}

/**
 * Avança a fila para a próxima tarefa (rotação manual).
 * Volta ao início quando chega no final.
 */
async function advanceQueue(userId, queueId) {
  const queue = await prisma.queue.findFirst({
    where: { id: queueId, userId },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });

  if (!queue) throw new Error('QUEUE_NOT_FOUND');
  if (queue.tasks.length === 0) throw new Error('QUEUE_EMPTY');

  // Módulo: ao chegar no último, volta pro primeiro
  const nextIndex = (queue.currentTaskIndex + 1) % queue.tasks.length;

  return prisma.queue.update({
    where: { id: queueId },
    data: { currentTaskIndex: nextIndex },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });
}

// ─── TASKS ────────────────────────────────────────────

/**
 * Cria uma tarefa no final da fila (maior order + 1).
 */
async function createTask(userId, queueId, { name, description }) {
  // Verifica que a fila pertence ao usuário
  const queue = await prisma.queue.findFirst({ where: { id: queueId, userId } });
  if (!queue) throw new Error('QUEUE_NOT_FOUND');

  // Busca o maior `order` atual para colocar a nova tarefa no final
  const lastTask = await prisma.task.findFirst({
    where: { queueId },
    orderBy: { order: 'desc' },
  });

  const order = lastTask ? lastTask.order + 1 : 0;

  return prisma.task.create({
    data: { name, description: description || null, order, queueId },
  });
}

/**
 * Atualiza nome/descrição de uma tarefa.
 */
async function updateTask(userId, queueId, taskId, { name, description }) {
  // JOIN manual para verificar ownership: task → queue → user
  const task = await prisma.task.findFirst({
    where: { id: taskId, queueId, queue: { userId } },
  });
  if (!task) throw new Error('TASK_NOT_FOUND');

  return prisma.task.update({
    where: { id: taskId },
    data: { name, description },
  });
}

/**
 * Exclui uma tarefa. Ajusta currentTaskIndex se necessário.
 */
async function deleteTask(userId, queueId, taskId) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, queueId, queue: { userId } },
    include: { queue: true },
  });
  if (!task) throw new Error('TASK_NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id: taskId } });

    // Conta quantas tarefas restaram
    const remaining = await tx.task.count({ where: { queueId } });

    // Garante que o índice não fique fora do range
    if (task.queue.currentTaskIndex >= remaining && remaining > 0) {
      await tx.queue.update({
        where: { id: queueId },
        data: { currentTaskIndex: remaining - 1 },
      });
    } else if (remaining === 0) {
      await tx.queue.update({
        where: { id: queueId },
        data: { currentTaskIndex: 0 },
      });
    }
  });
}

/**
 * Reordena as tarefas de uma fila.
 * Recebe um array com os IDs na nova ordem desejada.
 * Exemplo: ['id3', 'id1', 'id2'] → define order 0, 1, 2
 */
async function reorderTasks(userId, queueId, taskIds) {
  const queue = await prisma.queue.findFirst({ where: { id: queueId, userId } });
  if (!queue) throw new Error('QUEUE_NOT_FOUND');

  // Atualiza o `order` de cada tarefa em paralelo
  await Promise.all(
    taskIds.map((id, index) =>
      prisma.task.update({ where: { id }, data: { order: index } })
    )
  );

  return getQueue(userId, queueId);
}

module.exports = {
  getUserQueues,
  getQueue,
  createQueue,
  updateQueue,
  deleteQueue,
  advanceQueue,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
};
