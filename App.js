import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import Header from './src/components/Header';
import MealsScreen from './src/screens/MealsScreen';
import WaterScreen from './src/screens/WaterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import FastingScreen from './src/screens/FastingScreen'; // <--- NOVO

export default function App() {
  const [currentTab, setCurrentTab] = useState('profile');

  // Cores do tema
  const getThemeColor = () => {
    if (currentTab === 'water') return ['#eff6ff', '#dbeafe']; 
    if (currentTab === 'gallery') return ['#f5f3ff', '#ede9fe']; 
    if (currentTab === 'fasting') return ['#fffbeb', '#fef3c7']; // Amarelo para Jejum
    return ['#f0fdf4', '#eff6ff']; 
  };

  const getStatusBarColor = () => {
    if (currentTab === 'water') return '#2563eb';
    if (currentTab === 'gallery') return '#7c3aed';
    if (currentTab === 'fasting') return '#d97706';
    return '#16a34a';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={getStatusBarColor()} />
      <LinearGradient colors={getThemeColor()} style={styles.background} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Header />

          {/* MENU SCROLLÁVEL PARA CABER 5 ABAS */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexGrow: 1, justifyContent: 'space-around'}}>
              
              <TouchableOpacity onPress={() => setCurrentTab('profile')} style={[styles.tabBtn, currentTab === 'profile' && styles.activeTabGreen]}>
                <Feather name="user" size={18} color={currentTab === 'profile' ? '#fff' : '#4b5563'} />
                <Text style={[styles.tabText, currentTab === 'profile' && { color: '#fff' }]}>Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCurrentTab('meals')} style={[styles.tabBtn, currentTab === 'meals' && styles.activeTabGreen]}>
                <Feather name="coffee" size={18} color={currentTab === 'meals' ? '#fff' : '#4b5563'} />
                <Text style={[styles.tabText, currentTab === 'meals' && { color: '#fff' }]}>Refeições</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCurrentTab('water')} style={[styles.tabBtn, currentTab === 'water' && styles.activeTabBlue]}>
                <Feather name="droplet" size={18} color={currentTab === 'water' ? '#fff' : '#4b5563'} />
                <Text style={[styles.tabText, currentTab === 'water' && { color: '#fff' }]}>Água</Text>
              </TouchableOpacity>
              
              {/* NOVA ABA JEJUM */}
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
            {currentTab === 'profile' && <ProfileScreen />}
            {currentTab === 'meals' && <MealsScreen />}
            {currentTab === 'water' && <WaterScreen />}
            {currentTab === 'gallery' && <GalleryScreen />}
            {currentTab === 'fasting' && <FastingScreen />}
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
    flexDirection: 'row', backgroundColor: '#fff', elevation: 4, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0' 
  },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 15, alignItems: 'center', flexDirection: 'row' },
  tabText: { fontWeight: '600', marginLeft: 4, fontSize: 12, color: '#4b5563' },
  activeTabGreen: { backgroundColor: '#16a34a', borderRadius: 8, margin: 4 },
  activeTabBlue: { backgroundColor: '#2563eb', borderRadius: 8, margin: 4 },
  activeTabPurple: { backgroundColor: '#7c3aed', borderRadius: 8, margin: 4 },
  activeTabOrange: { backgroundColor: '#d97706', borderRadius: 8, margin: 4 },
});