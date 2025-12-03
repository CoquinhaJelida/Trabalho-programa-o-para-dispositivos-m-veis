import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { saveProfile, getProfile, getHistory, getDayLog, getTodayKey, getCalorieStreak, deleteDailyLog, getChallengeStatus, getUserStats } from '../services/db';
import { QUESTS } from '../data/quests';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [targetWeight, setTargetWeight] = useState(''); 
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState(1.2);
  const [objective, setObjective] = useState('maintain');
  const [macros, setMacros] = useState({ p: 0, c: 0, f: 0 });
  
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [isStrict, setIsStrict] = useState(false); 
  const [calorieStreak, setCalorieStreak] = useState({ status: 'good', count: 0 });
  const [userStats, setUserStats] = useState({ level: 1, currentXP: 0, nextLevelXP: 100 });

  const [todayCalories, setTodayCalories] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [history, setHistory] = useState({});
  const [expandedDate, setExpandedDate] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    getProfile((data) => {
      if (data) {
        setName(data.name || '');
        setAge(data.age || '');
        setWeight(data.weight || '');
        setHeight(data.height || '');
        setCalorieGoal(data.calorieGoal || '2000');
        setIsStrict(data.isStrict || false);
        setTargetWeight(data.targetWeight || '');
        setGender(data.gender || 'male');
        setActivityLevel(data.activityLevel || 1.2);
        setObjective(data.objective || 'maintain');
        calculateMacros(data.calorieGoal || '2000', data.objective || 'maintain');
      }
    });

    getDayLog(getTodayKey(), (data) => {
      const meals = data.meals || [];
      const calculatedTotal = meals.reduce((acc, curr) => acc + Number(curr.calories), 0);
      setTodayCalories(calculatedTotal);
      setTodayWater(data.water || 0);
    });

    getHistory(setHistory);
    getChallengeStatus(setEarnedBadges);
    getUserStats(setUserStats); // Carrega Nível
  };

  useEffect(() => {
    const goal = parseFloat(calorieGoal) || 2000;
    getCalorieStreak(goal, isStrict, setCalorieStreak);
  }, [todayCalories, calorieGoal, isStrict]);

  useEffect(() => {
    if (name || age || weight || height || calorieGoal) {
      saveProfile({ name, age, weight, height, calorieGoal, isStrict, targetWeight, gender, activityLevel, objective });
    }
  }, [name, age, weight, height, calorieGoal, isStrict, targetWeight, gender, activityLevel, objective]);

  const handleAutoCalculate = () => {
    const w = parseFloat(weight); const h = parseFloat(height); const a = parseFloat(age);
    if (!w || !h || !a) { Alert.alert("Dados incompletos", "Preencha tudo."); return; }
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    if (gender === 'male') bmr += 5; else bmr -= 161;
    const tdee = bmr * activityLevel;
    let finalCalories = tdee;
    if (objective === 'lose') finalCalories -= 400;
    if (objective === 'gain') finalCalories += 300;
    const roundedCals = Math.round(finalCalories);
    setCalorieGoal(String(roundedCals));
    calculateMacros(roundedCals, objective);
    Alert.alert("Calculado!", `Sua meta ideal é de ${roundedCals} kcal/dia.`);
  };

  const calculateMacros = (cals, obj) => {
    const total = parseFloat(cals);
    let pSplit = 0.30; let fSplit = 0.30; let cSplit = 0.40;
    if (obj === 'lose') { pSplit = 0.40; cSplit = 0.30; fSplit = 0.30; } 
    else if (obj === 'gain') { pSplit = 0.30; cSplit = 0.50; fSplit = 0.20; }
    setMacros({ p: Math.round((total * pSplit) / 4), c: Math.round((total * cSplit) / 4), f: Math.round((total * fSplit) / 9) });
  };

  const handleDeleteDay = (date) => { Alert.alert("Apagar Dia", "Tem certeza?", [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: () => deleteDailyLog(date, loadAllData) }]); };
  const handleResetApp = () => { Alert.alert("Zerar Tudo", "Certeza?", [{ text: "Cancelar", style: "cancel" }, { text: "ZERAR", style: "destructive", onPress: async () => { await AsyncStorage.clear(); Alert.alert("Resetado", "Reinicie."); } }]); };
  const calculateBMI = () => { const h = parseFloat(height) / 100; const w = parseFloat(weight); if (!h || !w || isNaN(h) || isNaN(w)) return null; return (w / (h * h)).toFixed(1); };
  const bmi = calculateBMI();
  const getBMIStatus = (v) => { if (v < 18.5) return { label: 'Abaixo', color: '#3b82f6' }; if (v < 24.9) return { label: 'Normal', color: '#16a34a' }; if (v < 29.9) return { label: 'Sobrepeso', color: '#eab308' }; return { label: 'Obesidade', color: '#ef4444' }; };
  const waterGoal = weight ? (parseFloat(weight) * 35).toFixed(0) : 0;
  const sortedDates = Object.keys(history).sort().reverse();
  const formatDate = (dateStr) => dateStr.split('-').reverse().slice(0, 2).join('/');
  const weightDiff = (weight && targetWeight) ? (parseFloat(weight) - parseFloat(targetWeight)).toFixed(1) : null;
  const myBadges = QUESTS.filter(q => earnedBadges[q.id]);
  const xpPercent = Math.min((userStats.currentXP / userStats.nextLevelXP) * 100, 100);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* --- NOVA POSIÇÃO: BARRA DE NÍVEL --- */}
      <View style={styles.levelCard}>
         <View style={styles.levelHeader}>
           <View style={styles.levelBadge}>
             <Text style={styles.levelText}>NÍVEL {userStats.level}</Text>
           </View>
           <Text style={styles.xpText}>{userStats.currentXP} / {userStats.nextLevelXP} XP</Text>
         </View>
         <View style={styles.xpBarBg}>
           <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={[styles.xpBarFill, {width: `${xpPercent}%`}]} />
         </View>
         <Text style={styles.levelSub}>Continue completando missões!</Text>
      </View>

      {isStrict && (
        <View style={[styles.messageCard, calorieStreak.status === 'bad' ? styles.messageBad : styles.messageGood]}>
          <Feather name={calorieStreak.status === 'bad' ? "alert-triangle" : "check-circle"} size={24} color="#fff" />
          <View style={{flex: 1, marginLeft: 10}}>
            <Text style={styles.messageTitle}>{calorieStreak.status === 'bad' ? "Foco na meta!" : "Mandou bem!"}</Text>
            <Text style={styles.messageText}>{calorieStreak.status === 'bad' ? `Você está a ${calorieStreak.count} dias fora.` : `Você está a ${calorieStreak.count} dias focado.`}</Text>
          </View>
        </View>
      )}

      {/* SEÇÃO DE MEDALHAS */}
      <View style={styles.badgeSection}>
        <Text style={styles.cardTitle}>Minhas Conquistas 🏅</Text>
        {myBadges.length === 0 ? (
          <Text style={styles.emptyBadges}>Complete desafios para ganhar medalhas!</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 10}}>
            {myBadges.map(quest => (
              <View key={quest.id} style={styles.badgeItem}>
                <LinearGradient colors={quest.color} style={styles.badgeIcon}>
                  <Feather name={quest.icon} size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.badgeText}>{quest.title}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados Pessoais</Text>
        <Text style={styles.label}>Nome</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor="#9ca3af" />
        <View style={styles.row}><View style={styles.halfInput}><Text style={styles.label}>Idade</Text><TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholderTextColor="#9ca3af" /></View><View style={styles.halfInput}><Text style={styles.label}>Altura</Text><TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholderTextColor="#9ca3af" /></View></View>
        <View style={styles.row}><View style={styles.halfInput}><Text style={styles.label}>Peso</Text><TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholderTextColor="#9ca3af" /></View><View style={styles.halfInput}><Text style={styles.label}>Meta Peso</Text><TextInput style={[styles.input, { borderColor: '#3b82f6', color: '#3b82f6' }]} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" placeholderTextColor="#9ca3af" /></View></View>
        {weightDiff !== null && <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginTop: -10, marginBottom: 15 }}>{parseFloat(weightDiff) > 0 ? `📉 Falta ${weightDiff} kg` : `🎉 Meta atingida!`}</Text>}

        <View style={{marginTop: 10, padding: 15, backgroundColor: '#f0f9ff', borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd'}}>
          <Text style={{color:'#0369a1', fontWeight:'bold', marginBottom: 10}}>Calculadora TDEE</Text>
          <View style={styles.selectRow}>
            <TouchableOpacity style={[styles.selectBtn, gender==='male'&&styles.selectBtnActive]} onPress={()=>setGender('male')}><Text style={[styles.selectText, gender==='male'&&styles.selectTextActive]}>Homem</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.selectBtn, gender==='female'&&styles.selectBtnActive]} onPress={()=>setGender('female')}><Text style={[styles.selectText, gender==='female'&&styles.selectTextActive]}>Mulher</Text></TouchableOpacity>
          </View>
          <View style={{flexDirection:'row', flexWrap:'wrap', gap: 5, marginBottom: 10}}>{[{l:'Sedentário', v:1.2}, {l:'Leve', v:1.375}, {l:'Moderado', v:1.55}, {l:'Intenso', v:1.725}].map(i=>(<TouchableOpacity key={i.v} style={[styles.chip, activityLevel===i.v&&styles.chipActive]} onPress={()=>setActivityLevel(i.v)}><Text style={[styles.chipText, activityLevel===i.v&&styles.chipTextActive]}>{i.l}</Text></TouchableOpacity>))}</View>
          <View style={styles.selectRow}>
             <TouchableOpacity style={[styles.selectBtn, objective==='lose'&&styles.selectBtnActive]} onPress={()=>setObjective('lose')}><Text style={[styles.selectText, objective==='lose'&&styles.selectTextActive]}>Secar</Text></TouchableOpacity>
             <TouchableOpacity style={[styles.selectBtn, objective==='maintain'&&styles.selectBtnActive]} onPress={()=>setObjective('maintain')}><Text style={[styles.selectText, objective==='maintain'&&styles.selectTextActive]}>Manter</Text></TouchableOpacity>
             <TouchableOpacity style={[styles.selectBtn, objective==='gain'&&styles.selectBtnActive]} onPress={()=>setObjective('gain')}><Text style={[styles.selectText, objective==='gain'&&styles.selectTextActive]}>Crescer</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.calcButton} onPress={handleAutoCalculate}><Feather name="cpu" size={20} color="#fff" /><Text style={{color:'#fff', fontWeight:'bold', marginLeft: 8}}>Calcular Meta</Text></TouchableOpacity>
          <View style={styles.macroSuggestion}><Text style={styles.macroTitle}>Sugestão:</Text><View style={styles.macroRow}><Text style={styles.macroItem}>🥩 {macros.p}g P</Text><Text style={styles.macroItem}>🥔 {macros.c}g C</Text><Text style={styles.macroItem}>🥑 {macros.f}g G</Text></View></View>
        </View>

        <Text style={styles.label}>Meta Kcal</Text><TextInput style={[styles.input, { borderColor: '#16a34a', color: '#16a34a', fontWeight: 'bold', textAlign: 'center' }]} value={calorieGoal} onChangeText={setCalorieGoal} keyboardType="numeric" />
        <View style={styles.switchRow}><View style={{flex: 1}}><Text style={styles.switchTitle}>Modo Rígido</Text><Text style={styles.switchDesc}>Meta como teto máximo.</Text></View><Switch value={isStrict} onValueChange={setIsStrict} trackColor={{ false: "#767577", true: "#ef4444" }} thumbColor={isStrict ? "#fff" : "#f4f3f4"} /></View>
      </View>

      {bmi && <View style={styles.resultsContainer}><LinearGradient colors={['#f0fdf4', '#dcfce7']} style={[styles.resultCard, { borderColor: getBMIStatus(bmi).color }]}><Text style={styles.resultLabel}>IMC</Text><Text style={[styles.resultValue, { color: getBMIStatus(bmi).color }]}>{bmi}</Text><Text style={styles.resultStatus}>{getBMIStatus(bmi).label}</Text></LinearGradient><LinearGradient colors={['#eff6ff', '#dbeafe']} style={[styles.resultCard, { borderColor: '#3b82f6' }]}><Text style={styles.resultLabel}>Meta Água</Text><Text style={[styles.resultValue, { color: '#2563eb' }]}>{waterGoal}</Text><Text style={styles.resultStatus}>ml</Text></LinearGradient></View>}

      <Text style={styles.historyTitle}>Histórico</Text>
      {sortedDates.map(date => {
        const dayData = history[date];
        const isExpanded = expandedDate === date;
        const dayMeals = dayData.meals || [];
        const dayTotal = dayMeals.reduce((acc, curr) => acc + Number(curr.calories), 0);
        return (
          <View key={date} style={styles.historyItem}>
            <TouchableOpacity style={styles.historyHeader} onPress={() => setExpandedDate(isExpanded ? null : date)}>
              <View style={styles.dateBadge}><Text style={styles.dateText}>{formatDate(date)}</Text></View>
              <View style={styles.headerInfo}><Text style={styles.headerKcal}>{Math.round(dayTotal)} kcal</Text><Text style={styles.headerWater}>💧 {dayData.water || 0} ml</Text></View>
              <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
            </TouchableOpacity>
            {isExpanded && <View style={styles.historyDetails}>{dayMeals.length > 0 ? dayMeals.map((meal, idx) => (<View key={idx} style={styles.mealRow}><Text style={styles.mealName}>• {meal.name}</Text><Text style={styles.mealCal}>{meal.calories} kcal</Text></View>)) : <Text style={styles.noMealText}>Sem refeições.</Text>}<TouchableOpacity style={styles.deleteDayButton} onPress={() => handleDeleteDay(date)}><Feather name="trash-2" size={16} color="#ef4444" /><Text style={styles.deleteDayText}>Apagar Dia</Text></TouchableOpacity></View>}
          </View>
        );
      })}
      
      <View style={{ marginTop: 40, alignItems: 'center' }}><TouchableOpacity style={styles.resetAllButton} onPress={handleResetApp}><Text style={styles.resetAllText}>Zerar App</Text></TouchableOpacity></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  // ESTILOS DO NÍVEL (Igual ao da Home)
  levelCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 20, elevation: 3 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  levelBadge: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  xpText: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  xpBarBg: { width: '100%', height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden', marginBottom: 5 },
  xpBarFill: { height: '100%' },
  levelSub: { fontSize: 10, color: '#9ca3af', fontStyle: 'italic' },

  messageCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 4 },
  messageGood: { backgroundColor: '#16a34a' },
  messageBad: { backgroundColor: '#ef4444' },
  messageTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  messageText: { color: '#fff', fontSize: 13, marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  switchTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  switchDesc: { fontSize: 12, color: '#666' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15, backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  halfInput: { flex: 1 },
  resultsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 25 },
  resultCard: { flex: 1, padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, backgroundColor: '#fff' },
  resultLabel: { fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
  resultValue: { fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
  resultStatus: { fontSize: 12, fontWeight: '600', color: '#4b5563', textAlign: 'center' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptyHistory: { color: '#999', textAlign: 'center', marginTop: 10 },
  historyItem: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  dateBadge: { backgroundColor: '#1f2937', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, marginRight: 10 },
  dateText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  headerInfo: { flex: 1, flexDirection: 'row', gap: 15 },
  headerKcal: { color: '#16a34a', fontWeight: 'bold' },
  headerWater: { color: '#2563eb', fontWeight: 'bold' },
  historyDetails: { padding: 15, backgroundColor: '#f9fafb', borderTopWidth: 1, borderTopColor: '#eee' },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  mealName: { color: '#444', fontSize: 14 },
  mealCal: { color: '#666', fontSize: 14, fontWeight: '600' },
  noMealText: { color: '#aaa', fontSize: 12, fontStyle: 'italic' },
  deleteDayButton: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  deleteDayText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  resetAllButton: { padding: 12, borderRadius: 8, backgroundColor: '#fee2e2' },
  resetAllText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
  selectBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e0f2fe', backgroundColor: '#fff' },
  selectBtnActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  selectText: { color: '#0ea5e9', fontWeight: 'bold', fontSize: 12 },
  selectTextActive: { color: '#fff' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0f2fe', marginRight: 5, marginBottom: 5 },
  chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  chipText: { color: '#0ea5e9', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  calcButton: { flexDirection: 'row', backgroundColor: '#0ea5e9', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 15, elevation: 3 },
  macroSuggestion: { marginTop: 10, padding: 10, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center' },
  macroTitle: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 'bold' },
  macroRow: { flexDirection: 'row', gap: 15 },
  macroItem: { fontSize: 14, color: '#333', fontWeight: '600' },
  badgeSection: { marginBottom: 20 },
  emptyBadges: { color: '#999', fontStyle: 'italic', fontSize: 12, marginTop: 5 },
  badgeItem: { alignItems: 'center', marginRight: 15 },
  badgeIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 5, elevation: 3 },
  badgeText: { fontSize: 10, color: '#4b5563', fontWeight: 'bold', maxWidth: 60, textAlign: 'center' }
});