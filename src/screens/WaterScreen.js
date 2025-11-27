import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
// Importa novas funções
import { getProfile, saveDailyLog, getDayLog, getTodayKey } from '../services/db';

export default function WaterScreen() {
  const [goal, setGoal] = useState(0);
  const [consumed, setConsumed] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // 1. Carrega meta
    getProfile((data) => {
      if (data && data.weight) {
        setGoal(parseFloat(data.weight) * 35);
        setHasProfile(true);
      }
    });
    // 2. Carrega quanto já bebeu hoje
    getDayLog(getTodayKey(), (data) => {
      setConsumed(data.water || 0);
    });
  }, []);

  const addWater = (amount) => {
    const newTotal = consumed + amount;
    setConsumed(newTotal);
    // Salva no histórico
    saveDailyLog(getTodayKey(), { water: newTotal });
  };

  const resetDay = () => {
    setConsumed(0);
    saveDailyLog(getTodayKey(), { water: 0 });
  };

  const percentage = goal > 0 ? (consumed / goal) * 100 : 0;
  const waterHeight = Math.min(percentage, 100); 

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {!hasProfile ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>Configure seu perfil primeiro.</Text>
        </View>
      ) : (
        <View>
          <View style={styles.glassContainer}>
            <View style={[styles.water, { height: `${waterHeight}%` }]} />
            <View style={styles.overlay}>
              <Feather name="droplet" size={40} color={percentage > 50 ? '#fff' : '#3b82f6'} />
              <Text style={[styles.percentageText, percentage > 50 && { color: '#fff' }]}>{percentage.toFixed(0)}%</Text>
              <Text style={[styles.mlText, percentage > 50 && { color: '#e0f2fe' }]}>{consumed} / {goal.toFixed(0)} ml</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.buttonGrid}>
              <TouchableOpacity style={styles.quickButton} onPress={() => addWater(200)}><Text style={styles.quickButtonText}>+200ml</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickButton} onPress={() => addWater(300)}><Text style={styles.quickButtonText}>+300ml</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickButton} onPress={() => addWater(500)}><Text style={styles.quickButtonText}>+500ml</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={resetDay}><Text style={styles.resetButtonText}>Zerar Dia</Text></TouchableOpacity>
          </View>
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
  glassContainer: { height: 280, backgroundColor: '#e0f2fe', borderRadius: 20, overflow: 'hidden', borderWidth: 4, borderColor: '#bae6fd', marginBottom: 24, position: 'relative' },
  water: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#3b82f6', width: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  percentageText: { fontSize: 48, fontWeight: 'bold', color: '#1e3a8a' },
  mlText: { fontSize: 18, fontWeight: '600', color: '#1e40af', marginTop: 4 },
  buttonGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickButton: { backgroundColor: '#eff6ff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  quickButtonText: { color: '#2563eb', fontWeight: 'bold' },
  resetButton: { padding: 12, alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10 },
  resetButtonText: { color: '#4b5563', fontWeight: '600' },
});