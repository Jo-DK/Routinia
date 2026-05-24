import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import api from '../api/axios';

// ── Modal de tarefa ───────────────────────────────────
function TaskModal({ visible, task, queueId, onClose, onSave }) {
  const isEditing = !!task;
  const [name, setName]   = useState(task?.name ?? '');
  const [desc, setDesc]   = useState(task?.description ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Erro', 'Nome é obrigatório'); return; }
    setLoading(true);
    try {
      const payload = { name, description: desc };
      const res = isEditing
        ? await api.put(`/queues/${queueId}/tasks/${task.id}`, payload)
        : await api.post(`/queues/${queueId}/tasks`, payload);
      onSave(res.data.task ?? res.data.task);
      onClose();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={mStyles.container}>
        <View style={mStyles.header}>
          <TouchableOpacity onPress={onClose}><Text style={mStyles.cancel}>Cancelar</Text></TouchableOpacity>
          <Text style={mStyles.title}>{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[mStyles.save, loading && { opacity: 0.4 }]}>{loading ? '...' : 'Salvar'}</Text>
          </TouchableOpacity>
        </View>
        <View style={mStyles.body}>
          <Text style={mStyles.label}>Nome *</Text>
          <TextInput style={mStyles.input} value={name} onChangeText={setName} placeholder="Nome da tarefa" autoFocus />
          <Text style={mStyles.label}>Descrição</Text>
          <TextInput
            style={[mStyles.input, { height: 80, textAlignVertical: 'top' }]}
            value={desc}
            onChangeText={setDesc}
            placeholder="Opcional"
            multiline
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title:     { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  cancel:    { fontSize: 15, color: '#9ca3af' },
  save:      { fontSize: 15, fontWeight: '600', color: '#4f46e5' },
  body:      { padding: 20 },
  label:     { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 12 },
  input:     { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
});

// ── Tela principal ────────────────────────────────────
export default function QueueDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { queueId } = route.params;

  const [queue,     setQueue]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null); // task em edição
  const [advancing, setAdvancing] = useState(false);

  useFocusEffect(useCallback(() => { loadQueue(); }, []));

  async function loadQueue() {
    try {
      const { data } = await api.get(`/queues/${queueId}`);
      setQueue(data.queue);
    } catch {
      Alert.alert('Erro', 'Fila não encontrada.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvance() {
    setAdvancing(true);
    try {
      const { data } = await api.patch(`/queues/${queueId}/advance`);
      setQueue(data.queue);
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao avançar.');
    } finally {
      setAdvancing(false);
    }
  }

  function handleTaskSaved(saved) {
    setQueue(prev => {
      const exists = prev.tasks.find(t => t.id === saved.id);
      const tasks  = exists
        ? prev.tasks.map(t => t.id === saved.id ? saved : t)
        : [...prev.tasks, saved];
      return { ...prev, tasks, taskCount: tasks.length };
    });
  }

  function handleDeleteTask(task) {
    Alert.alert('Excluir tarefa?', `"${task.name}" será excluída.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/queues/${queueId}/tasks/${task.id}`);
            setQueue(prev => {
              const tasks = prev.tasks.filter(t => t.id !== task.id);
              const idx   = Math.max(0, Math.min(prev.currentTaskIndex, tasks.length - 1));
              return { ...prev, tasks, taskCount: tasks.length, currentTaskIndex: idx };
            });
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  async function handleMove(fromIdx, toIdx) {
    const tasks   = [...queue.tasks];
    const [moved] = tasks.splice(fromIdx, 1);
    tasks.splice(toIdx, 0, moved);
    setQueue(prev => ({ ...prev, tasks }));
    try {
      await api.patch(`/queues/${queueId}/tasks/reorder`, { taskIds: tasks.map(t => t.id) });
    } catch {
      loadQueue(); // reverte
    }
  }

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" />
    </SafeAreaView>
  );

  const currentIdx = queue?.currentTaskIndex ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={[styles.colorDot, { backgroundColor: queue.color }]} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>{queue.name}</Text>
          <Text style={styles.headerSub}>{queue.taskCount} tarefa{queue.taskCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <FlatList
        data={queue.tasks}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListHeaderComponent={() => (
          <>
            {/* Tarefa atual + botão avançar */}
            {queue.tasks.length > 0 && (
              <View style={styles.currentCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentLabel}>Tarefa atual</Text>
                  <Text style={styles.currentName} numberOfLines={2}>
                    {queue.tasks[currentIdx]?.name ?? '—'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.advanceBtn, (advancing || queue.tasks.length <= 1) && styles.advanceBtnDisabled]}
                  onPress={handleAdvance}
                  disabled={advancing || queue.tasks.length <= 1}
                >
                  <Text style={styles.advanceBtnText}>{advancing ? '...' : '⏭ Próxima'}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tarefas</Text>
              <TouchableOpacity onPress={() => { setEditing(null); setModal(true); }}>
                <Text style={styles.addBtn}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>Nenhuma tarefa ainda</Text>
            <TouchableOpacity onPress={() => setModal(true)}>
              <Text style={styles.addBtn}>Adicionar tarefa</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item, index }) => {
          const isCurrent = index === currentIdx;
          return (
            <View style={[styles.taskCard, isCurrent && styles.taskCardCurrent]}>
              <View style={[styles.taskIndex, isCurrent && styles.taskIndexCurrent]}>
                <Text style={[styles.taskIndexText, isCurrent && { color: 'white' }]}>{index + 1}</Text>
              </View>
              <View style={styles.taskBody}>
                <Text style={styles.taskName} numberOfLines={1}>
                  {item.name}
                  {isCurrent ? '  ✦' : ''}
                </Text>
                {item.description ? <Text style={styles.taskDesc} numberOfLines={1}>{item.description}</Text> : null}
              </View>
              {/* Mover */}
              <View style={styles.moveButtons}>
                <TouchableOpacity onPress={() => handleMove(index, index - 1)} disabled={index === 0}>
                  <Text style={[styles.moveArrow, index === 0 && styles.moveArrowDisabled]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMove(index, index + 1)} disabled={index === queue.tasks.length - 1}>
                  <Text style={[styles.moveArrow, index === queue.tasks.length - 1 && styles.moveArrowDisabled]}>▼</Text>
                </TouchableOpacity>
              </View>
              {/* Ações */}
              <View style={styles.taskActions}>
                <TouchableOpacity onPress={() => { setEditing(item); setModal(true); }} style={styles.iconBtn}>
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTask(item)} style={styles.iconBtn}>
                  <Text>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <TaskModal
        visible={modal}
        task={editing}
        queueId={queueId}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={handleTaskSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9fafb' },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn:         { padding: 4 },
  backText:        { fontSize: 22, color: '#6b7280' },
  colorDot:        { width: 14, height: 14, borderRadius: 7 },
  headerText:      { flex: 1 },
  headerTitle:     { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  headerSub:       { fontSize: 12, color: '#9ca3af' },
  currentCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, gap: 12 },
  currentLabel:    { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  currentName:     { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  advanceBtn:      { backgroundColor: '#4f46e5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  advanceBtnDisabled: { opacity: 0.4 },
  advanceBtnText:  { color: 'white', fontWeight: '600', fontSize: 13 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle:    { fontSize: 15, fontWeight: '600', color: '#374151' },
  addBtn:          { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
  empty:           { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIcon:       { fontSize: 36 },
  emptyText:       { fontSize: 14, color: '#9ca3af' },
  taskCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  taskCardCurrent: { borderColor: '#a5b4fc', backgroundColor: '#eef2ff' },
  taskIndex:       { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  taskIndexCurrent:{ backgroundColor: '#4f46e5' },
  taskIndexText:   { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  taskBody:        { flex: 1 },
  taskName:        { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  taskDesc:        { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  moveButtons:     { flexDirection: 'column', gap: 2 },
  moveArrow:       { fontSize: 12, color: '#9ca3af', padding: 2 },
  moveArrowDisabled: { opacity: 0.2 },
  taskActions:     { flexDirection: 'row', gap: 2 },
  iconBtn:         { padding: 4 },
});
