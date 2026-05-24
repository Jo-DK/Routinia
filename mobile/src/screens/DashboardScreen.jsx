import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

// ── Helpers ───────────────────────────────────────────
const DAYS_LONG  = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS     = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// JS getDay(): 0=Dom … 6=Sáb  →  API dayOfWeek: 0=Seg … 6=Dom
function getTodayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function formatDate() {
  const now = new Date();
  return `${now.getDate()} de ${MONTHS[now.getMonth()]}`;
}

function currentTaskOf(queue) {
  if (!queue?.tasks?.length) return null;
  return queue.tasks[queue.currentTaskIndex ?? 0] ?? queue.tasks[0];
}

// ── Componente: card de agendamento de hoje ───────────
function TodayCard({ schedule, onAdvance, advancing }) {
  const queue = schedule.queue;
  const task  = currentTaskOf(queue);
  const canAdvance = (queue?.tasks?.length ?? 0) > 1;

  return (
    <View style={styles.todayCard}>
      <View style={[styles.todayStripe, { backgroundColor: queue?.color ?? '#6366f1' }]} />
      <View style={styles.todayBody}>
        <View style={styles.todayTop}>
          <Text style={styles.todayTime}>{schedule.startTime} – {schedule.endTime}</Text>
          <Text style={styles.todayQueueName} numberOfLines={1}>{queue?.name}</Text>
        </View>
        {task ? (
          <View style={styles.todayTaskRow}>
            <View style={[styles.taskDot, { backgroundColor: queue?.color ?? '#6366f1' }]} />
            <Text style={styles.todayTaskName} numberOfLines={1}>{task.name}</Text>
          </View>
        ) : (
          <Text style={styles.todayNoTask}>Nenhuma tarefa cadastrada</Text>
        )}
        {canAdvance && (
          <TouchableOpacity
            style={[styles.advanceBtn, advancing && styles.advanceBtnDisabled]}
            onPress={() => onAdvance(schedule)}
            disabled={advancing}
          >
            <Text style={styles.advanceBtnText}>{advancing ? '…' : '⏭  Próxima tarefa'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Componente: mini-strip semanal ────────────────────
function WeekStrip({ schedules, todayIndex }) {
  const hasByDay = Array.from({ length: 7 }, (_, i) =>
    schedules.some(s => s.dayOfWeek === i)
  );

  return (
    <View style={styles.weekStrip}>
      {DAYS_SHORT.map((d, i) => (
        <View key={i} style={styles.weekDay}>
          <Text style={[styles.weekDayLabel, i === todayIndex && styles.weekDayLabelToday]}>{d}</Text>
          <View style={[
            styles.weekDot,
            hasByDay[i]  && styles.weekDotFilled,
            i === todayIndex && hasByDay[i]  && styles.weekDotToday,
            i === todayIndex && !hasByDay[i] && styles.weekDotTodayEmpty,
          ]} />
        </View>
      ))}
    </View>
  );
}

// ── Componente: card de fila (acesso rápido) ──────────
function QueueQuickCard({ queue, onPress }) {
  const task = currentTaskOf(queue);
  return (
    <TouchableOpacity style={styles.queueCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.queueStripe, { backgroundColor: queue.color }]} />
      <View style={styles.queueBody}>
        <Text style={styles.queueName} numberOfLines={1}>{queue.name}</Text>
        {task
          ? <Text style={styles.queueTask} numberOfLines={1}>▶ {task.name}</Text>
          : <Text style={styles.queueEmpty}>Sem tarefas</Text>
        }
      </View>
      <Text style={styles.queueArrow}>›</Text>
    </TouchableOpacity>
  );
}

// ── Tela principal ────────────────────────────────────
export default function DashboardScreen() {
  const navigation      = useNavigation();
  const { user, logout } = useAuth();

  const [schedules,  setSchedules]  = useState([]);
  const [queues,     setQueues]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [advancing,  setAdvancing]  = useState(null); // scheduleId em progresso

  const todayIndex = getTodayIndex();

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    try {
      const [sRes, qRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/queues'),
      ]);
      setSchedules(sRes.data.schedules);
      setQueues(qRes.data.queues);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvance(schedule) {
    setAdvancing(schedule.id);
    try {
      const { data } = await api.patch(`/queues/${schedule.queue.id}/advance`);
      // Atualiza a fila dentro dos schedules localmente
      setSchedules(prev =>
        prev.map(s =>
          s.queue?.id === schedule.queue.id
            ? { ...s, queue: data.queue }
            : s
        )
      );
      setQueues(prev =>
        prev.map(q => q.id === data.queue.id ? { ...q, ...data.queue } : q)
      );
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao avançar.');
    } finally {
      setAdvancing(null);
    }
  }

  const todaySchedules = schedules
    .filter(s => s.dayOfWeek === todayIndex)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>Routinia</Text>
        </View>
        <ActivityIndicator style={{ marginTop: 60 }} color="#6366f1" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Cabeçalho ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>Routinia</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutBtn}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Saudação ── */}
        <View style={styles.greeting}>
          <Text style={styles.greetingName}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.greetingDate}>{DAYS_LONG[todayIndex]}, {formatDate()}</Text>
        </View>

        {/* ── Strip semanal ── */}
        <WeekStrip schedules={schedules} todayIndex={todayIndex} />

        {/* ── Hoje ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoje</Text>

          {todaySchedules.length === 0 ? (
            <View style={styles.emptyToday}>
              <Text style={styles.emptyTodayIcon}>☀️</Text>
              <Text style={styles.emptyTodayText}>Nenhuma fila agendada para hoje</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Calendário')}
                style={styles.scheduleLink}
              >
                <Text style={styles.scheduleLinkText}>Agendar no calendário →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todaySchedules.map(s => (
              <TodayCard
                key={s.id}
                schedule={s}
                onAdvance={handleAdvance}
                advancing={advancing === s.id}
              />
            ))
          )}
        </View>

        {/* ── Acesso rápido às filas ── */}
        {queues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Suas Filas</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Filas')}>
                <Text style={styles.sectionLink}>Ver todas →</Text>
              </TouchableOpacity>
            </View>

            {queues.map(q => (
              <QueueQuickCard
                key={q.id}
                queue={q}
                onPress={() => navigation.navigate('Filas', { screen: 'QueueDetail', params: { queueId: q.id, name: q.name } })}
              />
            ))}
          </View>
        )}

        {queues.length === 0 && (
          <View style={styles.emptyAll}>
            <Text style={styles.emptyAllIcon}>📋</Text>
            <Text style={styles.emptyAllTitle}>Comece criando suas filas</Text>
            <Text style={styles.emptyAllDesc}>
              Organize sua rotina em filas de tarefas que rotacionam automaticamente.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => navigation.navigate('Filas')}
            >
              <Text style={styles.ctaBtnText}>Criar primeira fila</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f9fafb' },
  scroll:      { padding: 20, paddingBottom: 40 },

  // Header
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  logo:        { fontSize: 20, fontWeight: '700', color: '#4f46e5' },
  logoutBtn:   { fontSize: 14, color: '#9ca3af' },

  // Saudação
  greeting:      { marginBottom: 20 },
  greetingName:  { fontSize: 24, fontWeight: '700', color: '#1f2937' },
  greetingDate:  { fontSize: 14, color: '#9ca3af', marginTop: 2 },

  // Strip semanal
  weekStrip:          { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  weekDay:            { alignItems: 'center', gap: 6 },
  weekDayLabel:       { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  weekDayLabelToday:  { color: '#4f46e5', fontWeight: '700' },
  weekDot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f3f4f6' },
  weekDotFilled:      { backgroundColor: '#c7d2fe' },
  weekDotToday:       { backgroundColor: '#4f46e5' },
  weekDotTodayEmpty:  { borderWidth: 1.5, borderColor: '#4f46e5', backgroundColor: 'transparent' },

  // Seções
  section:     { marginBottom: 24 },
  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  sectionLink: { fontSize: 13, color: '#4f46e5', fontWeight: '600' },

  // Card de hoje
  todayCard:    { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, marginBottom: 10, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  todayStripe:  { width: 5 },
  todayBody:    { flex: 1, padding: 14, gap: 6 },
  todayTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayTime:    { fontSize: 12, color: '#9ca3af', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  todayQueueName: { fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1 },
  todayTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskDot:      { width: 6, height: 6, borderRadius: 3 },
  todayTaskName:{ fontSize: 14, color: '#374151', flex: 1 },
  todayNoTask:  { fontSize: 13, color: '#d1d5db', fontStyle: 'italic' },
  advanceBtn:   { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#eef2ff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  advanceBtnDisabled: { opacity: 0.5 },
  advanceBtnText: { color: '#4f46e5', fontWeight: '600', fontSize: 13 },

  // Empty today
  emptyToday:     { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', gap: 6 },
  emptyTodayIcon: { fontSize: 36, marginBottom: 4 },
  emptyTodayText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  scheduleLink:   { marginTop: 4 },
  scheduleLinkText: { fontSize: 13, color: '#4f46e5', fontWeight: '600' },

  // Card de fila rápida
  queueCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, marginBottom: 8, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  queueStripe: { width: 4, alignSelf: 'stretch' },
  queueBody:   { flex: 1, paddingVertical: 14, paddingLeft: 14 },
  queueName:   { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  queueTask:   { fontSize: 12, color: '#6b7280', marginTop: 2 },
  queueEmpty:  { fontSize: 12, color: '#d1d5db', fontStyle: 'italic', marginTop: 2 },
  queueArrow:  { fontSize: 20, color: '#d1d5db', paddingHorizontal: 14 },

  // Empty all
  emptyAll:      { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyAllIcon:  { fontSize: 56, marginBottom: 8 },
  emptyAllTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  emptyAllDesc:  { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20, maxWidth: 280, marginBottom: 8 },
  ctaBtn:        { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText:    { color: 'white', fontWeight: '600', fontSize: 15 },
});
