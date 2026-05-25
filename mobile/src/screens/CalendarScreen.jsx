// =====================================================
// TELA DE CALENDÁRIO — MOBILE
// No mobile, drag-and-drop em um grid de horas é pouco prático.
// Usamos uma abordagem de "toque para agendar":
//   1. Tela principal: agenda semanal em lista (Seg-Dom)
//   2. Toque em "+ Agendar": abre modal para escolher
//      fila, dia e horário
//   3. Toque em um agendamento: opção de remover
// =====================================================
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import api from '../api/axios';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Retorna true se o dia está ativo para a fila
// weekDays vazio = sem restrição (todo dia é válido)
function isDayActive(queue, dayIndex) {
  if (!queue?.weekDays || queue.weekDays.length === 0) return true;
  return queue.weekDays.includes(dayIndex);
}

// Gera opções de horário de 06:00 a 22:30 em intervalos de 30min
function generateTimeOptions() {
  const times = [];
  for (let h = 6; h < 23; h++) {
    times.push(`${String(h).padStart(2,'0')}:00`);
    times.push(`${String(h).padStart(2,'0')}:30`);
  }
  times.push('23:00');
  return times;
}
const TIME_OPTIONS = generateTimeOptions();

// ── Modal: criar agendamento ──────────────────────────
function ScheduleModal({ visible, queues, onClose, onSave }) {
  const [queueId,   setQueueId]   = useState(queues[0]?.id ?? '');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime,   setEndTime]   = useState('09:00');
  const [loading,   setLoading]   = useState(false);

  // Fila seleccionada — usada para ler weekDays e horário padrão
  const selectedQueue = queues.find(q => q.id === queueId);
  const hasWeekDays   = selectedQueue?.weekDays?.length > 0;

  // Pré-preenche os horários com os defaults da fila quando muda a selecção
  useEffect(() => {
    if (selectedQueue?.defaultStartTime) setStartTime(selectedQueue.defaultStartTime);
    else setStartTime('08:00');
    if (selectedQueue?.defaultEndTime)   setEndTime(selectedQueue.defaultEndTime);
    else setEndTime('09:00');
  }, [queueId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!queueId) { Alert.alert('Erro', 'Selecione uma fila'); return; }
    if (startTime >= endTime) { Alert.alert('Erro', 'Horário de fim deve ser após o início'); return; }

    setLoading(true);

    // Se a fila tem dias definidos, cria um schedule para cada um deles;
    // caso contrário, cria só no dia seleccionado.
    const targetDays = hasWeekDays ? selectedQueue.weekDays : [dayOfWeek];

    try {
      const results = await Promise.allSettled(
        targetDays.map(day =>
          api.post('/schedules', { queueId, dayOfWeek: day, startTime, endTime })
        )
      );

      const created = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data.schedule);

      const skipped = results.filter(r => r.status === 'rejected').length;

      if (created.length === 0) {
        Alert.alert('Conflito de horário', 'Não foi possível agendar: conflito em todos os dias.');
        return;
      }

      onSave(created);
      onClose();

      if (skipped > 0) {
        Alert.alert(
          'Agendado parcialmente',
          `Criado em ${created.length} dia(s). ${skipped} dia(s) ignorado(s) por conflito de horário.`
        );
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível agendar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={m.container}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}><Text style={m.cancel}>Cancelar</Text></TouchableOpacity>
          <Text style={m.title}>Novo agendamento</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[m.save, loading && { opacity: 0.4 }]}>{loading ? '...' : 'Salvar'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={m.body}>
          <Text style={m.label}>Fila</Text>
          <View style={m.pickerWrap}>
            <Picker selectedValue={queueId} onValueChange={setQueueId}>
              {queues.map(q => <Picker.Item key={q.id} label={q.name} value={q.id} />)}
            </Picker>
          </View>

          {/* Resumo de dias ou picker de dia */}
          {hasWeekDays ? (
            <View style={m.weekDaysSummary}>
              <Text style={m.weekDaysSummaryLabel}>📅 Será agendado em:</Text>
              <View style={m.weekDaysPills}>
                {selectedQueue.weekDays.map(d => (
                  <View key={d} style={[m.pill, { backgroundColor: selectedQueue.color + '22' }]}>
                    <Text style={[m.pillText, { color: selectedQueue.color }]}>{DAYS_SHORT[d]}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <>
              <Text style={m.label}>Dia da semana</Text>
              <View style={m.pickerWrap}>
                <Picker selectedValue={dayOfWeek} onValueChange={v => setDayOfWeek(Number(v))}>
                  {DAYS.map((d, i) => <Picker.Item key={i} label={d} value={i} />)}
                </Picker>
              </View>
            </>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={m.label}>Início</Text>
              <View style={m.pickerWrap}>
                <Picker selectedValue={startTime} onValueChange={setStartTime}>
                  {TIME_OPTIONS.map(t => <Picker.Item key={t} label={t} value={t} />)}
                </Picker>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={m.label}>Fim</Text>
              <View style={m.pickerWrap}>
                <Picker selectedValue={endTime} onValueChange={setEndTime}>
                  {TIME_OPTIONS.map(t => <Picker.Item key={t} label={t} value={t} />)}
                </Picker>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const m = StyleSheet.create({
  container:        { flex: 1, backgroundColor: 'white' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title:            { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  cancel:           { fontSize: 15, color: '#9ca3af' },
  save:             { fontSize: 15, fontWeight: '600', color: '#4f46e5' },
  body:             { padding: 20 },
  label:            { fontSize: 13, fontWeight: '500', color: '#374151', marginTop: 16, marginBottom: 4 },
  pickerWrap:       { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, overflow: 'hidden' },
  weekDaysSummary:  { marginTop: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  weekDaysSummaryLabel: { fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 8 },
  weekDaysPills:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill:             { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText:         { fontSize: 12, fontWeight: '600' },
});

// ── Tela principal ────────────────────────────────────
export default function CalendarScreen() {
  const [queues,    setQueues]    = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    try {
      const [qRes, sRes] = await Promise.all([api.get('/queues'), api.get('/schedules')]);
      setQueues(qRes.data.queues);
      setSchedules(sRes.data.schedules);
    } catch { Alert.alert('Erro', 'Não foi possível carregar.'); }
    finally { setLoading(false); }
  }

  function handleSaved(created) {
    // created é sempre um array (um ou mais schedules)
    setSchedules(prev => [...prev, ...created]);
  }

  function handleDelete(schedule) {
    Alert.alert(
      'Remover agendamento?',
      `${schedule.queue.name} — ${DAYS[schedule.dayOfWeek]} ${schedule.startTime}–${schedule.endTime}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/schedules/${schedule.id}`);
              setSchedules(prev => prev.filter(s => s.id !== schedule.id));
            } catch { Alert.alert('Erro', 'Não foi possível remover.'); }
          },
        },
      ]
    );
  }

  // Agrupa por dia da semana
  const byDay = Array.from({ length: 7 }, (_, i) =>
    schedules
      .filter(s => s.dayOfWeek === i)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  const today = new Date().getDay();
  const todayCol = today === 0 ? 6 : today - 1;

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Routinia</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Text style={styles.addBtnText}>+ Agendar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {byDay.map((daySchedules, dayIndex) => (
          <View key={dayIndex}>
            {/* Cabeçalho do dia */}
            <View style={[styles.dayHeader, dayIndex === todayCol && styles.dayHeaderToday]}>
              <Text style={[styles.dayName, dayIndex === todayCol && styles.dayNameToday]}>
                {DAYS[dayIndex]}
              </Text>
              {dayIndex === todayCol && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Hoje</Text>
                </View>
              )}
            </View>

            {/* Agendamentos do dia */}
            {daySchedules.length === 0 ? (
              <Text style={styles.emptyDay}>Nenhum agendamento</Text>
            ) : (
              daySchedules.map(s => {
                // Procura a fila completa (com weekDays) no array de filas
                const fullQueue = queues.find(q => q.id === s.queue?.id);
                const offDay    = !isDayActive(fullQueue, dayIndex);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.scheduleCard, offDay && styles.scheduleCardOffDay]}
                    onPress={() => handleDelete(s)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.colorStripe, { backgroundColor: s.queue?.color ?? '#6366f1', opacity: offDay ? 0.4 : 1 }]} />
                    <View style={styles.scheduleInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {offDay && <Text style={styles.offDayIcon}>⚠️</Text>}
                        <Text style={[styles.scheduleName, offDay && styles.scheduleNameOffDay]}>
                          {s.queue?.name}
                        </Text>
                      </View>
                      <Text style={styles.scheduleTime}>{s.startTime} – {s.endTime}</Text>
                      {offDay && (
                        <Text style={styles.offDayHint}>Fora dos dias activos desta fila</Text>
                      )}
                      {!offDay && s.queue?.tasks?.[s.queue?.currentTaskIndex] && (
                        <Text style={styles.scheduleTask} numberOfLines={1}>
                          ▶ {s.queue.tasks[s.queue.currentTaskIndex].name}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.deleteHint}>Toque para remover</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ))}

        {schedules.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Calendário vazio</Text>
            <Text style={styles.emptyDesc}>Toque em "+ Agendar" para adicionar uma fila ao calendário</Text>
          </View>
        )}
      </ScrollView>

      {queues.length > 0 && (
        <ScheduleModal
          visible={modal}
          queues={queues}
          onClose={() => setModal(false)}
          onSave={handleSaved}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9fafb' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  logo:            { fontSize: 20, fontWeight: '700', color: '#4f46e5' },
  addBtn:          { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText:      { color: 'white', fontWeight: '600', fontSize: 14 },
  dayHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dayHeaderToday:  {},
  dayName:         { fontSize: 15, fontWeight: '600', color: '#374151' },
  dayNameToday:    { color: '#4f46e5' },
  todayBadge:      { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  todayBadgeText:  { fontSize: 11, color: '#4f46e5', fontWeight: '600' },
  emptyDay:        { fontSize: 13, color: '#d1d5db', marginBottom: 4, paddingLeft: 4 },
  scheduleCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, marginBottom: 6, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  scheduleCardOffDay:  { opacity: 0.6, borderWidth: 1.5, borderColor: '#fbbf24', borderStyle: 'dashed' },
  colorStripe:         { width: 4, alignSelf: 'stretch' },
  scheduleInfo:        { flex: 1, padding: 12 },
  scheduleName:        { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  scheduleNameOffDay:  { color: '#9ca3af' },
  offDayIcon:          { fontSize: 12 },
  offDayHint:          { fontSize: 11, color: '#f59e0b', marginTop: 2 },
  scheduleTime:        { fontSize: 12, color: '#6b7280', marginTop: 2 },
  scheduleTask:        { fontSize: 12, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' },
  deleteHint:          { fontSize: 10, color: '#d1d5db', paddingRight: 10 },
  empty:           { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon:       { fontSize: 48 },
  emptyTitle:      { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptyDesc:       { fontSize: 14, color: '#9ca3af', textAlign: 'center', maxWidth: 280 },
});
