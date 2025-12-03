import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getProfile, getDayLog, getTodayKey, getFastingState, getHistory, getFastingHistory, getUserStats } from '../services/db';

export default function HomeScreen({ changeTab, theme }) {
  const [name, setName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('day');

  // Estado de RPG
  const [userStats, setUserStats] = useState({ level: 1, currentXP: 0, nextLevelXP: 100 });

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
      getUserStats(setUserStats);

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
      const filteredFasts = fastingHistoryArray.filter(log => { if (!log.endTime) return false; return new Date(log.endTime) >= limitDate; });
      const totalFastingSeconds = filteredFasts.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
      const totalFastingHours = Math.floor(totalFastingSeconds / 3600);
      const avgFastingSeconds = filteredFasts.length > 0 ? totalFastingSeconds / filteredFasts.length : 0;
      const avgFastingH = Math.floor(avgFastingSeconds / 3600);

      const divisor = daysWithData > 0 ? daysWithData : 1;

      setStats({
        calories: Math.round(totalCals / divisor),
        water: Math.round(totalWater / divisor),
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
  const xpPercent = userStats.nextLevelXP > 0 ? Math.min((userStats.currentXP / userStats.nextLevelXP) * 100, 100) : 0;

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAllData} tintColor={theme.text} />}
    >
      
      <View style={styles.header}>
        <View>
          {/* CORRIGIDO AQUI: COR DINÂMICA */}
          <Text style={[styles.greeting, { color: theme.text }]}>Olá, {name}</Text>
          <Text style={[styles.subGreeting, { color: theme.textSub }]}>Resumo de Saúde</Text>
        </View>
        
        <View style={[styles.levelContainer, {backgroundColor: theme.card}]}>
           <View style={styles.xpBarBg}>
             <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={[styles.xpBarFill, {width: `${xpPercent}%`}]} />
           </View>
           <Text style={[styles.xpText, {color: theme.textSub}]}>LVL {userStats.level}</Text>
        </View>
      </View>

      <View style={[styles.goalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.goalHeader}>
          <Text style={[styles.goalTitle, { color: theme.text }]}>Consumo ({timeRange === 'day' ? 'Hoje' : 'Média'})</Text>
          <Text style={[styles.goalValues, { color: theme.primary }]}>
            {Math.round(stats.calories)} <Text style={{fontSize: 14, color: theme.textSub}}>/ {Math.round(goals.calories)} kcal</Text>
          </Text>
        </View>
        <View style={[styles.progressBarBackground, { backgroundColor: theme.inputBg }]}>
          <LinearGradient
            colors={stats.calories > goals.calories ? ['#ef4444', '#b91c1c'] : ['#22c55e', '#16a34a']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${calPercent}%` }]}
          />
        </View>
      </View>

      <View style={[styles.rangeSelector, { backgroundColor: theme.inputBg }]}>
        {['day', 'week', 'month'].map(r => (
          <TouchableOpacity 
            key={r}
            onPress={() => { setTimeRange(r); loadAllData(); }} 
            style={[styles.rangeBtn, timeRange === r && { backgroundColor: theme.card, elevation: 2 }]}
          >
            <Text style={[styles.rangeText, { color: timeRange === r ? theme.text : theme.textSub }]}>
              {r === 'day' ? 'Hoje' : r === 'week' ? '7 Dias' : '30 Dias'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.rangeLabel, { color: theme.textSub }]}>{stats.label}</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={[styles.widgetLarge, {backgroundColor: theme.card}]} onPress={() => changeTab('fasting')}>
          <LinearGradient colors={isFasting && timeRange === 'day' ? ['#f59e0b', '#d97706'] : [theme.card, theme.card]} style={styles.gradientBg}>
            <View style={styles.widgetHeader}>
              <Feather name="clock" size={20} color={isFasting && timeRange === 'day' ? "#fff" : theme.textSub} />
              <Text style={[styles.widgetTitle, { color: isFasting && timeRange === 'day' ? '#fff' : theme.textSub }]}>
                {timeRange === 'day' ? "JEJUM ATUAL" : "JEJUM TOTAL"}
              </Text>
            </View>
            <Text style={[styles.widgetValueLarge, { color: isFasting && timeRange === 'day' ? '#fff' : theme.text }]}>{stats.fasting}</Text>
            <Text style={[styles.widgetSub, { color: isFasting && timeRange === 'day' ? '#fde68a' : theme.textSub }]}>
              {timeRange === 'day' ? (isFasting ? "Em andamento" : "Toque para iniciar") : `Média de ${stats.fastingAvg} por jejum`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={[styles.widgetSmall, { backgroundColor: theme.card }]} onPress={() => changeTab('meals')}>
            <View style={styles.widgetHeader}><Feather name="zap" size={18} color={theme.primary} /><Text style={[styles.widgetTitleDark, {color: theme.textSub}]}>KCAL</Text></View>
            <Text style={[styles.widgetValue, {color: theme.text}]}>{stats.calories}</Text>
            <Text style={[styles.widgetSubDark, {color: theme.textSub}]}>{timeRange === 'day' ? `de ${Math.round(goals.calories)}` : "Média"}</Text>
            <View style={[styles.miniProgressBg, {backgroundColor: theme.inputBg}]}><View style={[styles.miniProgressFill, {width: `${calPercent}%`, backgroundColor: theme.primary}]} /></View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.widgetSmall, { backgroundColor: theme.card }]} onPress={() => changeTab('water')}>
            <View style={styles.widgetHeader}><Feather name="droplet" size={18} color="#2563eb" /><Text style={[styles.widgetTitleDark, {color: theme.textSub}]}>ÁGUA</Text></View>
            <Text style={[styles.widgetValue, {color: theme.text}]}>{stats.water}</Text>
            <Text style={[styles.widgetSubDark, {color: theme.textSub}]}>{timeRange === 'day' ? `de ${Math.round(goals.water)}ml` : "Média"}</Text>
            <View style={[styles.miniProgressBg, {backgroundColor: theme.inputBg}]}><View style={[styles.miniProgressFill, {width: `${waterPercent}%`, backgroundColor: '#2563eb'}]} /></View>
          </TouchableOpacity>
        </View>

        {timeRange === 'day' && (
          <>
            <Text style={[styles.sectionTitle, {color: theme.text}]}>Acesso Rápido</Text>
            <View style={styles.shortcuts}>
              <TouchableOpacity style={styles.shortcutBtn} onPress={() => changeTab('meals')}>
                <View style={[styles.iconBox, {backgroundColor: theme.primary + '20'}]}><Feather name="plus" size={24} color={theme.primary} /></View>
                <Text style={[styles.shortcutText, {color: theme.textSub}]}>Refeição</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutBtn} onPress={() => changeTab('water')}>
                <View style={[styles.iconBox, {backgroundColor: '#dbeafe'}]}><Feather name="plus" size={24} color="#2563eb" /></View>
                <Text style={[styles.shortcutText, {color: theme.textSub}]}>Água</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutBtn} onPress={() => changeTab('gallery')}>
                <View style={[styles.iconBox, {backgroundColor: '#ede9fe'}]}><Feather name="camera" size={24} color="#7c3aed" /></View>
                <Text style={[styles.shortcutText, {color: theme.textSub}]}>Foto</Text>
              </TouchableOpacity>
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
  greeting: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subGreeting: { fontSize: 14 },
  
  levelContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 12, gap: 8 },
  xpBarBg: { width: 60, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%' },
  xpText: { fontSize: 10, fontWeight: 'bold' },

  goalCard: { padding: 15, borderRadius: 16, elevation: 3, marginBottom: 15, borderWidth: 1 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  goalTitle: { fontSize: 14, fontWeight: 'bold' },
  goalValues: { fontSize: 18, fontWeight: 'bold' },
  progressBarBackground: { height: 10, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },

  rangeSelector: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 15 },
  rangeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  rangeText: { fontSize: 12, fontWeight: '600' },
  rangeLabel: { textAlign: 'center', fontSize: 10, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },

  grid: { gap: 15 },
  widgetLarge: { height: 120, borderRadius: 20, overflow: 'hidden', elevation: 3 },
  gradientBg: { flex: 1, padding: 15, justifyContent: 'center' },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  widgetTitle: { fontWeight: 'bold', fontSize: 12 },
  widgetTitleDark: { fontWeight: 'bold', fontSize: 12 },
  widgetValueLarge: { fontSize: 32, fontWeight: 'bold' },
  widgetValue: { fontSize: 24, fontWeight: 'bold' },
  widgetSub: { fontSize: 12 },
  widgetSubDark: { fontSize: 12, marginBottom: 8 },
  
  row: { flexDirection: 'row', gap: 15 },
  widgetSmall: { flex: 1, padding: 15, borderRadius: 20, elevation: 2, height: 130, justifyContent: 'center' },
  miniProgressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  shortcuts: { flexDirection: 'row', justifyContent: 'space-between' },
  shortcutBtn: { alignItems: 'center', width: '30%' },
  iconBox: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  shortcutText: { fontSize: 12, fontWeight: '600' },
});