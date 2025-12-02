import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar'; 

// Importação das Telas
import Header from './src/components/Header';
import HomeScreen from './src/screens/HomeScreen';
import MealsScreen from './src/screens/MealsScreen';
import WaterScreen from './src/screens/WaterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import FastingScreen from './src/screens/FastingScreen';
import CommunityScreen from './src/screens/CommunityScreen'; // <--- ELA VOLTOU!

// Importação das Frases
import { motivationalMessages } from './src/data/motivation';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [showMotivation, setShowMotivation] = useState(false);
  const [todaysMessage, setTodaysMessage] = useState('');

  // --- CONFIGURAÇÃO PARA ESCONDER A BARRA DE NAVEGAÇÃO ---
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setBackgroundColorAsync('#ffffff00'); 
    }
  }, []);

  useEffect(() => {
    if (motivationalMessages && motivationalMessages.length > 0) {
      const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
      setTodaysMessage(motivationalMessages[randomIndex]);
      setShowMotivation(true);
    }
  }, []);

  const getThemeColor = () => {
    if (currentTab === 'water') return ['#eff6ff', '#dbeafe']; 
    if (currentTab === 'gallery') return ['#f5f3ff', '#ede9fe']; 
    if (currentTab === 'fasting') return ['#fffbeb', '#fef3c7']; 
    if (currentTab === 'community') return ['#f0f9ff', '#e0f2fe']; // Azulzinho da comunidade
    return ['#f0fdf4', '#eff6ff']; 
  };

  const getStatusBarColor = () => {
    if (currentTab === 'water') return '#2563eb';
    if (currentTab === 'gallery') return '#7c3aed';
    if (currentTab === 'fasting') return '#d97706';
    if (currentTab === 'community') return '#0284c7';
    return '#16a34a';
  };

  return (
    <SafeAreaProvider>
      <SafeAreaContext style={styles.container} edges={['top', 'left', 'right']}>
        
        <StatusBar barStyle="light-content" backgroundColor={getStatusBarColor()} />
        <LinearGradient colors={getThemeColor()} style={styles.background} />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Header />

            {/* MENU SUPERIOR */}
            <View style={styles.tabContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexGrow: 1}}>
                
                <TouchableOpacity onPress={() => setCurrentTab('home')} style={[styles.tabBtn, currentTab === 'home' && styles.activeTabGreen]}>
                  <Feather name="home" size={18} color={currentTab === 'home' ? '#fff' : '#4b5563'} />
                  <Text style={[styles.tabText, currentTab === 'home' && { color: '#fff' }]}>Início</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrentTab('profile')} style={[styles.tabBtn, currentTab === 'profile' && styles.activeTabGreen]}>
                  <Feather name="user" size={18} color={currentTab === 'profile' ? '#fff' : '#4b5563'} />
                  <Text style={[styles.tabText, currentTab === 'profile' && { color: '#fff' }]}>Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrentTab('meals')} style={[styles.tabBtn, currentTab === 'meals' && styles.activeTabGreen]}>
                  <Feather name="coffee" size={18} color={currentTab === 'meals' ? '#fff' : '#4b5563'} />
                  <Text style={[styles.tabText, currentTab === 'meals' && { color: '#fff' }]}>Refeições</Text>
                </TouchableOpacity>
                
                {/* ABA SOCIAL / COMUNIDADE */}
                <TouchableOpacity onPress={() => setCurrentTab('community')} style={[styles.tabBtn, currentTab === 'community' && styles.activeTabCommunity]}>
                  <Feather name="users" size={18} color={currentTab === 'community' ? '#fff' : '#4b5563'} />
                  <Text style={[styles.tabText, currentTab === 'community' && { color: '#fff' }]}>Social</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrentTab('water')} style={[styles.tabBtn, currentTab === 'water' && styles.activeTabBlue]}>
                  <Feather name="droplet" size={18} color={currentTab === 'water' ? '#fff' : '#4b5563'} />
                  <Text style={[styles.tabText, currentTab === 'water' && { color: '#fff' }]}>Água</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrentTab('fasting')} style={[styles.tabBtn, currentTab === 'fasting' && styles.activeTabOrange]}>
                  <Feather name="clock" size={18} color={currentTab === 'fasting' ? '#fff' : '#4b5563'} />
                  <Text style={[styles.tabText, currentTab === 'fasting' && { color: '#fff' }]}>Jejum</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrentTab('gallery')} style={[styles.tabBtn, currentTab === 'gallery' && styles.activeTabPurple]}>
                  <Feather name="camera" size={18} color={currentTab === 'gallery' ? '#fff' : '#4b5563'} />
                  <Text style={[styles.tabText, currentTab === 'gallery' && { color: '#fff' }]}>Galeria</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={{ flex: 1 }}>
              {currentTab === 'home' && <HomeScreen changeTab={setCurrentTab} />}
              {currentTab === 'profile' && <ProfileScreen />}
              {currentTab === 'meals' && <MealsScreen />}
              {currentTab === 'water' && <WaterScreen />}
              {currentTab === 'gallery' && <GalleryScreen />}
              {currentTab === 'fasting' && <FastingScreen />}
              {currentTab === 'community' && <CommunityScreen />}
            </View>

          </View>
        </KeyboardAvoidingView>

        {/* POP-UP MOTIVACIONAL */}
        <Modal visible={showMotivation} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.iconCircle}>
                <Feather name="sun" size={32} color="#f59e0b" />
              </View>
              <Text style={styles.modalTitle}>Mensagem do Dia</Text>
              <Text style={styles.modalText}>"{todaysMessage}"</Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowMotivation(false)}>
                <Text style={styles.modalButtonText}>VAMOS LÁ! 💪</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaContext>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 15, alignItems: 'center', flexDirection: 'row' },
  tabText: { fontWeight: '600', marginLeft: 4, fontSize: 12, color: '#4b5563' },
  
  activeTabGreen: { backgroundColor: '#16a34a', borderRadius: 8, margin: 4 },
  activeTabBlue: { backgroundColor: '#2563eb', borderRadius: 8, margin: 4 },
  activeTabPurple: { backgroundColor: '#7c3aed', borderRadius: 8, margin: 4 },
  activeTabOrange: { backgroundColor: '#d97706', borderRadius: 8, margin: 4 },
  activeTabCommunity: { backgroundColor: '#0284c7', borderRadius: 8, margin: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '85%', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 10 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  modalText: { fontSize: 20, fontWeight: 'bold', color: '#374151', textAlign: 'center', marginBottom: 25, fontStyle: 'italic', lineHeight: 28 },
  modalButton: { backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25, elevation: 3 },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});