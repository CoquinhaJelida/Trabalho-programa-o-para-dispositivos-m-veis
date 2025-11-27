import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Importação das Telas
import Header from './src/components/Header';
import MealsScreen from './src/screens/MealsScreen';
import BMIScreen from './src/screens/BMIScreen';
import WaterScreen from './src/screens/WaterScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState('meals');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={currentTab === 'water' ? '#2563eb' : '#16a34a'} 
      />
      
      <LinearGradient
        colors={currentTab === 'water' ? ['#eff6ff', '#dbeafe'] : ['#f0fdf4', '#eff6ff']}
        style={styles.background}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <Header />

          {/* --- MENU AGORA ESTÁ AQUI (TOPO) --- */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setCurrentTab('meals')}
              style={[styles.tabButton, currentTab === 'meals' ? styles.activeTabGreen : styles.inactiveTab]}
            >
              <Feather name="coffee" size={20} color={currentTab === 'meals' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'meals' ? { color: '#fff' } : { color: '#4b5563' }]}>
                Refeições
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentTab('water')}
              style={[styles.tabButton, currentTab === 'water' ? styles.activeTabBlue : styles.inactiveTab]}
            >
              <Feather name="droplet" size={20} color={currentTab === 'water' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'water' ? { color: '#fff' } : { color: '#4b5563' }]}>
                Água
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentTab('bmi')}
              style={[styles.tabButton, currentTab === 'bmi' ? styles.activeTabGreen : styles.inactiveTab]}
            >
              <Feather name="activity" size={20} color={currentTab === 'bmi' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'bmi' ? { color: '#fff' } : { color: '#4b5563' }]}>
                IMC
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- CONTEÚDO AGORA ESTÁ AQUI (BAIXO) --- */}
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
  
  // Ajustei o estilo para ficar bonito no topo
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    elevation: 4, // Sombra para baixo
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderBottomWidth: 1, // Linha divisória embaixo
    borderBottomColor: '#f0f0f0' 
  },
  
  tabButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12 // Diminuí um pouco a altura para ficar mais elegante no topo
  },
  
  activeTabGreen: { backgroundColor: '#16a34a' },
  activeTabBlue: { backgroundColor: '#2563eb' },
  inactiveTab: { backgroundColor: '#fff' },
  
  tabText: { fontWeight: '600', marginLeft: 8 },
});