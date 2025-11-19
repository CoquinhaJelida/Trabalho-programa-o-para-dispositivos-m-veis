import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, ScrollView, 
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Importação dos componentes que criamos
import Header from './src/components/Header';
import MealsScreen from './src/screens/MealsScreen';
import BMIScreen from './src/screens/BMIScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState('meals');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
      
      {/* Fundo Geral */}
      <LinearGradient
        colors={['#f0fdf4', '#eff6ff']}
        style={styles.background}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          
          {/* Componente Header Importado */}
          <Header />

          {/* Abas de Navegação */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setCurrentTab('meals')}
              style={[styles.tabButton, currentTab === 'meals' ? styles.activeTab : styles.inactiveTab]}
            >
              <Feather name="coffee" size={20} color={currentTab === 'meals' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'meals' ? { color: '#fff' } : { color: '#4b5563' }]}>
                Refeições
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentTab('bmi')}
              style={[styles.tabButton, currentTab === 'bmi' ? styles.activeTab : styles.inactiveTab]}
            >
              <Feather name="activity" size={20} color={currentTab === 'bmi' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'bmi' ? { color: '#fff' } : { color: '#4b5563' }]}>
                IMC
              </Text>
            </TouchableOpacity>
          </View>

          {/* Renderização Condicional das Telas */}
          <View>
            {currentTab === 'meals' ? <MealsScreen /> : <BMIScreen />}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderBottomWidth: 4 },
  activeTab: { backgroundColor: '#16a34a', borderBottomColor: '#15803d' },
  inactiveTab: { backgroundColor: '#fff', borderBottomColor: 'transparent' },
  tabText: { fontWeight: '600', marginLeft: 8 },
});