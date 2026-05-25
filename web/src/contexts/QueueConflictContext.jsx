// =====================================================
// CONTEXTO DE CONFLITO DE HORÁRIO ENTRE FILAS
//
// Detecta se duas ou mais filas com defaultStartTime /
// defaultEndTime definidos têm horários sobrepostos
// nos mesmos dias da semana.
//
// Expõe:
//   hasConflict — boolean
//   refresh()   — re-busca as filas e recalcula
// =====================================================
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const QueueConflictContext = createContext({ hasConflict: false, refresh: () => {} });

const timeToMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function computeConflict(queues) {
  // Só considera filas com os dois horários definidos
  const timed = queues.filter(q => q.defaultStartTime && q.defaultEndTime);
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i], b = timed[j];
      // Sobreposição de dias ([] = todo dia)
      const aAll = !a.weekDays?.length;
      const bAll = !b.weekDays?.length;
      const daysOverlap = aAll || bAll || a.weekDays.some(d => b.weekDays.includes(d));
      if (!daysOverlap) continue;
      // Sobreposição de horário
      const aS = timeToMin(a.defaultStartTime), aE = timeToMin(a.defaultEndTime);
      const bS = timeToMin(b.defaultStartTime), bE = timeToMin(b.defaultEndTime);
      if (aS < bE && aE > bS) return true;
    }
  }
  return false;
}

export function QueueConflictProvider({ children }) {
  const [hasConflict, setHasConflict] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/queues');
      setHasConflict(computeConflict(data.queues));
    } catch { /* silencioso — não bloqueia o utilizador */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <QueueConflictContext.Provider value={{ hasConflict, refresh }}>
      {children}
    </QueueConflictContext.Provider>
  );
}

export const useQueueConflict = () => useContext(QueueConflictContext);
