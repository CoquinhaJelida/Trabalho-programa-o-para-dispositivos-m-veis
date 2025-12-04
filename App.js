import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Modal, Animated, ActivityIndicator, ImageBackground 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { getProfile, getBackgroundImage } from './src/services/db'; 

import Header from './src/components/Header';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MealsScreen from './src/screens/MealsScreen';
import WaterScreen from './src/screens/WaterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import FastingScreen from './src/screens/FastingScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';

import { motivationalMessages } from './src/data/motivation';
import { lightTheme, darkTheme } from './src/theme/colors';

const THEME_PREF_KEY = '@theme_preference';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customBg, setCustomBg] = useState(null);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [headerProfileImage, setHeaderProfileImage] = useState(null);

  const [showMotivation, setShowMotivation] = useState(false);
  const [todaysMessage, setTodaysMessage] = useState('');
  const [xpNotification, setXpNotification] = useState({ visible: false, amount: 0, message: '' });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // Carrega configurações de TEMA (Isso é global do aparelho, ok manter aqui)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (savedTheme !== null) setIsDarkMode(savedTheme === 'dark');
      } catch (e) {}
    };
    loadSettings();
  }, []);

  // --- LÓGICA DE AUTENTICAÇÃO E LIMPEZA ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      
      if (authenticatedUser) {
        // SE ENTROU: Carrega os dados do usuário
        getProfile((data) => {
          if (data && data.photo) setHeaderProfileImage(data.photo);
          else setHeaderProfileImage(null); // Garante que reseta se não tiver foto
        });
        getBackgroundImage(setCustomBg);
      } else {
        // SE SAIU: Limpa tudo da memória visual para não vazar pro próximo
        setHeaderProfileImage(null);
        setCustomBg(null);
        setCurrentTab('home'); // Reseta a aba
      }
      
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateProfile = (uri) => setHeaderProfileImage(uri);
  const handleUpdateBg = (uri) => setCustomBg(uri);

  const toggleTheme = async () => { const newMode = !isDarkMode; setIsDarkMode(newMode); await AsyncStorage.setItem(THEME_PREF_KEY, newMode ? 'dark' : 'light'); };
  
  const handleGainXP = (amount, message = '') => {
    setXpNotification({ visible: true, amount, message });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 20, friction: 5, useNativeDriver: true })
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -50, duration: 300, useNativeDriver: true })
      ]).start(() => { setXpNotification({ visible: false, amount: 0, message: '' }); });
    }, 2500);
  };

  useEffect(() => { if(Platform.OS==='android'){NavigationBar.setVisibilityAsync('hidden'); NavigationBar.setBehaviorAsync('overlay-swipe'); NavigationBar.setBackgroundColorAsync('#ffffff00');} }, []);
  useEffect(() => { if(user && motivationalMessages.length>0){const r = Math.floor(Math.random()*motivationalMessages.length); setTodaysMessage(motivationalMessages[r]); setShowMotivation(true);} }, [user]);
  
  const getThemeColor = () => { if(currentTab==='water')return['#eff6ff','#dbeafe']; if(currentTab==='gallery')return['#f5f3ff','#ede9fe']; if(currentTab==='fasting')return['#fffbeb','#fef3c7']; if(currentTab==='community')return['#f0f9ff','#e0f2fe']; if(currentTab==='challenges')return['#fff7ed','#ffedd5']; return['#f0fdf4','#eff6ff']; };
  const getStatusBarColor = () => { if(currentTab==='water')return'#2563eb'; if(currentTab==='gallery')return'#7c3aed'; if(currentTab==='fasting')return'#d97706'; if(currentTab==='community')return'#0284c7'; if(currentTab==='challenges')return'#b45309'; return'#16a34a'; };

  if (loadingAuth) return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:theme.background}}><ActivityIndicator size="large" color={theme.primary}/></View>;
  if (!user) return <LoginScreen />;

  const BackgroundWrapper = ({ children }) => {
    if (customBg) return <View style={{ flex: 1 }}><ImageBackground source={{ uri: customBg }} style={{position:'absolute', width:'100%', height:'100%'}} resizeMode="cover" /><View style={{ flex: 1, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.4)' }}>{children}</View></View>;
    if (isDarkMode) return <View style={[styles.background, { backgroundColor: theme.background }]}>{children}</View>;
    return <LinearGradient colors={getThemeColor()} style={styles.background}>{children}</LinearGradient>;
  };
  const ImageBackground = require('react-native').ImageBackground;

  return (
    <SafeAreaProvider>
      <SafeAreaContext style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={theme.statusText} backgroundColor="transparent" translucent />
        <BackgroundWrapper>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              
              <Header 
                onProfileClick={() => setCurrentTab('profile')} 
                toggleTheme={toggleTheme} 
                isDarkMode={isDarkMode} 
                theme={theme} 
                profileImage={headerProfileImage} 
              />

              <View style={[styles.tabContainer, { backgroundColor: customBg ? 'rgba(255,255,255,0.8)' : theme.tabBar, borderBottomColor: theme.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexGrow: 1}}>
                  {[{id:'home', icon:'home', label:'Início'},{id:'profile', icon:'user', label:'Perfil'},{id:'meals', icon:'coffee', label:'Refeições'},{id:'challenges', icon:'award', label:'Desafios'},{id:'community', icon:'users', label:'Social'},{id:'water', icon:'droplet', label:'Água'},{id:'fasting', icon:'clock', label:'Jejum'},{id:'gallery', icon:'camera', label:'Galeria'}].map(tab => (
                    <TouchableOpacity key={tab.id} onPress={() => setCurrentTab(tab.id)} style={[styles.tabBtn, currentTab === tab.id && { backgroundColor: theme.primary + '20' }]}>
                      <Feather name={tab.icon} size={18} color={currentTab === tab.id ? theme.primary : theme.tabIcon} />
                      <Text style={[styles.tabText, { color: currentTab === tab.id ? theme.primary : theme.tabIcon }]}>{tab.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flex: 1 }}>
                {currentTab === 'home' && <HomeScreen changeTab={setCurrentTab} theme={theme} />}
                {currentTab === 'profile' && <ProfileScreen theme={theme} onUpdateBg={handleUpdateBg} onUpdateProfile={handleUpdateProfile} />}
                {currentTab === 'meals' && <MealsScreen onGainXP={handleGainXP} theme={theme} />}
                {currentTab === 'water' && <WaterScreen onGainXP={handleGainXP} theme={theme} />}
                {currentTab === 'gallery' && <GalleryScreen theme={theme} />}
                {currentTab === 'fasting' && <FastingScreen onGainXP={handleGainXP} theme={theme} />}
                {currentTab === 'community' && <CommunityScreen theme={theme} />}
                {currentTab === 'challenges' && <ChallengesScreen onGainXP={handleGainXP} theme={theme} />}
              </View>
            </View>
          </KeyboardAvoidingView>
        </BackgroundWrapper>
        {xpNotification.visible && (<Animated.View style={[styles.xpToast, { opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: theme.card, shadowColor: theme.text }]}><View style={styles.xpBadge}><Feather name="star" size={16} color="#fff" /></View><Text style={[styles.xpText, {color: theme.text}]}>+{xpNotification.amount} XP</Text>{xpNotification.message ? <Text style={[styles.xpSubText, {color: theme.textSub}]}>| {xpNotification.message}</Text> : null}</Animated.View>)}
        <Modal visible={showMotivation} transparent={true} animationType="fade"><View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}><View style={styles.iconCircle}><Feather name="sun" size={32} color="#f59e0b" /></View><Text style={[styles.modalTitle, { color: theme.textSub }]}>Mensagem do Dia</Text><Text style={[styles.modalText, { color: theme.text }]}>"{todaysMessage}"</Text><TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primary }]} onPress={() => setShowMotivation(false)}><Text style={styles.modalButtonText}>VAMOS LÁ! 💪</Text></TouchableOpacity></View></View></Modal>
      </SafeAreaContext>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  fixedBackground: { position: 'absolute', width: '100%', height: '100%' },
  tabContainer: { flexDirection: 'row', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, borderBottomWidth: 1 },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 15, alignItems: 'center', flexDirection: 'row', borderRadius: 8, margin: 4 },
  tabText: { fontWeight: '600', marginLeft: 4, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '85%', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 10 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  modalText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 25, fontStyle: 'italic', lineHeight: 28 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25, elevation: 3 },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  xpToast: { position: 'absolute', top: 110, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, elevation: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999 },
  xpBadge: { backgroundColor: '#f59e0b', borderRadius: 15, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  xpText: { fontWeight: 'bold', fontSize: 16 },
  xpSubText: { fontSize: 14, marginLeft: 8, fontWeight: '600' }
});