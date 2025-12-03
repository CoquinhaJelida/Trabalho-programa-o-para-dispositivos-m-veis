import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveFastingState, getFastingState, saveFastingLog, getFastingHistory, deleteFastingLog, addXP } from '../services/db';

const FASTING_STAGES = [
  { hours: 0, title: "Digestão", desc: "Níveis de insulina subindo.", icon: "coffee", color: ["#9ca3af", "#6b7280"] },
  { hours: 4, title: "Queda de Insulina", desc: "O açúcar no sangue cai.", icon: "trending-down", color: ["#fbbf24", "#d97706"] },
  { hours: 8, title: "Início da Queima", desc: "Uso de glicose do fígado.", icon: "activity", color: ["#f87171", "#dc2626"] },
  { hours: 12, title: "Queima de Gordura 🔥", desc: "Estado de CETOSE leve.", icon: "flame", color: ["#c084fc", "#9333ea"] },
  { hours: 16, title: "Autofagia ♻️", desc: "Limpeza celular profunda.", icon: "refresh-cw", color: ["#4ade80", "#16a34a"] },
  { hours: 24, title: "Pico de GH", desc: "Hormônio do crescimento dispara.", icon: "zap", color: ["#38bdf8", "#0284c7"] }
];

export default function FastingScreen({ onGainXP }) {
  const [isFasting, setIsFasting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [goalHours, setGoalHours] = useState(16); 
  const [elapsed, setElapsed] = useState(0);
  const [fastingHistory, setFastingHistory] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState('start'); 
  const [stagesModalVisible, setStagesModalVisible] = useState(false);

  const [tempDate, setTempDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [currentStage, setCurrentStage] = useState(FASTING_STAGES[0]);

  useEffect(() => {
    let interval;
    if (isFasting && startTime) {
      const tick = () => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - startTime) / 1000);
        setElapsed(diffInSeconds);
        const hoursElapsed = diffInSeconds / 3600;
        const stage = [...FASTING_STAGES].reverse().find(s => hoursElapsed >= s.hours) || FASTING_STAGES[0];
        setCurrentStage(stage);
      };
      tick();
      interval = setInterval(tick, 1000);
    } else {
      setElapsed(0);
      setCurrentStage(FASTING_STAGES[0]);
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

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      const currentDate = new Date(tempDate);
      if (pickerMode === 'date') currentDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      else currentDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setTempDate(currentDate);
    }
  };

  const showPickerMode = (mode) => { setPickerMode(mode); setShowPicker(true); };

  const handleSaveManual = () => {
    const chosenTime = tempDate.getTime();
    const now = Date.now();
    if (editMode === 'start') {
      if (chosenTime > now) { Alert.alert("Erro", "Futuro não permitido."); return; }
      setStartTime(chosenTime); setIsFasting(true);
      saveFastingState(chosenTime, goalHours, true);
      setModalVisible(false);
      Alert.alert("Sucesso", "Jejum ajustado!");
    } else if (editMode === 'end') {
      if (chosenTime < startTime) return Alert.alert("Erro", "Término antes do início.");
      const totalSeconds = Math.floor((chosenTime - startTime) / 1000);
      finishFasting(startTime, chosenTime, totalSeconds);
      setModalVisible(false);
    }
  };

  const startNow = () => { const now = Date.now(); setStartTime(now); setIsFasting(true); saveFastingState(now, goalHours, true); };
  const stopNow = () => { Alert.alert("Encerrar", "Encerrar jejum?", [{ text: "Cancelar", style: "cancel" }, { text: "Sim", onPress: () => { const now = Date.now(); const totalSeconds = Math.floor((now - startTime) / 1000); finishFasting(startTime, now, totalSeconds); } }]); };

  const finishFasting = async (start, end, durationSec) => {
    setIsFasting(false); setStartTime(null); saveFastingState(null, goalHours, false);
    await saveFastingLog(start, end, durationSec, goalHours);
    getFastingHistory(setFastingHistory);
    const h = Math.floor(durationSec / 3600); const m = Math.floor((durationSec % 3600) / 60);
    
    // --- XP ---
    addXP(50, (newStats, leveledUp) => {
       if(onGainXP) onGainXP(50, "Jejum Finalizado");
       Alert.alert("Jejum Finalizado", `Você completou ${h}h e ${m}m! ${leveledUp ? '\n\nSUBIU DE NÍVEL! 🎉' : ''}`);
    });
  };

  const deleteLog = (id) => { Alert.alert("Apagar", "Remover?", [{ text: "Não", style: "cancel" }, { text: "Sim", onPress: () => deleteFastingLog(id, setFastingHistory) }]); };

  const formatTime = (s) => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sc = s%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`; };
  const formatDatePretty = (d) => d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
  const formatTimePretty = (d) => d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  const formatDuration = (s) => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return `${h}h ${m}m`; };
  const getEndTime = () => { if (!startTime) return "--:--"; const end = new Date(startTime+(goalHours*3600000)); return end.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}); };
  const openStartModal = () => { setEditMode('start'); setTempDate(startTime ? new Date(startTime) : new Date()); setModalVisible(true); };
  const openEndModal = () => { setEditMode('end'); setTempDate(new Date()); setModalVisible(true); };
  
  const goalSeconds = goalHours*3600; const progress = Math.min((elapsed/goalSeconds)*100, 100); const isGoalReached = elapsed >= goalSeconds;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Jejum Intermitente</Text><Text style={styles.subtitle}>{isFasting ? "Jejum em andamento" : "Pronto para começar?"}</Text></View>
      
      <View style={styles.timerCard}>
        <View style={styles.circleContainer}>
          <LinearGradient colors={isGoalReached ? ['#22c55e', '#16a34a'] : ['#f59e0b', '#d97706']} style={styles.timerCircle}>
            <View style={styles.innerCircle}>
              <Feather name={isFasting ? "clock" : "coffee"} size={32} color="#333" style={{marginBottom: 5}} />
              {isFasting ? <><Text style={styles.timerText}>{formatTime(elapsed)}</Text><Text style={styles.timerLabel}>Tempo Decorrido</Text></> : <Text style={styles.offText}>OFF</Text>}
            </View>
          </LinearGradient>
        </View>
        {isFasting && (
          <>
            <TouchableOpacity onPress={() => setStagesModalVisible(true)}>
              <LinearGradient colors={currentStage.color} style={styles.stageCard}>
                <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                  <View style={{flexDirection:'row', alignItems:'center'}}><Feather name={currentStage.icon} size={20} color="#fff" style={{marginRight:8}} /><Text style={styles.stageTitle}>{currentStage.title}</Text></View>
                  <Feather name="info" size={16} color="rgba(255,255,255,0.8)" />
                </View>
                <Text style={styles.stageDesc}>{currentStage.desc}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.infoRow}><View style={styles.infoItem}><Text style={styles.infoLabel}>Início</Text><Text style={styles.infoValue}>{new Date(startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text><TouchableOpacity onPress={openStartModal}><Text style={styles.editLink}>Editar</Text></TouchableOpacity></View><View style={styles.infoItem}><Text style={styles.infoLabel}>Meta</Text><Text style={styles.infoValue}>{getEndTime()}</Text></View><View style={styles.infoItem}><Text style={styles.infoLabel}>Objetivo</Text><Text style={styles.infoValue}>{goalHours}h</Text></View></View>
            <View style={styles.progressContainer}><View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: isGoalReached ? '#22c55e' : '#f59e0b' }]} /></View>
            <Text style={styles.progressText}>{progress.toFixed(1)}% da meta</Text>
          </>
        )}
      </View>

      {!isFasting && (
         <TouchableOpacity style={styles.seeStagesBtn} onPress={() => setStagesModalVisible(true)}><Feather name="book-open" size={16} color="#4b5563" /><Text style={styles.seeStagesText}>Entenda as Fases do Jejum</Text></TouchableOpacity>
      )}

      {!isFasting ? (
        <View style={styles.controls}>
          <Text style={styles.label}>Escolha sua meta:</Text>
          <View style={styles.goalsGrid}>{[12, 14, 16, 18, 24].map((h) => (<TouchableOpacity key={h} style={[styles.goalBtn, goalHours === h && styles.goalBtnActive]} onPress={() => setGoalHours(h)}><Text style={[styles.goalText, goalHours === h && styles.goalTextActive]}>{h}h</Text></TouchableOpacity>))}</View>
          <TouchableOpacity style={styles.startBtn} onPress={startNow}><LinearGradient colors={['#f59e0b', '#d97706']} style={styles.gradientBtn}><Text style={styles.startText}>INICIAR AGORA</Text></LinearGradient></TouchableOpacity>
          <TouchableOpacity style={styles.manualStartBtn} onPress={openStartModal}><Text style={styles.manualStartText}>Esqueci de iniciar (Inserir Data/Hora)</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.stopBtn} onPress={stopNow}><Text style={styles.stopText}>Encerrar Agora</Text></TouchableOpacity>
          <TouchableOpacity style={styles.manualStopBtn} onPress={openEndModal}><Text style={styles.manualStopText}>Já encerrei antes (Inserir Data/Hora)</Text></TouchableOpacity>
        </View>
      )}

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Seus Últimos Jejuns</Text>
        {fastingHistory.length === 0 ? <Text style={styles.emptyHistory}>Nenhum jejum finalizado.</Text> : fastingHistory.map((log) => (
          <View key={log.id} style={styles.historyItem}>
            <View style={styles.historyLeft}><Text style={styles.historyDate}>{formatDatePretty(new Date(log.endTime))}</Text><Text style={styles.historyDuration}>{formatDuration(log.durationSeconds)}</Text></View>
            <View style={styles.historyRight}><Text style={styles.historyTimes}>{formatTimePretty(new Date(log.startTime))} - {formatTimePretty(new Date(log.endTime))}</Text><View style={[styles.badge, { backgroundColor: log.durationSeconds >= log.goalHours * 3600 ? '#dcfce7' : '#fee2e2' }]}><Text style={[styles.badgeText, { color: log.durationSeconds >= log.goalHours * 3600 ? '#16a34a' : '#ef4444' }]}>{log.durationSeconds >= log.goalHours * 3600 ? 'Meta Batida' : 'Incompleto'}</Text></View></View>
            <TouchableOpacity onPress={() => deleteLog(log.id)} style={{padding: 5}}><Feather name="trash-2" size={18} color="#9ca3af" /></TouchableOpacity>
          </View>
        ))}
      </View>

      <Modal visible={stagesModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.stagesContent}>
            <View style={styles.stagesHeader}><Text style={styles.stagesTitle}>Ciclo Biológico do Jejum</Text><TouchableOpacity onPress={() => setStagesModalVisible(false)}><Feather name="x" size={24} color="#333" /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {FASTING_STAGES.map((stage, index) => (
                <View key={index} style={styles.stageRow}>
                  <View style={styles.stageLeft}><Text style={styles.stageHour}>{stage.hours}h</Text><View style={styles.stageLine} /></View>
                  <View style={[styles.stageDetail, {borderLeftColor: stage.color[1]}]}>
                    <View style={styles.stageDetailHeader}><Feather name={stage.icon} size={18} color={stage.color[1]} /><Text style={[styles.stageDetailTitle, {color: stage.color[1]}]}>{stage.title}</Text></View>
                    <Text style={styles.stageDetailDesc}>{stage.desc}</Text>
                  </View>
                </View>
              ))}
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editMode === 'start' ? "Ajustar Início" : "Ajustar Término"}</Text>
            <Text style={styles.modalLabel}>1. Dia:</Text><TouchableOpacity style={styles.pickerButton} onPress={() => showPickerMode('date')}><Feather name="calendar" size={20} color="#555" /><Text style={styles.pickerButtonText}>{formatDatePretty(tempDate)}</Text></TouchableOpacity>
            <Text style={styles.modalLabel}>2. Hora:</Text><TouchableOpacity style={styles.pickerButton} onPress={() => showPickerMode('time')}><Feather name="clock" size={20} color="#555" /><Text style={styles.pickerButtonText}>{formatTimePretty(tempDate)}</Text></TouchableOpacity>
            {showPicker && <DateTimePicker value={tempDate} mode={pickerMode} is24Hour={true} display="default" onChange={handleDateChange} />}
            <View style={styles.modalButtons}><TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}><Text style={styles.btnCancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity onPress={handleSaveManual} style={styles.btnSave}><Text style={styles.btnSaveText}>Salvar</Text></TouchableOpacity></View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  timerCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 4, alignItems: 'center', marginBottom: 20 },
  stageCard: { width: '100%', borderRadius: 12, padding: 15, marginBottom: 20, elevation: 2 },
  stageTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  stageDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  seeStagesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, marginBottom: 20, backgroundColor: '#f3f4f6', borderRadius: 10 },
  seeStagesText: { marginLeft: 8, color: '#4b5563', fontWeight: '600' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  modalLabel: { alignSelf: 'flex-start', color: '#666', marginBottom: 5, fontWeight: '600' },
  pickerButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#f9f9f9', width: '100%', marginBottom: 15 },
  pickerButtonText: { marginLeft: 10, fontSize: 16, fontWeight: 'bold', color: '#333' },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 10, marginTop: 10 },
  btnCancel: { flex: 1, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: 'bold' },
  btnSave: { flex: 1, padding: 12, backgroundColor: '#f59e0b', borderRadius: 10, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
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
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  stagesContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', height: '70%' },
  stagesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  stagesTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  stageRow: { flexDirection: 'row', marginBottom: 0 },
  stageLeft: { alignItems: 'center', marginRight: 15, width: 30 },
  stageHour: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  stageLine: { flex: 1, width: 2, backgroundColor: '#e5e7eb', marginBottom: 5 },
  stageDetail: { flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, borderLeftWidth: 4, marginBottom: 15 },
  stageDetailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  stageDetailTitle: { fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
  stageDetailDesc: { color: '#666', fontSize: 12, lineHeight: 16 },
});