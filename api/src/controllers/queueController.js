const { validationResult } = require('express-validator');
const queueService = require('../services/queueService');

function getErrors(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return result.array().map(e => ({ field: e.path, message: e.msg }));
  }
  return null;
}

// Mapa de erros do service → resposta HTTP
function handleServiceError(res, error) {
  const map = {
    QUEUE_NOT_FOUND: [404, 'Fila não encontrada.'],
    TASK_NOT_FOUND:  [404, 'Tarefa não encontrada.'],
    QUEUE_EMPTY:     [400, 'A fila não possui tarefas.'],
  };
  const [status, message] = map[error.message] || [500, 'Erro interno.'];
  return res.status(status).json({ error: message });
}

// ─── QUEUES ───────────────────────────────────────────

async function listQueues(req, res) {
  try {
    const queues = await queueService.getUserQueues(req.user.id);
    res.json({ queues });
  } catch (e) {
    handleServiceError(res, e);
  }
}

async function getQueue(req, res) {
  try {
    const queue = await queueService.getQueue(req.user.id, req.params.id);
    res.json({ queue });
  } catch (e) {
    handleServiceError(res, e);
  }
}

async function createQueue(req, res) {
  const errors = getErrors(req);
  if (errors) return res.status(422).json({ errors });

  try {
    const queue = await queueService.createQueue(req.user.id, req.body);
    res.status(201).json({ queue });
  } catch (e) {
    handleServiceError(res, e);
  }
}

async function updateQueue(req, res) {
  const errors = getErrors(req);
  if (errors) return res.status(422).json({ errors });

  try {
    const queue = await queueService.updateQueue(req.user.id, req.params.id, req.body);
    res.json({ queue });
  } catch (e) {
    handleServiceError(res, e);
  }
}

async function deleteQueue(req, res) {
  try {
    await queueService.deleteQueue(req.user.id, req.params.id);
    res.status(204).send();
  } catch (e) {
    handleServiceError(res, e);
  }
}

async function advanceQueue(req, res) {
  try {
    const queue = await queueService.advanceQueue(req.user.id, req.params.id);
    res.json({ queue });
  } catch (e) {
    handleServiceError(res, e);
  }
}

// ─── TASKS ────────────────────────────────────────────

async function createTask(req, res) {
  const errors = getErrors(req);
  if (errors) return res.status(422).json({ errors });

  try {
    const task = await queueService.createTask(req.user.id, req.params.queueId, req.body);
    res.status(201).json({ task });
  } catch (e) {
    handleServiceError(res, e);
  }
}

async function updateTask(req, res) {
  const errors = getErrors(req);
  if (errors) return res.status(422).json({ errors });

  try {
    const task = await queueService.updateTask(
      req.user.id, req.params.queueId, req.params.taskId, req.body
    );
    res.json({ task });
  } catch (e) {
    handleServiceError(res, e);
  }
}

async function deleteTask(req, res) {
  try {
    await queueService.deleteTask(req.user.id, req.params.queueId, req.params.taskId);
    res.status(204).send();
  } catch (e) {
    handleServiceError(res, e);
  }
}

async function reorderTasks(req, res) {
  try {
    const queue = await queueService.reorderTasks(
      req.user.id, req.params.queueId, req.body.taskIds
    );
    res.json({ queue });
  } catch (e) {
    handleServiceError(res, e);
  }
}

module.exports = {
  listQueues, getQueue, createQueue, updateQueue, deleteQueue, advanceQueue,
  createTask, updateTask, deleteTask, reorderTasks,
};
