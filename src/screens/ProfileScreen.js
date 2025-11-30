import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { saveProfile, getProfile, getHistory, getDayLog, getTodayKey, getCalorieStreak, deleteDailyLog } from '../services/db';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [targetWeight, setTargetWeight] = useState(''); 
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [isStrict, setIsStrict] = useState(false); 
  const [calorieStreak, setCalorieStreak] = useState({ status: 'good', count: 0 });

  const [todayCalories, setTodayCalories] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [history, setHistory] = useState({});
  const [expandedDate, setExpandedDate] = useState(null);

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
      }
    });

    getDayLog(getTodayKey(), (data) => {
      const meals = data.meals || [];
      const calculatedTotal = meals.reduce((acc, curr) => acc + Number(curr.calories), 0);
      setTodayCalories(calculatedTotal);
      setTodayWater(data.water || 0);
    });

    getHistory((data) => {
      setHistory(data);
    });
  };

  useEffect(() => {
    const goal = parseFloat(calorieGoal) || 2000;
    getCalorieStreak(goal, isStrict, (result) => {
      setCalorieStreak(result);
    });
  }, [todayCalories, calorieGoal, isStrict]);

  useEffect(() => {
    if (name || age || weight || height || calorieGoal) {
      saveProfile({ name, age, weight, height, calorieGoal, isStrict, targetWeight });
    }
  }, [name, age, weight, height, calorieGoal, isStrict, targetWeight]);

  const handleDeleteDay = (date) => {
    Alert.alert("Apagar Dia", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => { deleteDailyLog(date, () => { loadAllData(); }); } }
    ]);
  };

  const handleResetApp = () => {
    Alert.alert("Zerar Tudo", "Isso apaga TUDO. Certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "ZERAR", style: "destructive", onPress: async () => { await AsyncStorage.clear(); Alert.alert("Resetado", "Reinicie o app."); } }
    ]);
  };

  const calculateBMI = () => {
    const h = parseFloat(height) / 100; const w = parseFloat(weight);
    if (!h || !w || isNaN(h) || isNaN(w)) return null;
    return (w / (h * h)).toFixed(1);
  };
  const bmi = calculateBMI();
  const getBMIStatus = (v) => {
    if (v < 18.5) return { label: 'Abaixo do peso', color: '#3b82f6' };
    if (v < 24.9) return { label: 'Peso Normal', color: '#16a34a' };
    if (v < 29.9) return { label: 'Sobrepeso', color: '#eab308' };
    return { label: 'Obesidade', color: '#ef4444' };
  };

  const waterGoal = weight ? (parseFloat(weight) * 35).toFixed(0) : 0;
  const goal = parseFloat(calorieGoal) || 2000;
  const progressPercent = goal > 0 ? Math.min((todayCalories / goal) * 100, 100) : 0;
  const sortedDates = Object.keys(history).sort().reverse();
  const formatDate = (dateStr) => dateStr.split('-').reverse().slice(0, 2).join('/');

  const showStrictBanner = isStrict;
  const showFlexBanner = !isStrict && todayCalories >= goal;
  const isBroken = isStrict && (todayCalories >= goal * 1.5);
  const weightDiff = (weight && targetWeight) ? (parseFloat(weight) - parseFloat(targetWeight)).toFixed(1) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {showStrictBanner && (
        <View style={[styles.messageCard, isBroken ? { backgroundColor: '#1f2937' } : (calorieStreak.status === 'bad' ? styles.messageBad : styles.messageGood)]}>
          <Feather name={isBroken ? "zap-off" : (calorieStreak.status === 'bad' ? "alert-triangle" : "check-circle")} size={24} color="#fff" />
          <View style={{flex: 1, marginLeft: 10}}>
            <Text style={styles.messageTitle}>{isBroken ? "SOCORRO! 😱" : (calorieStreak.status === 'bad' ? "Foco na meta!" : "Mandou bem!")}</Text>
            <Text style={styles.messageText}>{isBroken ? "Você quebrou a barra de progresso!" : (calorieStreak.status === 'bad' ? `Você está a ${calorieStreak.count} dia(s) fora de foco 👎` : `Você está a ${calorieStreak.count} dia(s) focado(a).`)}</Text>
          </View>
        </View>
      )}
      {showFlexBanner && (
        <View style={[styles.messageCard, styles.messageGood]}>
          <Feather name="trending-up" size={24} color="#fff" />
          <View style={{flex: 1, marginLeft: 10}}>
            <Text style={styles.messageTitle}>Parabéns!</Text>
            <Text style={styles.messageText}>Continue focado. Você está a {calorieStreak.count} dia(s) no foco.</Text>
          </View>
        </View>
      )}

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Consumo Diário</Text>
          <Text style={styles.goalValues}>{Math.round(todayCalories)} <Text style={{fontSize: 14, color: '#888'}}>/ {goal} kcal</Text></Text>
        </View>
        {isBroken ? (
          <View style={styles.brokenContainer}>
            <View style={styles.brokenLeft}><LinearGradient colors={['#7f1d1d', '#b91c1c']} style={{flex: 1, borderRadius: 6}} /></View>
            <Text style={styles.explosion}>💥</Text>
            <View style={styles.brokenRight}><LinearGradient colors={['#b91c1c', '#7f1d1d']} style={{flex: 1, borderRadius: 6}} /></View>
          </View>
        ) : (
          <View style={styles.progressBarBackground}>
            <LinearGradient colors={todayCalories > goal && isStrict ? ['#ef4444', '#b91c1c'] : ['#22c55e', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        )}
        <Text style={[styles.goalSubtitle, todayCalories > goal && isStrict && {color: '#ef4444'}]}>{todayCalories > goal ? `Excedeu ${Math.round(todayCalories - goal)} kcal` : `Restam ${Math.round(goal - todayCalories)} kcal`}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configurações</Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="#9ca3af" />

        <View style={styles.row}>
          <View style={styles.halfInput}><Text style={styles.label}>Idade</Text><TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Anos" placeholderTextColor="#9ca3af" /></View>
          <View style={styles.halfInput}><Text style={styles.label}>Altura (cm)</Text><TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="175" placeholderTextColor="#9ca3af" /></View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Peso Atual (kg)</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="Ex: 80" placeholderTextColor="#9ca3af" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Meta de Peso (kg)</Text>
            <TextInput style={[styles.input, { borderColor: '#3b82f6', color: '#3b82f6', fontWeight: 'bold' }]} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" placeholder="Ex: 75" placeholderTextColor="#9ca3af" />
          </View>
        </View>

        {weightDiff !== null && (
          <View style={{ alignItems: 'center', marginBottom: 15, marginTop: -5 }}>
            <Text style={{ color: '#666', fontSize: 12 }}>
              {parseFloat(weightDiff) > 0 ? `📉 Faltam perder ${weightDiff} kg` : (parseFloat(weightDiff) < 0 ? `📈 Faltam ganhar ${Math.abs(weightDiff)} kg` : "🎉 Meta atingida!")}
            </Text>
          </View>
        )}

        <Text style={styles.label}>Meta Diária de Calorias</Text>
        <TextInput style={[styles.input, { borderColor: '#16a34a', color: '#16a34a', fontWeight: 'bold' }]} value={calorieGoal} onChangeText={setCalorieGoal} keyboardType="numeric" placeholder="2000" placeholderTextColor="#9ca3af" />

        <View style={styles.switchRow}>
          <View style={{flex: 1}}><Text style={styles.switchTitle}>Modo Rígido</Text><Text style={styles.switchDesc}>Ative se sua meta for um limite máximo.</Text></View>
          <Switch value={isStrict} onValueChange={setIsStrict} trackColor={{ false: "#767577", true: "#ef4444" }} thumbColor={isStrict ? "#fff" : "#f4f3f4"} />
        </View>
      </View>

      {bmi && (
        <View style={styles.resultsContainer}>
          <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={[styles.resultCard, { borderColor: getBMIStatus(bmi).color }]}>
            <Text style={styles.resultLabel}>IMC</Text>
            <Text style={[styles.resultValue, { color: getBMIStatus(bmi).color }]}>{bmi}</Text>
            <Text style={styles.resultStatus}>{getBMIStatus(bmi).label}</Text>
          </LinearGradient>
          <LinearGradient colors={['#eff6ff', '#dbeafe']} style={[styles.resultCard, { borderColor: '#3b82f6' }]}>
            <Text style={styles.resultLabel}>Meta Água</Text>
            <Text style={[styles.resultValue, { color: '#2563eb' }]}>{waterGoal}</Text>
            <Text style={styles.resultStatus}>ml / dia</Text>
          </LinearGradient>
        </View>
      )}

      <Text style={styles.historyTitle}>Histórico</Text>
      {sortedDates.length === 0 ? <Text style={styles.emptyHistory}>Nenhum registro encontrado ainda.</Text> : sortedDates.map(date => {
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
            {isExpanded && (
              <View style={styles.historyDetails}>
                {dayMeals.length > 0 ? dayMeals.map((meal, idx) => (
                  <View key={idx} style={styles.mealRow}><Text style={styles.mealName}>• {meal.name}</Text><Text style={styles.mealCal}>{meal.calories} kcal</Text></View>
                )) : <Text style={styles.noMealText}>Sem refeições.</Text>}
                <TouchableOpacity style={styles.deleteDayButton} onPress={() => handleDeleteDay(date)}>
                  <Feather name="trash-2" size={16} color="#ef4444" />
                  <Text style={styles.deleteDayText}>Apagar Registro do Dia</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <TouchableOpacity style={styles.resetAllButton} onPress={handleResetApp}><Text style={styles.resetAllText}>Zerar Aplicativo (Reset de Fábrica)</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  messageCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 4 },
  messageGood: { backgroundColor: '#16a34a' },
  messageBad: { backgroundColor: '#ef4444' },
  messageTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  messageText: { color: '#fff', fontSize: 13, marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  switchTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  switchDesc: { fontSize: 12, color: '#666' },
  goalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 4, marginBottom: 20, borderWidth: 1, borderColor: '#f0f0f0' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  goalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  goalValues: { fontSize: 24, fontWeight: 'bold', color: '#16a34a' },
  progressBarBackground: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  brokenContainer: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  brokenLeft: { width: '45%', height: 12, transform: [{ rotate: '10deg' }, { translateY: 5 }] },
  brokenRight: { width: '45%', height: 12, transform: [{ rotate: '-10deg' }, { translateY: 10 }] },
  explosion: { fontSize: 24, position: 'absolute', zIndex: 10 },
  goalSubtitle: { fontSize: 12, color: '#666', textAlign: 'right', fontStyle: 'italic' },
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
  resetAllText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 }
});