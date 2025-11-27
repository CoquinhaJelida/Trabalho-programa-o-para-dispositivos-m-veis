import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ScrollView } from 'react-native';

export default function BMIScreen() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);

  const calculateBMI = () => {
    if (weight && height && !isNaN(weight) && !isNaN(height)) {
      const heightInMeters = parseFloat(height) / 100;
      const bmiValue = parseFloat(weight) / (heightInMeters * heightInMeters);
      setBmi(bmiValue.toFixed(1));
      Keyboard.dismiss();
    }
  };

  const getBMICategory = (bmiValue) => {
    if (bmiValue < 18.5) return { text: 'Abaixo do peso', color: '#2563eb' };
    if (bmiValue < 25) return { text: 'Peso normal', color: '#16a34a' };
    if (bmiValue < 30) return { text: 'Sobrepeso', color: '#ca8a04' };
    return { text: 'Obesidade', color: '#dc2626' };
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calculadora de IMC</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Ex: 70"
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            placeholder="Ex: 175"
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={calculateBMI}
          />
        </View>

        <TouchableOpacity onPress={calculateBMI} style={styles.addButton}>
          <Text style={styles.addButtonText}>Calcular IMC</Text>
        </TouchableOpacity>

        {bmi && (
          <View style={styles.bmiResultCard}>
            <Text style={styles.bmiLabel}>SEU IMC</Text>
            <Text style={styles.bmiValue}>{bmi}</Text>
            <Text style={[styles.bmiCategory, { color: getBMICategory(parseFloat(bmi)).color }]}>
              {getBMICategory(parseFloat(bmi)).text}
            </Text>
            
            <View style={styles.bmiTable}>
               <Text style={styles.bmiTableText}>Normal: 18.5 - 24.9</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 24, flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  addButton: { backgroundColor: '#16a34a', alignItems: 'center', padding: 14, borderRadius: 12, marginTop: 8 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  bmiResultCard: { marginTop: 24, padding: 24, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 2, borderColor: '#bbf7d0' },
  bmiLabel: { textAlign: 'center', color: '#4b5563', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  bmiValue: { textAlign: 'center', fontSize: 48, fontWeight: 'bold', color: '#1f2937', marginVertical: 8 },
  bmiCategory: { textAlign: 'center', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  bmiTable: { alignItems: 'center', marginTop: 8 },
  bmiTableText: { color: '#6b7280', fontSize: 14 }
});