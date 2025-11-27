import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, FlatList 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { saveProfile, getProfile, getHistory } from '../services/db';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  // Estado do Histórico
  const [history, setHistory] = useState({});
  const [expandedDate, setExpandedDate] = useState(null); // Qual dia está aberto

  // Carrega dados ao abrir a tela
  useEffect(() => {
    // 1. Carrega Perfil
    getProfile((data) => {
      if (data) {
        setName(data.name || '');
        setAge(data.age || '');
        setWeight(data.weight || '');
        setHeight(data.height || '');
      }
    });

    // 2. Carrega Histórico
    getHistory((data) => {
      setHistory(data);
    });
  }, []);

  // Salva perfil automaticamente
  useEffect(() => {
    if (name || age || weight || height) {
      saveProfile({ name, age, weight, height });
    }
  }, [name, age, weight, height]);

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

  // Ordena as datas do histórico (mais recente primeiro)
  const sortedDates = Object.keys(history).sort().reverse();

  // Função para formatar data (YYYY-MM-DD -> DD/MM)
  const formatDate = (dateStr) => dateStr.split('-').reverse().slice(0, 2).join('/');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* --- SEÇÃO 1: DADOS PESSOAIS --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Olá, {name || 'Visitante'}</Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Idade</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Anos" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Altura (cm)</Text>
            <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="175" />
          </View>
        </View>

        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="70" />
      </View>

      {/* --- SEÇÃO 2: RESULTADOS --- */}
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

      {/* --- SEÇÃO 3: HISTÓRICO --- */}
      <Text style={styles.historyTitle}>Histórico de Registros</Text>
      
      {sortedDates.length === 0 ? (
        <Text style={styles.emptyHistory}>Nenhum registro encontrado ainda.</Text>
      ) : (
        sortedDates.map(date => {
          const dayData = history[date];
          const isExpanded = expandedDate === date;

          return (
            <View key={date} style={styles.historyItem}>
              {/* Cabeçalho do Dia (Clicável) */}
              <TouchableOpacity 
                style={styles.historyHeader} 
                onPress={() => setExpandedDate(isExpanded ? null : date)}
              >
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerKcal}>{dayData.totalCalories || 0} kcal</Text>
                  <Text style={styles.headerWater}>💧 {dayData.water || 0} ml</Text>
                </View>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
              </TouchableOpacity>

              {/* Detalhes (Aparecem só se expandido) */}
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
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15, backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  halfInput: { flex: 1 },
  
  resultsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 25 },
  resultCard: { flex: 1, padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  resultLabel: { fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
  resultValue: { fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
  resultStatus: { fontSize: 12, fontWeight: '600', color: '#4b5563', textAlign: 'center' },

  // Estilos do Histórico
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptyHistory: { color: '#999', textAlign: 'center', marginTop: 10 },
  historyItem: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  dateBadge: { backgroundColor: '#333', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, marginRight: 10 },
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