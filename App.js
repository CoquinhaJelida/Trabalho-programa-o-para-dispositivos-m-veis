import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import Header from './src/components/Header';
import MealsScreen from './src/screens/MealsScreen';
import WaterScreen from './src/screens/WaterScreen';
import ProfileScreen from './src/screens/ProfileScreen'; // Nova tela

export default function App() {
  // Define 'profile' como a tela inicial (padrão ao abrir)
  const [currentTab, setCurrentTab] = useState('profile');

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

          {/* MENU SUPERIOR: Perfil é o primeiro */}
          <View style={styles.tabContainer}>
            
            <TouchableOpacity
              onPress={() => setCurrentTab('profile')}
              style={[styles.tabButton, currentTab === 'profile' ? styles.activeTabGreen : styles.inactiveTab]}
            >
              <Feather name="user" size={20} color={currentTab === 'profile' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'profile' ? { color: '#fff' } : { color: '#4b5563' }]}>
                Perfil
              </Text>
            </TouchableOpacity>

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

          </View>

          {/* CONTEÚDO */}
          <View style={{ flex: 1 }}>
            {currentTab === 'profile' && <ProfileScreen />}
            {currentTab === 'meals' && <MealsScreen />}
            {currentTab === 'water' && <WaterScreen />}
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    elevation: 4, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  
  tabButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12 
  },
  
  activeTabGreen: { backgroundColor: '#16a34a' },
  activeTabBlue: { backgroundColor: '#2563eb' },
  inactiveTab: { backgroundColor: '#fff' },
  
  tabText: { fontWeight: '600', marginLeft: 8 },
});