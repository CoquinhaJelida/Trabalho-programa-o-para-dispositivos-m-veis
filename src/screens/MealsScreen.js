import React, { useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function MealsScreen() {
  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');

  const caloriesInputRef = useRef(null);

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
      Alert.alert("Erro", "Preencha o nome e um valor válido para as calorias!");
    }
  };

  const deleteMeal = (id) => {
    setMeals(meals.filter(meal => meal.id !== id));
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    // ScrollView adicionado aqui para permitir rolagem
    <ScrollView 
      contentContainerStyle={styles.scrollContainer} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL DE HOJE</Text>
        <Text style={styles.summaryValue}>{totalCalories}</Text>
        <Text style={styles.summaryUnit}>calorias</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Adicionar Refeição</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome da Refeição</Text>
          <TextInput
            style={styles.input}
            value={mealName}
            onChangeText={setMealName}
            placeholder="Ex: Almoço"
            returnKeyType="next"
            onSubmitEditing={() => caloriesInputRef.current.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Calorias</Text>
          <TextInput
            ref={caloriesInputRef}
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="Ex: 450"
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={addMeal}
          />
        </View>

        <TouchableOpacity onPress={addMeal} style={styles.addButton}>
          <Feather name="plus" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cardTitle}>Refeições de Hoje</Text>
      
      {meals.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="coffee" size={48} color="#9ca3af" style={{ opacity: 0.5, marginBottom: 12 }} />
          <Text style={styles.emptyStateText}>Nenhuma refeição registrada</Text>
        </View>
      ) : (
        <View style={{ paddingBottom: 40 }}>
          {meals.map((item) => (
            <View key={item.id} style={styles.mealItem}>
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
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 24, flexGrow: 1 },
  summaryCard: { borderRadius: 16, padding: 24, marginBottom: 24, elevation: 6 },
  summaryLabel: { color: '#dcfce7', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  summaryValue: { fontSize: 40, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  summaryUnit: { color: '#dcfce7', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  addButton: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginTop: 8 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  emptyState: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyStateText: { color: '#9ca3af' },
  mealItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  mealName: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  mealMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  mealCalories: { color: '#16a34a', fontWeight: 'bold', marginRight: 12 },
  mealTime: { color: '#9ca3af', fontSize: 14 },
  deleteButton: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
});