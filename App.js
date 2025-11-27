import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Importação das Telas
import Header from './src/components/Header';
import MealsScreen from './src/screens/MealsScreen';
import WaterScreen from './src/screens/WaterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GalleryScreen from './src/screens/GalleryScreen'; // <--- Nova Importação

export default function App() {
  const [currentTab, setCurrentTab] = useState('profile');

  // Lógica para mudar a cor do tema baseado na aba
  const getThemeColor = () => {
    if (currentTab === 'water') return ['#eff6ff', '#dbeafe']; // Azul
    if (currentTab === 'gallery') return ['#f5f3ff', '#ede9fe']; // Roxo
    return ['#f0fdf4', '#eff6ff']; // Verde (Padrão)
  };

  const getStatusBarColor = () => {
    if (currentTab === 'water') return '#2563eb';
    if (currentTab === 'gallery') return '#7c3aed';
    return '#16a34a';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={getStatusBarColor()} />
      
      <LinearGradient colors={getThemeColor()} style={styles.background} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Header />

          {/* MENU SUPERIOR (Scrollável para caber tudo) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity onPress={() => setCurrentTab('profile')} style={[styles.tabButton, currentTab === 'profile' && styles.activeTabGreen]}>
              <Feather name="user" size={18} color={currentTab === 'profile' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'profile' && { color: '#fff' }]}>Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentTab('meals')} style={[styles.tabButton, currentTab === 'meals' && styles.activeTabGreen]}>
              <Feather name="coffee" size={18} color={currentTab === 'meals' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'meals' && { color: '#fff' }]}>Refeições</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentTab('water')} style={[styles.tabButton, currentTab === 'water' && styles.activeTabBlue]}>
              <Feather name="droplet" size={18} color={currentTab === 'water' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'water' && { color: '#fff' }]}>Água</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentTab('gallery')} style={[styles.tabButton, currentTab === 'gallery' && styles.activeTabPurple]}>
              <Feather name="camera" size={18} color={currentTab === 'gallery' ? '#fff' : '#4b5563'} />
              <Text style={[styles.tabText, currentTab === 'gallery' && { color: '#fff' }]}>Evolução</Text>
            </TouchableOpacity>
          </View>

          {/* CONTEÚDO */}
          <View style={{ flex: 1 }}>
            {currentTab === 'profile' && <ProfileScreen />}
            {currentTab === 'meals' && <MealsScreen />}
            {currentTab === 'water' && <WaterScreen />}
            {currentTab === 'gallery' && <GalleryScreen />}
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
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0' 
  },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  tabText: { fontWeight: '600', marginLeft: 4, fontSize: 12, color: '#4b5563' },
  
  activeTabGreen: { backgroundColor: '#16a34a' },
  activeTabBlue: { backgroundColor: '#2563eb' },
  activeTabPurple: { backgroundColor: '#7c3aed' },
});