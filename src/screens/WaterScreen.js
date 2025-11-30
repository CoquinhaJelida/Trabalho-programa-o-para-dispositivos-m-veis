import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Keyboard 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getProfile, saveDailyLog, getDayLog, getTodayKey, getWaterStreak } from '../services/db';

export default function WaterScreen() {
  const [goal, setGoal] = useState(0);
  const [consumed, setConsumed] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);
  const [streak, setStreak] = useState(0);
  
  // NOVO: Estado para a quantidade personalizada
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    getProfile((data) => {
      if (data && data.weight) {
        const calculatedGoal = parseFloat(data.weight) * 35;
        setGoal(calculatedGoal);
        setHasProfile(true);
      }
    });
    
    getDayLog(getTodayKey(), (data) => {
      setConsumed(data.water || 0);
    });

    updateStreak();
  };

  const updateStreak = () => {
    getWaterStreak(setStreak);
  };

  const addWater = (amount) => {
    const newTotal = consumed + amount;
    setConsumed(newTotal);
    
    saveDailyLog(getTodayKey(), { 
      water: newTotal, 
      goal: goal 
    }).then(() => {
      updateStreak();
    });
  };

  // Função para adicionar o valor do input
  const handleAddCustom = () => {
    const amount = parseFloat(customAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      Alert.alert("Valor inválido", "Digite uma quantidade em ml.");
      return;
    }
    addWater(amount);
    setCustomAmount(''); // Limpa o campo
    Keyboard.dismiss();  // Fecha o teclado
  };

  const resetDay = () => {
    setConsumed(0);
    saveDailyLog(getTodayKey(), { water: 0, goal: goal }).then(() => {
      updateStreak();
    });
  };

  const percentage = goal > 0 ? (consumed / goal) * 100 : 0;
  const waterHeight = Math.min(percentage, 100); 

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {!hasProfile ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>Configure seu peso no Perfil primeiro.</Text>
        </View>
      ) : (
        <View>
          {/* COPO */}
          <View style={styles.glassContainer}>
            <View style={[styles.water, { height: `${waterHeight}%` }]} />
            <View style={styles.overlay}>
              <Feather name="droplet" size={40} color={percentage > 50 ? '#fff' : '#3b82f6'} />
              <Text style={[styles.percentageText, percentage > 50 && { color: '#fff' }]}>
                {percentage.toFixed(0)}%
              </Text>
              <Text style={[styles.mlText, percentage > 50 && { color: '#e0f2fe' }]}>
                {consumed} / {goal.toFixed(0)} ml
              </Text>
            </View>
          </View>

          {/* CONTROLES */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Adicionar Água</Text>
            
            {/* Botões Rápidos */}
            <View style={styles.buttonGrid}>
              <TouchableOpacity style={styles.quickButton} onPress={() => addWater(200)}>
                <Text style={styles.quickButtonText}>+200ml</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickButton} onPress={() => addWater(300)}>
                <Text style={styles.quickButtonText}>+300ml</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickButton} onPress={() => addWater(500)}>
                <Text style={styles.quickButtonText}>+500ml</Text>
              </TouchableOpacity>
            </View>

            {/* Input Personalizado (NOVO) */}
            <View style={styles.customRow}>
              <TextInput 
                style={styles.customInput}
                placeholder="Outra qtd (ml)"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
              />
              <TouchableOpacity style={styles.customBtn} onPress={handleAddCustom}>
                <Feather name="plus" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetDay}>
              <Text style={styles.resetButtonText}>Zerar Dia</Text>
            </TouchableOpacity>
          </View>

          {/* STREAK CARD */}
          {streak > 0 && (
            <View style={styles.streakCard}>
              <View style={styles.streakIcon}>
                <Feather name="zap" size={24} color="#f59e0b" /> 
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.streakTitle}>Sequência Incrível!</Text>
                <Text style={styles.streakText}>
                  Parabéns, você está há <Text style={{fontWeight: 'bold', color: '#f59e0b'}}>{streak} {streak === 1 ? 'dia' : 'dias'}</Text> bem hidratado!
                </Text>
              </View>
            </View>
          )}

        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 24, flexGrow: 1 },
  warningCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center' },
  warningText: { color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  glassContainer: { height: 280, backgroundColor: '#e0f2fe', borderRadius: 20, overflow: 'hidden', borderWidth: 4, borderColor: '#bae6fd', marginBottom: 24, position: 'relative' },
  water: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#3b82f6', width: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  percentageText: { fontSize: 48, fontWeight: 'bold', color: '#1e3a8a' },
  mlText: { fontSize: 18, fontWeight: '600', color: '#1e40af', marginTop: 4 },

  buttonGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  quickButton: { backgroundColor: '#eff6ff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  quickButtonText: { color: '#2563eb', fontWeight: 'bold' },
  
  // Estilos do Input Personalizado
  customRow: { flexDirection: 'row', marginBottom: 15 },
  customInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, fontSize: 16, backgroundColor: '#f9f9f9', marginRight: 10 },
  customBtn: { backgroundColor: '#3b82f6', width: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  resetButton: { padding: 12, alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10 },
  resetButtonText: { color: '#4b5563', fontWeight: '600' },

  streakCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff7ed', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#ffedd5',
    marginBottom: 20
  },
  streakIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#fef3c7', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 15 
  },
  streakTitle: { fontWeight: 'bold', color: '#92400e', fontSize: 14, marginBottom: 2 },
  streakText: { color: '#b45309', fontSize: 13, flexWrap: 'wrap' }
});