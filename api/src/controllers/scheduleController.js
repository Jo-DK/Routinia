const { validationResult } = require('express-validator');
const scheduleService = require('../services/scheduleService');

function getErrors(req) {
  const r = validationResult(req);
  return r.isEmpty() ? null : r.array().map(e => ({ field: e.path, message: e.msg }));
}

function handleError(res, err) {
  const map = {
    QUEUE_NOT_FOUND:    [404, 'Fila não encontrada.'],
    SCHEDULE_NOT_FOUND: [404, 'Agendamento não encontrado.'],
    TIME_OVERLAP:       [409, 'Este horário já está ocupado por outro agendamento.'],
  };
  const [status, message] = map[err.message] || [500, 'Erro interno.'];
  return res.status(status).json({ error: message });
}

async function list(req, res) {
  try { res.json({ schedules: await scheduleService.getSchedules(req.user.id) }); }
  catch (e) { handleError(res, e); }
}

async function create(req, res) {
  const errors = getErrors(req);
  if (errors) return res.status(422).json({ errors });
  try {
    const schedule = await scheduleService.createSchedule(req.user.id, req.body);
    res.status(201).json({ schedule });
  } catch (e) { handleError(res, e); }
}

async function update(req, res) {
  const errors = getErrors(req);
  if (errors) return res.status(422).json({ errors });
  try {
    const schedule = await scheduleService.updateSchedule(req.user.id, req.params.id, req.body);
    res.json({ schedule });
  } catch (e) { handleError(res, e); }
}

async function remove(req, res) {
  try {
    await scheduleService.deleteSchedule(req.user.id, req.params.id);
    res.status(204).send();
  } catch (e) { handleError(res, e); }
}

module.exports = { list, create, update, remove };
