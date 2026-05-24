// Funções que chamam a API de Filas e Tarefas.
// Centralizar aqui evita repetir a URL em vários componentes.

import api from './axios';

// ─── QUEUES ───────────────────────────────────────────
export const getQueues    = ()           => api.get('/queues');
export const getQueue     = (id)         => api.get(`/queues/${id}`);
export const createQueue  = (data)       => api.post('/queues', data);
export const updateQueue  = (id, data)   => api.put(`/queues/${id}`, data);
export const deleteQueue  = (id)         => api.delete(`/queues/${id}`);
export const advanceQueue = (id)         => api.patch(`/queues/${id}/advance`);

// ─── TASKS ────────────────────────────────────────────
export const createTask  = (queueId, data)         => api.post(`/queues/${queueId}/tasks`, data);
export const updateTask  = (queueId, taskId, data) => api.put(`/queues/${queueId}/tasks/${taskId}`, data);
export const deleteTask  = (queueId, taskId)       => api.delete(`/queues/${queueId}/tasks/${taskId}`);
export const reorderTasks = (queueId, taskIds)     => api.patch(`/queues/${queueId}/tasks/reorder`, { taskIds });
