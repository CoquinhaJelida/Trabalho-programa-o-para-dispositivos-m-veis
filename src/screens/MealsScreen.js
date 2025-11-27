import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getCurrentDate, loadHistory, saveHistory } from '../services/storage';

export default function MealsScreen() {
  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [mealHistory, setMealHistory] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  
  const caloriesRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [meals]);

  const loadData = async () => {
    const history = await loadHistory('meal-history');
    setMealHistory(history);
    const today = getCurrentDate();
    if (history[today]) {
      setMeals(history[today].meals || []);
    }
  };

  const saveData = async () => {
    const today = getCurrentDate();
    const updatedHistory = {
      ...mealHistory,
      [today]: {
        meals: meals,
        totalCalories: meals.reduce((sum, meal) => sum + meal.calories, 0),
        date: today
      }
    };
    setMealHistory(updatedHistory);
    await saveHistory('meal-history', updatedHistory);
  };

  const addMeal = () => {
    if (mealName.trim() && calories && !isNaN(calories)) {
      const newMeal = {
        id: Date.now().toString(),
        name: mealName,
        calories: parseFloat(calories),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMeals([...meals, newMeal]);
      setMealName('');
      setCalories('');
      Keyboard.dismiss();
    } else {
      Alert.alert("Erro", "Preencha o nome e as calorias!");
    }
  };

  const deleteMeal = (id) => {
    setMeals(meals.filter(meal => meal.id !== id));
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <View style={styles.container}>
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
        <FlatList 
          data={Object.keys(mealHistory).sort().reverse()}
          keyExtractor={item => item}
          renderItem={({ item: date }) => {
            const day = mealHistory[date];
            return (
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.dateText}>{date.split('-').reverse().join('/')}</Text>
                  <Text style={styles.caloriesText}>{day.totalCalories} kcal</Text>
                </View>
                {day.meals.map((m, index) => (
                  <Text key={index} style={styles.historyItem}>• {m.name} ({m.calories})</Text>
                ))}
              </View>
            );
          }}
        />
      ) : (
        <>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL DE HOJE</Text>
            <Text style={styles.summaryValue}>{totalCalories}</Text>
            <Text style={styles.summaryUnit}>calorias</Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Adicionar Refeição</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={mealName}
                onChangeText={setMealName}
                placeholder="Ex: Almoço"
                returnKeyType="next"
                onSubmitEditing={() => caloriesRef.current.focus()}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Calorias</Text>
              <TextInput
                ref={caloriesRef}
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                placeholder="Ex: 450"
                keyboardType="numeric"
                onSubmitEditing={addMeal}
              />
            </View>
            <TouchableOpacity onPress={addMeal} style={styles.addButton}>
              <Feather name="plus" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={meals}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.mealItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName}>{item.name}</Text>
                  <View style={styles.mealMeta}>
                    <Text style={styles.mealCalories}>{item.calories} kcal</Text>
                    <Text style={styles.mealTime}>{item.time}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteMeal(item.id)} style={styles.deleteButton}>
                  <Feather name="trash-2" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            ListHeaderComponent={<Text style={styles.cardTitle}>Refeições de Hoje</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  historyButton: { flexDirection: 'row', backgroundColor: '#16a34a', padding: 12, borderRadius: 10, marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  historyButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  summaryCard: { borderRadius: 16, padding: 24, marginBottom: 20, elevation: 5 },
  summaryLabel: { color: '#dcfce7', fontSize: 12, fontWeight: 'bold' },
  summaryValue: { fontSize: 40, fontWeight: 'bold', color: '#fff' },
  summaryUnit: { color: '#dcfce7' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 15 },
  label: { marginBottom: 5, color: '#4b5563' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, marginBottom: 15 },
  addButton: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  mealItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  mealName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  mealCalories: { color: '#16a34a', fontWeight: 'bold', marginRight: 10 },
  mealTime: { color: '#9ca3af', fontSize: 12 },
  deleteButton: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
  historyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#16a34a', elevation: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  dateText: { fontWeight: 'bold', fontSize: 16, color: '#374151' },
  caloriesText: { fontWeight: 'bold', color: '#16a34a' },
  historyItem: { color: '#6b7280', fontSize: 14 }
});