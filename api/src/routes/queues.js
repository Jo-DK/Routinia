// =====================================================
// ROTAS DE FILAS E TAREFAS
// Todas as rotas são protegidas por authMiddleware.
//
// Endpoints:
//   GET    /api/queues                          → lista filas
//   POST   /api/queues                          → cria fila
//   GET    /api/queues/:id                      → detalhe da fila
//   PUT    /api/queues/:id                      → edita fila
//   DELETE /api/queues/:id                      → exclui fila
//   PATCH  /api/queues/:id/advance              → avança para próxima tarefa
//
//   POST   /api/queues/:queueId/tasks           → cria tarefa
//   PUT    /api/queues/:queueId/tasks/:taskId   → edita tarefa
//   DELETE /api/queues/:queueId/tasks/:taskId   → exclui tarefa
//   PATCH  /api/queues/:queueId/tasks/reorder   → reordena tarefas
// =====================================================

const { Router } = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const c = require('../controllers/queueController');

const router = Router();

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// ─── QUEUES ───────────────────────────────────────────
router.get('/', c.listQueues);
router.get('/:id', c.getQueue);

router.post('/',
  [body('name').trim().notEmpty().withMessage('Nome é obrigatório')],
  c.createQueue
);

router.put('/:id',
  [body('name').trim().notEmpty().withMessage('Nome é obrigatório')],
  c.updateQueue
);

router.delete('/:id', c.deleteQueue);
router.patch('/:id/advance', c.advanceQueue);

// ─── TASKS ────────────────────────────────────────────
router.post('/:queueId/tasks',
  [body('name').trim().notEmpty().withMessage('Nome da tarefa é obrigatório')],
  c.createTask
);

router.put('/:queueId/tasks/:taskId',
  [body('name').trim().notEmpty().withMessage('Nome da tarefa é obrigatório')],
  c.updateTask
);

router.delete('/:queueId/tasks/:taskId', c.deleteTask);

router.patch('/:queueId/tasks/reorder',
  [body('taskIds').isArray({ min: 1 }).withMessage('taskIds deve ser um array')],
  c.reorderTasks
);

module.exports = router;
