import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, Keyboard 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { saveFastingState, getFastingState, saveFastingLog, getFastingHistory, deleteFastingLog } from '../services/db';

export default function FastingScreen() {
  const [isFasting, setIsFasting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [goalHours, setGoalHours] = useState(16); 
  const [elapsed, setElapsed] = useState(0);
  const [fastingHistory, setFastingHistory] = useState([]);
  
  // Estados do Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState('start'); 
  
  // --- INPUTS MANUAIS ---
  const [dayInput, setDayInput] = useState('');
  const [monthInput, setMonthInput] = useState('');
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');

  // Refs para pular de um campo pro outro automaticamente
  const refMonth = useRef(null);
  const refHour = useRef(null);
  const refMinute = useRef(null);

  useEffect(() => {
    let interval;
    if (isFasting && startTime) {
      const tick = () => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - startTime) / 1000);
        setElapsed(diffInSeconds);
      };
      tick();
      interval = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isFasting, startTime]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    getFastingState((data) => {
      if (data && data.isFasting) {
        setStartTime(data.startTime);
        setGoalHours(data.goalHours);
        setIsFasting(true);
      }
    });
    getFastingHistory(setFastingHistory);
  };

  // --- PREENCHER O MODAL COM A DATA ATUAL/INICIAL ---
  const prepareModal = (mode) => {
    setEditMode(mode);
    
    let baseDate = new Date(); // Padrão: Agora
    
    // Se for editar o início e ele já existir, usa ele
    if (mode === 'start' && startTime) {
      baseDate = new Date(startTime);
    }

    // Preenche os inputs com dois dígitos (ex: 05)
    setDayInput(String(baseDate.getDate()).padStart(2, '0'));
    setMonthInput(String(baseDate.getMonth() + 1).padStart(2, '0'));
    setHourInput(String(baseDate.getHours()).padStart(2, '0'));
    setMinuteInput(String(baseDate.getMinutes()).padStart(2, '0'));
    
    setModalVisible(true);
  };

  // --- SALVAR COM DATA MANUAL ---
  const handleSaveManual = () => {
    // Validação Simples
    const d = parseInt(dayInput);
    const m = parseInt(monthInput);
    const h = parseInt(hourInput);
    const min = parseInt(minuteInput);

    if (!d || !m || isNaN(h) || isNaN(min) || d > 31 || m > 12 || h > 23 || min > 59) {
      Alert.alert("Data Inválida", "Verifique os valores digitados.");
      return;
    }

    // Cria a data
    const currentYear = new Date().getFullYear();
    const chosenDate = new Date(currentYear, m - 1, d, h, min);
    const chosenTime = chosenDate.getTime();
    const now = Date.now();

    if (editMode === 'start') {
      if (chosenTime > now) {
        // Se a data for no futuro (ex: digitou dia 30 mas é dia 27), pode ser erro de ano ou mês
        // Mas vamos bloquear futuro por segurança
        Alert.alert("Erro", "Não dá para iniciar no futuro.");
        return;
      }
      setStartTime(chosenTime);
      setIsFasting(true);
      saveFastingState(chosenTime, goalHours, true);
      setModalVisible(false);
      Alert.alert("Sucesso", "Horário de início atualizado!");
    } 
    else if (editMode === 'end') {
      if (chosenTime < startTime) return Alert.alert("Erro", "Término antes do início.");
      if (chosenTime > now + 60000) return Alert.alert("Erro", "Não dá para encerrar no futuro.");

      const totalSeconds = Math.floor((chosenTime - startTime) / 1000);
      finishFasting(startTime, chosenTime, totalSeconds);
      setModalVisible(false);
    }
    Keyboard.dismiss();
  };

  const startNow = () => {
    const now = Date.now();
    setStartTime(now);
    setIsFasting(true);
    saveFastingState(now, goalHours, true);
  };

  const stopNow = () => {
    Alert.alert("Encerrar", "Encerrar jejum agora?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sim", onPress: () => {
          const now = Date.now();
          const totalSeconds = Math.floor((now - startTime) / 1000);
          finishFasting(startTime, now, totalSeconds);
      }}
    ]);
  };

  const finishFasting = async (start, end, durationSec) => {
    setIsFasting(false);
    setStartTime(null);
    saveFastingState(null, goalHours, false);
    
    await saveFastingLog(start, end, durationSec, goalHours);
    getFastingHistory(setFastingHistory);

    const h = Math.floor(durationSec / 3600);
    const m = Math.floor((durationSec % 3600) / 60);
    Alert.alert("Parabéns!", `Jejum de ${h}h e ${m}m finalizado.`);
  };

  const deleteLog = (id) => {
    Alert.alert("Apagar", "Remover este registro?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", onPress: () => deleteFastingLog(id, setFastingHistory) }
    ]);
  };

  // Helpers
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const formatDatePretty = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const formatTimePretty = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };
  const getEndTime = () => {
    if (!startTime) return "--:--";
    const end = new Date(startTime + (goalHours * 60 * 60 * 1000));
    return end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const goalSeconds = goalHours * 3600;
  const progress = Math.min((elapsed / goalSeconds) * 100, 100);
  const isGoalReached = elapsed >= goalSeconds;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.title}>Jejum Intermitente</Text>
        <Text style={styles.subtitle}>{isFasting ? "Jejum em andamento" : "Pronto para começar?"}</Text>
      </View>

      <View style={styles.timerCard}>
        <View style={styles.circleContainer}>
          <LinearGradient colors={isGoalReached ? ['#22c55e', '#16a34a'] : ['#f59e0b', '#d97706']} style={styles.timerCircle}>
            <View style={styles.innerCircle}>
              <Feather name={isFasting ? "clock" : "coffee"} size={32} color="#333" style={{marginBottom: 5}} />
              {isFasting ? (
                <><Text style={styles.timerText}>{formatTime(elapsed)}</Text><Text style={styles.timerLabel}>Tempo Decorrido</Text></>
              ) : (
                <Text style={styles.offText}>OFF</Text>
              )}
            </View>
          </LinearGradient>
        </View>

        {isFasting && (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Início</Text>
                <Text style={styles.infoValue}>{new Date(startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                <TouchableOpacity onPress={() => prepareModal('start')}><Text style={styles.editLink}>Editar</Text></TouchableOpacity>
              </View>
              <View style={styles.infoItem}><Text style={styles.infoLabel}>Meta</Text><Text style={styles.infoValue}>{getEndTime()}</Text></View>
              <View style={styles.infoItem}><Text style={styles.infoLabel}>Objetivo</Text><Text style={styles.infoValue}>{goalHours}h</Text></View>
            </View>
            <View style={styles.progressContainer}><View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: isGoalReached ? '#22c55e' : '#f59e0b' }]} /></View>
            <Text style={styles.progressText}>{progress.toFixed(1)}% da meta</Text>
          </>
        )}
      </View>

      {!isFasting ? (
        <View style={styles.controls}>
          <Text style={styles.label}>Escolha sua meta:</Text>
          <View style={styles.goalsGrid}>
            {[12, 14, 16, 18, 24].map((h) => (
              <TouchableOpacity key={h} style={[styles.goalBtn, goalHours === h && styles.goalBtnActive]} onPress={() => setGoalHours(h)}>
                <Text style={[styles.goalText, goalHours === h && styles.goalTextActive]}>{h}h</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startNow}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.gradientBtn}><Text style={styles.startText}>INICIAR AGORA</Text></LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualStartBtn} onPress={() => prepareModal('start')}><Text style={styles.manualStartText}>Esqueci de iniciar (Manual)</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.stopBtn} onPress={stopNow}><Text style={styles.stopText}>Encerrar Agora</Text></TouchableOpacity>
          <TouchableOpacity style={styles.manualStopBtn} onPress={() => prepareModal('end')}><Text style={styles.manualStopText}>Já encerrei antes (Manual)</Text></TouchableOpacity>
        </View>
      )}

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Seus Últimos Jejuns</Text>
        {fastingHistory.length === 0 ? (
          <Text style={styles.emptyHistory}>Nenhum jejum finalizado.</Text>
        ) : (
          fastingHistory.map((log) => (
            <View key={log.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyDate}>{formatDatePretty(new Date(log.endTime))}</Text>
                <Text style={styles.historyDuration}>{formatDuration(log.durationSeconds)}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyTimes}>{formatTimePretty(new Date(log.startTime))} - {formatTimePretty(new Date(log.endTime))}</Text>
                <View style={[styles.badge, { backgroundColor: log.durationSeconds >= log.goalHours * 3600 ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={[styles.badgeText, { color: log.durationSeconds >= log.goalHours * 3600 ? '#16a34a' : '#ef4444' }]}>
                    {log.durationSeconds >= log.goalHours * 3600 ? 'Meta Batida' : 'Incompleto'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteLog(log.id)} style={{padding: 5}}><Feather name="trash-2" size={18} color="#9ca3af" /></TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* --- MODAL MANUAL SIMPLIFICADO (SEM RELÓGIO BUGADO) --- */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editMode === 'start' ? "Definir Início" : "Definir Término"}</Text>
            
            <Text style={styles.manualLabel}>Data (Dia / Mês)</Text>
            <View style={styles.manualRow}>
              <TextInput style={styles.manualInput} keyboardType="numeric" maxLength={2} value={dayInput} onChangeText={(t)=>{setDayInput(t); if(t.length==2) refMonth.current.focus()}} placeholder="DD" />
              <Text style={styles.manualSep}>/</Text>
              <TextInput ref={refMonth} style={styles.manualInput} keyboardType="numeric" maxLength={2} value={monthInput} onChangeText={(t)=>{setMonthInput(t); if(t.length==2) refHour.current.focus()}} placeholder="MM" />
            </View>

            <Text style={styles.manualLabel}>Horário (Hora : Minuto)</Text>
            <View style={styles.manualRow}>
              <TextInput ref={refHour} style={styles.manualInput} keyboardType="numeric" maxLength={2} value={hourInput} onChangeText={(t)=>{setHourInput(t); if(t.length==2) refMinute.current.focus()}} placeholder="HH" />
              <Text style={styles.manualSep}>:</Text>
              <TextInput ref={refMinute} style={styles.manualInput} keyboardType="numeric" maxLength={2} value={minuteInput} onChangeText={setMinuteInput} placeholder="MM" />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}><Text style={styles.btnCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSaveManual} style={styles.btnSave}><Text style={styles.btnSaveText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.tipsCard}><Text style={styles.tipsTitle}>💡 Dica</Text><Text style={styles.tipsText}>Beba muita água durante o jejum.</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  timerCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 4, alignItems: 'center', marginBottom: 20 },
  circleContainer: { marginBottom: 20 },
  timerCircle: { width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center', padding: 8 },
  innerCircle: { width: '100%', height: '100%', borderRadius: 100, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 12, color: '#9ca3af', textTransform: 'uppercase' },
  offText: { fontSize: 24, fontWeight: 'bold', color: '#ccc' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 15 },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#9ca3af' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  editLink: { color: '#d97706', fontSize: 12, textDecorationLine: 'underline', marginTop: 2 },
  progressContainer: { width: '100%', height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden', marginBottom: 5 },
  progressBar: { height: '100%' },
  progressText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  controls: { width: '100%' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
  goalsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  goalBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
  goalBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  goalText: { fontWeight: 'bold', color: '#666' },
  goalTextActive: { color: '#fff' },
  startBtn: { width: '100%', borderRadius: 12, overflow: 'hidden', elevation: 3, marginBottom: 10 },
  gradientBtn: { padding: 16, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  manualStartBtn: { alignItems: 'center', padding: 10 },
  manualStartText: { color: '#d97706', fontWeight: '600' },
  stopBtn: { width: '100%', padding: 16, backgroundColor: '#fee2e2', borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  stopText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  manualStopBtn: { alignItems: 'center', padding: 10 },
  manualStopText: { color: '#ef4444', fontWeight: '600' },
  tipsCard: { marginTop: 10, padding: 15, backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#dbeafe', marginBottom: 20 },
  tipsTitle: { fontWeight: 'bold', color: '#1e40af', marginBottom: 5 },
  tipsText: { color: '#1e3a8a', fontSize: 13, lineHeight: 18 },
  
  // MODAL MANUAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  manualLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5, width: '100%' },
  manualRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  manualInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, fontSize: 20, width: 60, textAlign: 'center', backgroundColor: '#f9f9f9' },
  manualSep: { fontSize: 20, fontWeight: 'bold', color: '#555' },

  modalButtons: { flexDirection: 'row', width: '100%', gap: 10, marginTop: 10 },
  btnCancel: { flex: 1, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: 'bold' },
  btnSave: { flex: 1, padding: 12, backgroundColor: '#f59e0b', borderRadius: 10, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },

  // HISTÓRICO
  historySection: { marginTop: 10, paddingBottom: 30 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptyHistory: { color: '#999', textAlign: 'center', fontStyle: 'italic' },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 8, elevation: 2 },
  historyLeft: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  historyDuration: { fontSize: 18, fontWeight: 'bold', color: '#d97706' },
  historyRight: { alignItems: 'flex-end', marginRight: 10 },
  historyTimes: { fontSize: 12, color: '#888', marginBottom: 4 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' }
});