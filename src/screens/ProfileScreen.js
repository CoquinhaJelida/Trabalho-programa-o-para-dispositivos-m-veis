import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
// Importamos funções de data e histórico também
import { saveProfile, getProfile, getHistory, getDayLog, getTodayKey } from '../services/db';

export default function ProfileScreen() {
  // Dados do Perfil
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [calorieGoal, setCalorieGoal] = useState('2000'); // Meta padrão

  // Dados do Dia (Para a barra de progresso)
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayWater, setTodayWater] = useState(0);

  // Histórico Geral
  const [history, setHistory] = useState({});
  const [expandedDate, setExpandedDate] = useState(null);

  // Carrega tudo ao abrir a tela
  useEffect(() => {
    // 1. Carrega Perfil
    getProfile((data) => {
      if (data) {
        setName(data.name || '');
        setAge(data.age || '');
        setWeight(data.weight || '');
        setHeight(data.height || '');
        setCalorieGoal(data.calorieGoal || '2000');
      }
    });

    // 2. Carrega Calorias de Hoje (para a barra)
    getDayLog(getTodayKey(), (data) => {
      setTodayCalories(data.totalCalories || 0);
      setTodayWater(data.water || 0);
    });

    // 3. Carrega Histórico Completo (para a lista)
    getHistory((data) => {
      setHistory(data);
    });
  }, []);

  // Salva perfil automaticamente ao digitar
  useEffect(() => {
    // Só salva se tiver pelo menos um dado preenchido para não sobrescrever com vazio no load inicial
    if (name || age || weight || height || calorieGoal) {
      saveProfile({ name, age, weight, height, calorieGoal });
    }
  }, [name, age, weight, height, calorieGoal]);

  // --- CÁLCULOS ---
  const calculateBMI = () => {
    if (!weight || !height) return null;
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h === 0) return null;
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

  // Cálculo da Barra de Progresso
  const goal = parseFloat(calorieGoal) || 2000;
  const progressPercent = Math.min((todayCalories / goal) * 100, 100);

  // Ordena histórico
  const sortedDates = Object.keys(history).sort().reverse();
  const formatDate = (dateStr) => dateStr.split('-').reverse().slice(0, 2).join('/');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* --- SEÇÃO 1: BARRA DE META (NOVO!) --- */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Progresso Diário</Text>
          <Text style={styles.goalValues}>
            {Math.round(todayCalories)} <Text style={{fontSize: 14, color: '#888'}}>/ {goal} kcal</Text>
          </Text>
        </View>

        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
        
        <Text style={styles.goalSubtitle}>
          {todayCalories >= goal ? "Meta atingida! 🏆" : `Faltam ${Math.round(goal - todayCalories)} kcal`}
        </Text>
      </View>

      {/* --- SEÇÃO 2: DADOS PESSOAIS --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configurações</Text>
        
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Idade</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Meta Kcal</Text>
            <TextInput 
              style={[styles.input, { borderColor: '#16a34a', color: '#16a34a', fontWeight: 'bold' }]} 
              value={calorieGoal} 
              onChangeText={setCalorieGoal} 
              keyboardType="numeric" 
              placeholder="2000"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Altura (cm)</Text>
            <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
          </View>
        </View>
      </View>

      {/* --- SEÇÃO 3: RESULTADOS (IMC e Água) --- */}
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

      {/* --- SEÇÃO 4: HISTÓRICO --- */}
      <Text style={styles.historyTitle}>Histórico Completo</Text>
      
      {sortedDates.length === 0 ? (
        <Text style={styles.emptyHistory}>Nenhum registro encontrado ainda.</Text>
      ) : (
        sortedDates.map(date => {
          const dayData = history[date];
          const isExpanded = expandedDate === date;

          return (
            <View key={date} style={styles.historyItem}>
              {/* Cabeçalho do Dia */}
              <TouchableOpacity 
                style={styles.historyHeader} 
                onPress={() => setExpandedDate(isExpanded ? null : date)}
              >
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerKcal}>{Math.round(dayData.totalCalories || 0)} kcal</Text>
                  <Text style={styles.headerWater}>💧 {dayData.water || 0} ml</Text>
                </View>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
              </TouchableOpacity>

              {/* Detalhes */}
              {isExpanded && (
                <View style={styles.historyDetails}>
                  {dayData.meals && dayData.meals.length > 0 ? (
                    dayData.meals.map((meal, idx) => (
                      <View key={idx} style={styles.mealRow}>
                        <Text style={styles.mealName}>• {meal.name}</Text>
                        <Text style={styles.mealCal}>{meal.calories} kcal</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noMealText}>Sem refeições neste dia.</Text>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  
  // Barra de Meta (NOVO)
  goalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 4, marginBottom: 20, borderWidth: 1, borderColor: '#f0f0f0' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  goalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  goalValues: { fontSize: 24, fontWeight: 'bold', color: '#16a34a' },
  progressBarBackground: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  goalSubtitle: { fontSize: 12, color: '#666', textAlign: 'right', fontStyle: 'italic' },

  // Card Configurações
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15, backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  halfInput: { flex: 1 },
  
  // Resultados
  resultsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 25 },
  resultCard: { flex: 1, padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, backgroundColor: '#fff' },
  resultLabel: { fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
  resultValue: { fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
  resultStatus: { fontSize: 12, fontWeight: '600', color: '#4b5563', textAlign: 'center' },

  // Histórico
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
});