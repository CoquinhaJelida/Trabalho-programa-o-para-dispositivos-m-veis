import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getProfile, getDayLog, getTodayKey, getFastingState, getHistory, getFastingHistory } from '../services/db';

export default function HomeScreen({ changeTab }) {
  const [name, setName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('day');

  const [stats, setStats] = useState({ calories: 0, water: 0, fasting: '0h', fastingAvg: '0h', label: 'Total de Hoje' });
  const [goals, setGoals] = useState({ calories: 2000, water: 2500 });

  const [isFasting, setIsFasting] = useState(false);
  const [fastingStart, setFastingStart] = useState(null);
  const [fastingElapsed, setFastingElapsed] = useState('00:00:00');

  useEffect(() => {
    loadAllData();
    
    const interval = setInterval(() => {
      if (isFasting && fastingStart) {
        const now = Date.now();
        const totalSeconds = Math.floor((now - fastingStart) / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        setFastingElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFasting, fastingStart, timeRange]);

  const loadAllData = async () => {
    if (refreshing) return; 
    setRefreshing(true);
    
    try {
      await new Promise(resolve => {
        getProfile((data) => {
          if (data) {
            setName(data.name || 'Usuário');
            setGoals({ calories: parseFloat(data.calorieGoal) || 2000, water: data.weight ? parseFloat(data.weight) * 35 : 2500 });
          }
          resolve();
        });
      });

      await new Promise(resolve => {
        getFastingState((data) => {
          if (data && data.isFasting) { setIsFasting(true); setFastingStart(data.startTime); } 
          else { setIsFasting(false); setFastingElapsed('--:--:--'); }
          resolve();
        });
      });

      const [dailyLog, fastingLog] = await Promise.all([
        new Promise(resolve => getHistory(resolve)),
        new Promise(resolve => getFastingHistory(resolve))
      ]);

      calculateStats(dailyLog || {}, fastingLog || []);

    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateStats = (dailyHistory, fastingHistoryArray) => {
    const todayKey = getTodayKey();
    
    if (timeRange === 'day') {
      const todayData = dailyHistory[todayKey] || { water: 0, totalCalories: 0 };
      setStats({
        calories: Math.round(todayData.totalCalories || 0),
        water: Math.round(todayData.water || 0),
        fasting: isFasting ? fastingElapsed : "Parado",
        label: 'Total de Hoje'
      });
    } else {
      const daysBack = timeRange === 'week' ? 7 : 30;
      const now = new Date();
      let totalCals = 0; let totalWater = 0; let daysWithData = 0;
      
      for (let i = 0; i < daysBack; i++) {
        const d = new Date(); d.setDate(now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (dailyHistory[key]) { 
          totalCals += (dailyHistory[key].totalCalories || 0); 
          totalWater += (dailyHistory[key].water || 0); 
          daysWithData++; 
        }
      }
      
      const limitDate = new Date(); limitDate.setDate(now.getDate() - daysBack);
      const filteredFasts = fastingHistoryArray.filter(log => { if (!log.date) return false; return new Date(log.date) >= limitDate; });
      const totalFastingSeconds = filteredFasts.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
      const totalFastingHours = Math.floor(totalFastingSeconds / 3600);
      const avgFastingSeconds = filteredFasts.length > 0 ? totalFastingSeconds / filteredFasts.length : 0;
      const avgFastingH = Math.floor(avgFastingSeconds / 3600);

      setStats({
        calories: daysWithData > 0 ? Math.round(totalCals / daysWithData) : 0,
        water: daysWithData > 0 ? Math.round(totalWater / daysWithData) : 0,
        fasting: `${totalFastingHours}h`,
        fastingAvg: `${avgFastingH}h/dia`,
        label: timeRange === 'week' ? 'Média 7 Dias' : 'Média 30 Dias'
      });
    }
  };

  useEffect(() => {
    if (timeRange === 'day' && isFasting) {
      setStats(prev => ({ ...prev, fasting: fastingElapsed }));
    }
  }, [fastingElapsed, timeRange, isFasting]);

  const calPercent = goals.calories > 0 ? Math.min((stats.calories / goals.calories) * 100, 100) : 0;
  const waterPercent = goals.water > 0 ? Math.min((stats.water / goals.water) * 100, 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAllData} />}>
      {/* HEADER SIMPLES */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {name}</Text>
          <Text style={styles.subGreeting}>Vamos bater a meta hoje?</Text>
        </View>
        <TouchableOpacity onPress={() => changeTab('profile')}>
          <Feather name="settings" size={24} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* --- NOVA POSIÇÃO: BARRA DE CONSUMO DIÁRIO --- */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Consumo ({timeRange === 'day' ? 'Hoje' : 'Média'})</Text>
          <Text style={styles.goalValues}>
            {Math.round(stats.calories)} <Text style={{fontSize: 14, color: '#888'}}>/ {Math.round(goals.calories)} kcal</Text>
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={stats.calories > goals.calories ? ['#ef4444', '#b91c1c'] : ['#22c55e', '#16a34a']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${calPercent}%` }]}
          />
        </View>
      </View>
      {/* --------------------------------------------- */}

      <View style={styles.rangeSelector}>
        <TouchableOpacity onPress={() => { setTimeRange('day'); loadAllData(); }} style={[styles.rangeBtn, timeRange === 'day' && styles.rangeBtnActive]}><Text style={[styles.rangeText, timeRange === 'day' && styles.rangeTextActive]}>Hoje</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { setTimeRange('week'); loadAllData(); }} style={[styles.rangeBtn, timeRange === 'week' && styles.rangeBtnActive]}><Text style={[styles.rangeText, timeRange === 'week' && styles.rangeTextActive]}>7 Dias</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { setTimeRange('month'); loadAllData(); }} style={[styles.rangeBtn, timeRange === 'month' && styles.rangeBtnActive]}><Text style={[styles.rangeText, timeRange === 'month' && styles.rangeTextActive]}>30 Dias</Text></TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.widgetLarge} onPress={() => changeTab('fasting')}>
          <LinearGradient colors={isFasting && timeRange === 'day' ? ['#f59e0b', '#d97706'] : ['#f8fafc', '#e2e8f0']} style={styles.gradientBg}>
            <View style={styles.widgetHeader}>
              <Feather name="clock" size={20} color={isFasting && timeRange === 'day' ? "#fff" : "#666"} />
              <Text style={[styles.widgetTitle, isFasting && timeRange === 'day' ? {color:'#fff'} : {color:'#666'}]}>{timeRange === 'day' ? "JEJUM ATUAL" : "JEJUM TOTAL"}</Text>
            </View>
            <Text style={[styles.widgetValueLarge, isFasting && timeRange === 'day' ? {color:'#fff'} : {color:'#333'}]}>{stats.fasting}</Text>
            <Text style={[styles.widgetSub, isFasting && timeRange === 'day' ? {color:'#fde68a'} : {color:'#888'}]}>{timeRange === 'day' ? (isFasting ? "Em andamento" : "Toque para iniciar") : `Média de ${stats.fastingAvg} por jejum`}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.row}>
          {/* WIDGET DE ÁGUA */}
          <TouchableOpacity style={styles.widgetSmall} onPress={() => changeTab('water')}>
            <View style={styles.widgetHeader}><Feather name="droplet" size={18} color="#2563eb" /><Text style={styles.widgetTitleDark}>ÁGUA</Text></View>
            <Text style={styles.widgetValue}>{stats.water}</Text>
            <Text style={styles.widgetSubDark}>{timeRange === 'day' ? `de ${Math.round(goals.water)}ml` : "Média diária"}</Text>
            <View style={styles.miniProgressBg}><View style={[styles.miniProgressFill, {width: `${waterPercent}%`, backgroundColor: '#2563eb'}]} /></View>
          </TouchableOpacity>

          {/* ATALHO RÁPIDO GALERIA */}
          <TouchableOpacity style={styles.widgetSmall} onPress={() => changeTab('gallery')}>
             <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                <View style={[styles.iconBox, {backgroundColor: '#ede9fe', width: 50, height: 50}]}><Feather name="camera" size={24} color="#7c3aed" /></View>
                <Text style={{marginTop: 5, fontWeight: 'bold', color: '#4b5563'}}>Nova Foto</Text>
             </View>
          </TouchableOpacity>
        </View>

        {timeRange === 'day' && (
          <>
            <Text style={styles.sectionTitle}>Acesso Rápido</Text>
            <View style={styles.shortcuts}>
              <TouchableOpacity style={styles.shortcutBtn} onPress={() => changeTab('meals')}><View style={[styles.iconBox, {backgroundColor: '#dcfce7'}]}><Feather name="plus" size={24} color="#16a34a" /></View><Text style={styles.shortcutText}>Refeição</Text></TouchableOpacity>
              <TouchableOpacity style={styles.shortcutBtn} onPress={() => changeTab('water')}><View style={[styles.iconBox, {backgroundColor: '#dbeafe'}]}><Feather name="plus" size={24} color="#2563eb" /></View><Text style={styles.shortcutText}>Água</Text></TouchableOpacity>
              <TouchableOpacity style={styles.shortcutBtn} onPress={() => changeTab('challenges')}><View style={[styles.iconBox, {backgroundColor: '#fff7ed'}]}><Feather name="award" size={24} color="#d97706" /></View><Text style={styles.shortcutText}>Missões</Text></TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 5 },
  subGreeting: { fontSize: 14, color: '#6b7280' },
  
  // ESTILOS DA BARRA DE CONSUMO (Copiados do Profile)
  goalCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 3, marginBottom: 15, borderWidth: 1, borderColor: '#f0f0f0' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  goalTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  goalValues: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  progressBarBackground: { height: 10, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },

  rangeSelector: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4, marginBottom: 15 },
  rangeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  rangeBtnActive: { backgroundColor: '#fff', elevation: 2 },
  rangeText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  rangeTextActive: { color: '#1f2937', fontWeight: 'bold' },
  rangeLabel: { textAlign: 'center', fontSize: 10, color: '#9ca3af', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { gap: 15 },
  widgetLarge: { height: 120, borderRadius: 20, overflow: 'hidden', elevation: 3, backgroundColor: '#fff' },
  gradientBg: { flex: 1, padding: 15, justifyContent: 'center' },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  widgetTitle: { fontWeight: 'bold', fontSize: 12 },
  widgetTitleDark: { fontWeight: 'bold', fontSize: 12, color: '#666' },
  widgetValueLarge: { fontSize: 32, fontWeight: 'bold' },
  widgetValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  widgetSub: { fontSize: 12 },
  widgetSubDark: { fontSize: 12, color: '#888', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 15 },
  widgetSmall: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 20, elevation: 2, height: 130, justifyContent: 'center' },
  miniProgressBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 10 },
  shortcuts: { flexDirection: 'row', justifyContent: 'space-between' },
  shortcutBtn: { alignItems: 'center', width: '30%' },
  iconBox: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  shortcutText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
});