const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Inclui os dados da fila (nome, cor) em cada agendamento
const includeQueue = { queue: { select: { id: true, name: true, color: true, rotationType: true, currentTaskIndex: true, tasks: { orderBy: { order: 'asc' } } } } };

/**
 * Retorna todos os agendamentos do usuário com dados da fila.
 */
async function getSchedules(userId) {
  return prisma.schedule.findMany({
    where: { userId },
    include: includeQueue,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

/**
 * Cria um agendamento. Valida sobreposição de horário no mesmo dia.
 */
async function createSchedule(userId, { queueId, dayOfWeek, startTime, endTime }) {
  // Verifica que a fila pertence ao usuário
  const queue = await prisma.queue.findFirst({ where: { id: queueId, userId } });
  if (!queue) throw new Error('QUEUE_NOT_FOUND');

  await checkOverlap(userId, dayOfWeek, startTime, endTime, null);

  return prisma.schedule.create({
    data: { userId, queueId, dayOfWeek, startTime, endTime },
    include: includeQueue,
  });
}

/**
 * Atualiza dia/horário de um agendamento (drag-and-drop ou redimensionamento).
 */
async function updateSchedule(userId, scheduleId, { dayOfWeek, startTime, endTime }) {
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, userId } });
  if (!schedule) throw new Error('SCHEDULE_NOT_FOUND');

  await checkOverlap(userId, dayOfWeek, startTime, endTime, scheduleId);

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: { dayOfWeek, startTime, endTime },
    include: includeQueue,
  });
}

/**
 * Remove um agendamento.
 */
async function deleteSchedule(userId, scheduleId) {
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, userId } });
  if (!schedule) throw new Error('SCHEDULE_NOT_FOUND');
  await prisma.schedule.delete({ where: { id: scheduleId } });
}

/**
 * Verifica se o horário solicitado se sobrepõe a outro agendamento no mesmo dia.
 * excludeId: ignora o próprio agendamento ao atualizar.
 */
async function checkOverlap(userId, dayOfWeek, startTime, endTime, excludeId) {
  const existing = await prisma.schedule.findMany({
    where: { userId, dayOfWeek, id: excludeId ? { not: excludeId } : undefined },
  });

  const newStart = timeToMinutes(startTime);
  const newEnd   = timeToMinutes(endTime);

  for (const s of existing) {
    const sStart = timeToMinutes(s.startTime);
    const sEnd   = timeToMinutes(s.endTime);
    // Sobreposição: novo intervalo começa antes do fim do existente E termina depois do início
    if (newStart < sEnd && newEnd > sStart) {
      throw new Error('TIME_OVERLAP');
    }
  }
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule };
