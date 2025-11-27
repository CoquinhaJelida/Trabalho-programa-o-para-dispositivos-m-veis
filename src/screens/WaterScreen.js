import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getCurrentDate, loadHistory, saveHistory, loadData, saveData } from '../services/storage';

export default function WaterScreen() {
  const [userWeight, setUserWeight] = useState('');
  const [waterGoal, setWaterGoal] = useState(0);
  const [waterConsumed, setWaterConsumed] = useState(0);
  const [waterAmount, setWaterAmount] = useState('');
  const [waterHistory, setWaterHistory] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveDataToStorage();
  }, [waterConsumed, waterGoal, userWeight]);

  const loadData = async () => {
    const history = await loadHistory('water-history');
    setWaterHistory(history);
    const savedWeight = await loadData('user-weight-water');
    if (savedWeight) setUserWeight(savedWeight);

    const today = getCurrentDate();
    if (history[today]) {
      setWaterConsumed(history[today].consumed || 0);
      setWaterGoal(history[today].goal || 0);
    }
  };

  const saveDataToStorage = async () => {
    const today = getCurrentDate();
    if (waterGoal > 0) {
      const newHistory = {
        ...waterHistory,
        [today]: {
          consumed: waterConsumed,
          goal: waterGoal,
          weight: userWeight,
          date: today
        }
      };
      setWaterHistory(newHistory); // Atualiza estado local
      await saveHistory('water-history', newHistory); // Salva no disco
    }
    if (userWeight) await saveData('user-weight-water', userWeight);
  };

  const setGoal = () => {
    if (userWeight && !isNaN(userWeight)) {
      setWaterGoal(parseFloat(userWeight) * 35);
      setWaterConsumed(0);
    }
  };

  const addWater = (amount) => {
    const val = amount ? parseFloat(amount) : parseFloat(waterAmount);
    if (!isNaN(val)) {
      const newTotal = Math.min(waterConsumed + val, waterGoal);
      setWaterConsumed(newTotal);
      setWaterAmount('');
    }
  };

  const percentage = waterGoal > 0 ? (waterConsumed / waterGoal) * 100 : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Botão Histórico */}
      <TouchableOpacity 
        style={styles.historyButton} 
        onPress={() => setShowHistory(!showHistory)}
      >
        <Feather name={showHistory ? "arrow-left" : "calendar"} size={20} color="#fff" />
        <Text style={styles.historyButtonText}>
          {showHistory ? " Voltar para Hoje" : " Ver Histórico"}
        </Text>
      </TouchableOpacity>

      {showHistory ? (
        <View>
          <Text style={styles.sectionTitle}>Histórico de Hidratação</Text>
          {Object.keys(waterHistory).sort().reverse().map(date => {
            const day = waterHistory[date];
            const dayPercent = (day.consumed / day.goal) * 100;
            return (
              <View key={date} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.dateText}>{date.split('-').reverse().join('/')}</Text>
                  <Text style={styles.percentText}>{dayPercent.toFixed(0)}%</Text>
                </View>
                <Text style={styles.historyDetail}>Meta: {day.goal}ml | Bebeu: {day.consumed}ml</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <>
          {waterGoal === 0 ? (
            <View style={styles.card}>
              <Text style={styles.title}>Configurar Meta</Text>
              <Text style={styles.label}>Seu Peso (kg)</Text>
              <TextInput 
                style={styles.input} 
                value={userWeight} 
                onChangeText={setUserWeight} 
                keyboardType="numeric"
                placeholder="Ex: 70"
              />
              <TouchableOpacity style={styles.mainButton} onPress={setGoal}>
                <Text style={styles.mainButtonText}>Calcular Meta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Visual do Copo */}
              <View style={styles.visualContainer}>
                <View style={[styles.waterFill, { height: `${percentage}%` }]} />
                <View style={styles.visualContent}>
                  <Text style={styles.percentBig}>{percentage.toFixed(0)}%</Text>
                  <Text style={styles.amountText}>{waterConsumed.toFixed(0)} / {waterGoal.toFixed(0)} ml</Text>
                </View>
              </View>

              {/* Controles */}
              <View style={styles.card}>
                <View style={styles.quickButtons}>
                  {[200, 300, 500].map(amt => (
                    <TouchableOpacity key={amt} style={styles.quickBtn} onPress={() => addWater(amt)}>
                      <Text style={styles.quickBtnText}>+{amt}ml</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.inputRow}>
                  <TextInput 
                    style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                    value={waterAmount} 
                    onChangeText={setWaterAmount}
                    placeholder="Outro valor..."
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.plusBtn} onPress={() => addWater()}>
                    <Feather name="plus" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => setWaterGoal(0)}>
                  <Text style={styles.resetLink}>Redefinir peso/meta</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  historyButton: { flexDirection: 'row', backgroundColor: '#3b82f6', padding: 12, borderRadius: 10, marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  historyButtonText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 3 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 15 },
  label: { color: '#4b5563', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15 },
  mainButton: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 10, alignItems: 'center' },
  mainButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  visualContainer: { height: 250, backgroundColor: '#e0f2fe', borderRadius: 20, overflow: 'hidden', marginBottom: 20, justifyContent: 'center', borderWidth: 2, borderColor: '#bae6fd' },
  waterFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#60a5fa' },
  visualContent: { alignItems: 'center' },
  percentBig: { fontSize: 48, fontWeight: 'bold', color: '#1e3a8a', textShadowColor: 'rgba(255,255,255,0.5)', textShadowRadius: 5 },
  amountText: { fontSize: 16, color: '#1e40af', fontWeight: '600' },
  quickButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  quickBtn: { backgroundColor: '#dbeafe', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  quickBtnText: { color: '#1d4ed8', fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', gap: 10 },
  plusBtn: { backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', width: 50, borderRadius: 8 },
  resetLink: { color: '#6b7280', textAlign: 'center', marginTop: 15, textDecorationLine: 'underline' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
  historyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  dateText: { fontWeight: 'bold', fontSize: 16, color: '#374151' },
  percentText: { fontWeight: 'bold', color: '#2563eb' },
  historyDetail: { color: '#6b7280' }
});