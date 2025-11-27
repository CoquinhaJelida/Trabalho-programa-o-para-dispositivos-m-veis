import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import Header from './src/components/Header';
import MealsScreen from './src/screens/MealsScreen';
import BMIScreen from './src/screens/BMIScreen';
import WaterScreen from './src/screens/WaterScreen'; // Novo Import

export default function App() {
  const [currentTab, setCurrentTab] = useState('meals');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
      <LinearGradient colors={['#f0fdf4', '#eff6ff']} style={styles.background} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Header />

          {/* Abas de Navegação (Scrollável horizontalmente se precisar) */}
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => setCurrentTab('meals')}
                style={[styles.tabButton, currentTab === 'meals' && styles.activeTabGreen]}
              >
                <Feather name="coffee" size={20} color={currentTab === 'meals' ? '#fff' : '#4b5563'} />
                <Text style={[styles.tabText, currentTab === 'meals' ? { color: '#fff' } : { color: '#4b5563' }]}>Refeições</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentTab('water')}
                style={[styles.tabButton, currentTab === 'water' && styles.activeTabBlue]}
              >
                <Feather name="droplet" size={20} color={currentTab === 'water' ? '#fff' : '#4b5563'} />
                <Text style={[styles.tabText, currentTab === 'water' ? { color: '#fff' } : { color: '#4b5563' }]}>Água</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentTab('bmi')}
                style={[styles.tabButton, currentTab === 'bmi' && styles.activeTabGreen]}
              >
                <Feather name="activity" size={20} color={currentTab === 'bmi' ? '#fff' : '#4b5563'} />
                <Text style={[styles.tabText, currentTab === 'bmi' ? { color: '#fff' } : { color: '#4b5563' }]}>IMC</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Conteúdo */}
          <View style={{ flex: 1 }}>
            {currentTab === 'meals' && <MealsScreen />}
            {currentTab === 'water' && <WaterScreen />}
            {currentTab === 'bmi' && <BMIScreen />}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2, paddingHorizontal: 10 },
  tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 4, borderBottomColor: 'transparent' },
  activeTabGreen: { backgroundColor: '#16a34a', borderBottomColor: '#15803d' },
  activeTabBlue: { backgroundColor: '#3b82f6', borderBottomColor: '#1d4ed8' },
  tabText: { fontWeight: '600', marginLeft: 8 },
});