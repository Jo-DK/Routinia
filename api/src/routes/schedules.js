const { Router } = require('express');
const { body }   = require('express-validator');
const auth       = require('../middleware/auth');
const c          = require('../controllers/scheduleController');

const router = Router();
router.use(auth);

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM

const validate = [
  body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek deve ser 0–6'),
  body('startTime').matches(timeRegex).withMessage('startTime inválido (use HH:MM)'),
  body('endTime').matches(timeRegex).withMessage('endTime inválido (use HH:MM)'),
];

router.get('/',     c.list);
router.post('/',    [body('queueId').notEmpty(), ...validate], c.create);
router.put('/:id',  validate, c.update);
router.delete('/:id', c.remove);

module.exports = router;
