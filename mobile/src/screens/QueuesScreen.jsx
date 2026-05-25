import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useQueueConflict } from '../contexts/QueueConflictContext';
import api from '../api/axios';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#22c55e', '#3b82f6', '#06b6d4',
];

// Abreviações dos dias (0=Seg … 6=Dom)
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Converte array de índices em texto legível (ex: "Seg · Ter · Qua")
function weekDaysLabel(days) {
  if (!days || days.length === 0) return 'Todo dia';
  if (days.length === 7) return 'Todo dia';
  if (JSON.stringify([...days].sort()) === '[0,1,2,3,4]') return 'Seg – Sex';
  if (JSON.stringify([...days].sort()) === '[0,1,2,3,4,5,6]') return 'Todo dia';
  return days.map(d => DAYS[d]).join(' · ');
}

// ── Atalhos de dias predefinidos ──────────────────────
const DAY_PRESETS = [
  { label: 'Todo dia',  days: [] },
  { label: 'Seg – Sex', days: [0, 1, 2, 3, 4] },
  { label: 'Fins de semana', days: [5, 6] },
];

// ── Modal criar/editar fila ───────────────────────────
function QueueModal({ visible, queue, onClose, onSave }) {
  const isEditing = !!queue;
  const [name,         setName]         = useState('');
  const [description,      setDescription]      = useState('');
  const [color,            setColor]            = useState('#6366f1');
  const [rotationType,     setRotationType]     = useState('sequential');
  const [weekDays,         setWeekDays]         = useState([]);
  const [defaultStartTime, setDefaultStartTime] = useState('');
  const [defaultEndTime,   setDefaultEndTime]   = useState('');
  const [loading,          setLoading]          = useState(false);

  // Preenche o form quando abre para edição
  useEffect(() => {
    if (queue) {
      setName(queue.name);
      setDescription(queue.description ?? '');
      setColor(queue.color);
      setRotationType(queue.rotationType);
      setWeekDays(queue.weekDays ?? []);
      setDefaultStartTime(queue.defaultStartTime ?? '');
      setDefaultEndTime(queue.defaultEndTime ?? '');
    } else {
      setName(''); setDescription(''); setColor('#6366f1');
      setRotationType('sequential'); setWeekDays([]);
      setDefaultStartTime(''); setDefaultEndTime('');
    }
  }, [queue, visible]);

  // Alterna um dia no array
  function toggleDay(index) {
    setWeekDays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index].sort((a, b) => a - b)
    );
  }

  // Verifica se um preset está ativo
  function isPresetActive(presetDays) {
    const sorted = [...presetDays].sort((a, b) => a - b);
    const current = [...weekDays].sort((a, b) => a - b);
    return JSON.stringify(sorted) === JSON.stringify(current);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Erro', 'Nome é obrigatório'); return; }
    setLoading(true);
    try {
      const payload = { name, description, color, rotationType, weekDays, defaultStartTime, defaultEndTime };
      const res = isEditing
        ? await api.put(`/queues/${queue.id}`, payload)
        : await api.post('/queues', payload);
      onSave(res.data.queue);
      onClose();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a fila.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEditing ? 'Editar fila' : 'Nova fila'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.modalSave, loading && { opacity: 0.5 }]}>
              {loading ? '...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Nome *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Academia, Leitura..."
          />

          <Text style={styles.fieldLabel}>Descrição</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Opcional"
            multiline
          />

          <Text style={styles.fieldLabel}>Cor</Text>
          <View style={styles.colorRow}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]}
              />
            ))}
          </View>

          {/* ── Escopo semanal ── */}
          <Text style={styles.fieldLabel}>Dias da semana</Text>

          {/* Atalhos rápidos */}
          <View style={styles.presetsRow}>
            {DAY_PRESETS.map(p => (
              <TouchableOpacity
                key={p.label}
                onPress={() => setWeekDays(p.days)}
                style={[styles.presetChip, isPresetActive(p.days) && styles.presetChipActive]}
              >
                <Text style={[styles.presetChipText, isPresetActive(p.days) && styles.presetChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Seletor individual por dia */}
          <View style={styles.daysRow}>
            {DAYS.map((label, i) => {
              const active = weekDays.includes(i);
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleDay(i)}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.weekDaysSummary}>
            {weekDays.length === 0
              ? '✅ Ativa todos os dias'
              : `📅 Ativa: ${weekDays.map(d => DAYS[d]).join(', ')}`}
          </Text>

          {/* ── Horário padrão (opcional) ── */}
          <Text style={styles.fieldLabel}>Horário padrão <Text style={styles.fieldLabelOptional}>(opcional)</Text></Text>
          <Text style={styles.fieldHint}>Usado para detectar conflitos. Deixe em branco se não houver horário fixo.</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldSubLabel}>Início</Text>
              <TextInput
                style={styles.input}
                value={defaultStartTime}
                onChangeText={setDefaultStartTime}
                placeholder="08:00"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldSubLabel}>Fim</Text>
              <TextInput
                style={styles.input}
                value={defaultEndTime}
                onChangeText={setDefaultEndTime}
                placeholder="09:00"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Tipo de rotação</Text>
          {[
            { value: 'sequential', label: '🔄 Automática', desc: 'Avança sozinha a cada execução' },
            { value: 'manual',     label: '✋ Manual',     desc: 'Você avança ao concluir' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setRotationType(opt.value)}
              style={[styles.rotationOption, rotationType === opt.value && styles.rotationSelected]}
            >
              <Text style={styles.rotationLabel}>{opt.label}</Text>
              <Text style={styles.rotationDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Card de fila ──────────────────────────────────────
function QueueCard({ queue, onPress, onEdit, onDelete }) {
  const daysLabel = weekDaysLabel(queue.weekDays);
  const isAllDays = !queue.weekDays || queue.weekDays.length === 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cardStripe, { backgroundColor: queue.color }]} />
      <View style={styles.cardBody}>
        {/* Nome + badge de dias */}
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName} numberOfLines={1}>{queue.name}</Text>
          <View style={[styles.daysBadge, { backgroundColor: queue.color + '22' }]}>
            <Text style={[styles.daysBadgeText, { color: queue.color }]}>
              {isAllDays ? 'Todo dia' : daysLabel}
            </Text>
          </View>
        </View>

        {queue.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{queue.description}</Text>
        ) : null}

        {queue.currentTask ? (
          <View style={styles.currentTaskBox}>
            <Text style={styles.currentTaskLabel}>Tarefa atual</Text>
            <Text style={styles.currentTaskName} numberOfLines={1}>{queue.currentTask.name}</Text>
          </View>
        ) : (
          <View style={styles.currentTaskBox}>
            <Text style={styles.currentTaskLabel}>Nenhuma tarefa ainda</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>{queue.taskCount} tarefa{queue.taskCount !== 1 ? 's' : ''}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => onEdit(queue)} style={styles.actionBtn}>
              <Text>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(queue)} style={styles.actionBtn}>
              <Text>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Tela principal ────────────────────────────────────
export default function QueuesScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { refresh: refreshConflict } = useQueueConflict();

  const [queues,  setQueues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null); // queue em edição

  // useFocusEffect recarrega ao voltar para esta tela (ex: após editar)
  useFocusEffect(useCallback(() => { loadQueues(); }, []));

  async function loadQueues() {
    try {
      const { data } = await api.get('/queues');
      setQueues(data.queues);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as filas.');
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(saved) {
    setQueues(prev => {
      const exists = prev.find(q => q.id === saved.id);
      return exists ? prev.map(q => q.id === saved.id ? saved : q) : [saved, ...prev];
    });
    refreshConflict();
  }

  function handleDeleteConfirm(queue) {
    Alert.alert(
      'Excluir fila?',
      `"${queue.name}" e todas as suas tarefas serão excluídas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/queues/${queue.id}`);
              setQueues(prev => prev.filter(q => q.id !== queue.id));
              refreshConflict();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Routinia</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutBtn}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Minhas Filas</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => { setEditing(null); setModal(true); }}
        >
          <Text style={styles.newBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" />
      ) : queues.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Nenhuma fila ainda</Text>
          <Text style={styles.emptyDesc}>Crie sua primeira fila para organizar sua rotina</Text>
          <TouchableOpacity style={styles.newBtn} onPress={() => setModal(true)}>
            <Text style={styles.newBtnText}>Criar fila</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={queues}
          keyExtractor={q => q.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <QueueCard
              queue={item}
              onPress={() => navigation.navigate('QueueDetail', { queueId: item.id, name: item.name })}
              onEdit={q => { setEditing(q); setModal(true); }}
              onDelete={handleDeleteConfirm}
            />
          )}
        />
      )}

      <QueueModal
        visible={modal}
        queue={editing}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={handleSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9fafb' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  logo:            { fontSize: 20, fontWeight: '700', color: '#4f46e5' },
  logoutBtn:       { fontSize: 14, color: '#9ca3af' },
  pageHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  pageTitle:       { fontSize: 22, fontWeight: '700', color: '#1f2937' },
  newBtn:          { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  newBtnText:      { color: 'white', fontWeight: '600', fontSize: 14 },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyIcon:       { fontSize: 48, marginBottom: 8 },
  emptyTitle:      { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptyDesc:       { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 8 },
  card:            { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardStripe:      { height: 6 },
  cardBody:        { padding: 14 },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName:        { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  daysBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  daysBadgeText:   { fontSize: 11, fontWeight: '600' },
  cardDesc:        { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  currentTaskBox:  { backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, marginTop: 10 },
  currentTaskLabel:{ fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  currentTaskName: { fontSize: 13, fontWeight: '500', color: '#374151' },
  cardFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardMeta:        { fontSize: 12, color: '#9ca3af' },
  cardActions:     { flexDirection: 'row', gap: 4 },
  actionBtn:       { padding: 6 },
  // Modal
  modalContainer:  { flex: 1, backgroundColor: 'white' },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:      { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  modalCancel:     { fontSize: 15, color: '#9ca3af' },
  modalSave:       { fontSize: 15, fontWeight: '600', color: '#4f46e5' },
  modalBody:       { padding: 20 },
  fieldLabel:         { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4, marginTop: 12 },
  fieldLabelOptional: { fontSize: 12, fontWeight: '400', color: '#9ca3af' },
  fieldHint:          { fontSize: 11, color: '#9ca3af', marginBottom: 6 },
  fieldSubLabel:      { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  input:           { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1f2937' },
  colorRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorCircle:     { width: 32, height: 32, borderRadius: 16 },
  colorSelected:   { transform: [{ scale: 1.25 }], borderWidth: 2.5, borderColor: 'white', elevation: 3 },
  rotationOption:   { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, marginBottom: 8 },
  rotationSelected: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  rotationLabel:    { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  rotationDesc:     { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  // Dias da semana
  presetsRow:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  presetChip:       { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  presetChipActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  presetChipText:   { fontSize: 13, color: '#6b7280' },
  presetChipTextActive: { color: '#4f46e5', fontWeight: '600' },
  daysRow:          { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  dayChip:          { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  dayChipActive:    { borderColor: '#4f46e5', backgroundColor: '#4f46e5' },
  dayChipText:      { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  dayChipTextActive:{ color: 'white' },
  weekDaysSummary:  { fontSize: 12, color: '#9ca3af', marginBottom: 4, marginTop: 2 },
});
