import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Keyboard 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getProfile, saveDailyLog, getDayLog, getTodayKey, getWaterStreak, addXP } from '../services/db';

const WaterScreen = ({ onGainXP, theme }) => {
  const [goal, setGoal] = useState(0);
  const [consumed, setConsumed] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);
  const [streak, setStreak] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  
  // useRef para guardar valores sem renderizar a tela (Performance)
  const currentConsumed = useRef(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    getProfile((data) => {
      if (data && data.weight) {
        setGoal(parseFloat(data.weight) * 35);
        setHasProfile(true);
      }
    });
    
    getDayLog(getTodayKey(), (data) => {
      const val = data.water || 0;
      setConsumed(val);
      currentConsumed.current = val;
    });

    getWaterStreak(setStreak);
  };

  const addWater = (amount) => {
    // 1. Atualiza visual IMEDIATAMENTE (Otimista)
    const newTotal = currentConsumed.current + amount;
    setConsumed(newTotal);
    currentConsumed.current = newTotal;

    // 2. Salva no banco sem await (Fire and forget) para não travar a UI
    saveDailyLog(getTodayKey(), { water: newTotal, goal: goal });
    
    // 3. Atualiza streak e XP de forma isolada
    // Pequeno delay para garantir que a animação de clique do botão termine antes do processamento
    setTimeout(() => {
      getWaterStreak(setStreak);
      addXP(5, (newStats, leveledUp) => {
        if (onGainXP) onGainXP(5, "Hidratação");
        if (leveledUp) Alert.alert("LEVEL UP! 💧", `Nível ${newStats.level} alcançado!`);
      });
    }, 50);
  };

  const handleAddCustom = () => {
    const amount = parseFloat(customAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      Alert.alert("Erro", "Valor inválido.");
      return;
    }
    addWater(amount);
    setCustomAmount('');
    Keyboard.dismiss();
  };

  const resetDay = () => {
    setConsumed(0);
    currentConsumed.current = 0;
    saveDailyLog(getTodayKey(), { water: 0, goal: goal });
    setStreak(0);
  };

  const percentage = goal > 0 ? (consumed / goal) * 100 : 0;
  const waterHeight = Math.min(percentage, 100); 

  // Estilos dinâmicos (Calculados apenas quando o tema muda)
  const glassStyle = [styles.glassContainer, { backgroundColor: theme.isDark ? '#1e3a8a' : '#e0f2fe', borderColor: theme.isDark ? '#172554' : '#bae6fd' }];
  const cardStyle = [styles.card, { backgroundColor: theme.card }];
  const textMainStyle = { color: theme.text };
  const textSubStyle = { color: theme.textSub };
  const inputStyle = [styles.customInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }];
  const btnQuickStyle = [styles.quickButton, { backgroundColor: theme.inputBg, borderColor: theme.border }];
  const streakStyle = [styles.streakCard, { backgroundColor: theme.isDark ? '#451a03' : '#fff7ed', borderColor: theme.isDark ? '#78350f' : '#ffedd5' }];
  const streakIconStyle = [styles.streakIcon, { backgroundColor: theme.isDark ? '#78350f' : '#fef3c7' }];
  const streakTitleStyle = [styles.streakTitle, { color: theme.isDark ? '#fcd34d' : '#92400e' }];
  const streakTextStyle = [styles.streakText, { color: theme.isDark ? '#fbbf24' : '#b45309' }];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      {!hasProfile ? (
        <View style={[styles.warningCard, { backgroundColor: theme.card }]}>
          <Text style={textMainStyle}>Configure seu peso no Perfil primeiro.</Text>
        </View>
      ) : (
        <View>
          <View style={glassStyle}>
            <View style={[styles.water, { height: `${waterHeight}%` }]} />
            <View style={styles.overlay}>
              <Feather name="droplet" size={40} color={percentage > 50 ? '#fff' : '#3b82f6'} />
              <Text style={[styles.percentageText, percentage > 50 && { color: '#fff' }]}>{percentage.toFixed(0)}%</Text>
              <Text style={[styles.mlText, percentage > 50 ? { color: '#e0f2fe' } : { color: '#1e40af' }]}>{consumed} / {goal.toFixed(0)} ml</Text>
            </View>
          </View>

          <View style={cardStyle}>
            <Text style={[styles.cardTitle, textMainStyle]}>Adicionar Água</Text>
            
            <View style={styles.buttonGrid}>
              {[200, 300, 500].map(v => (
                <TouchableOpacity key={v} style={btnQuickStyle} onPress={() => addWater(v)}>
                  <Text style={styles.quickButtonText}>+{v}ml</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customRow}>
              <TextInput 
                style={inputStyle} 
                placeholder="Outra qtd (ml)" 
                placeholderTextColor={theme.textSub} 
                keyboardType="numeric" 
                value={customAmount} 
                onChangeText={setCustomAmount} 
              />
              <TouchableOpacity style={styles.customBtn} onPress={handleAddCustom}>
                <Feather name="plus" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.resetButton, { backgroundColor: theme.inputBg }]} onPress={resetDay}>
              <Text style={[styles.resetButtonText, textSubStyle]}>Zerar Dia</Text>
            </TouchableOpacity>
          </View>

          {streak > 0 && (
            <View style={streakStyle}>
              <View style={streakIconStyle}><Feather name="zap" size={24} color="#f59e0b" /></View>
              <View style={{flex: 1}}>
                <Text style={streakTitleStyle}>Sequência Incrível!</Text>
                <Text style={streakTextStyle}>Parabéns, você está há <Text style={{fontWeight: 'bold', color: '#f59e0b'}}>{streak} dias</Text> hidratado!</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

// --- BLINDAGEM ---
// Essa função compara se as props mudaram. Se retornar TRUE, o componente NÃO renderiza.
// Só renderiza se o ID do tema mudar (light/dark). Ignora atualizações de funções.
function propsAreEqual(prev, next) {
  return prev.theme.background === next.theme.background;
}

export default React.memo(WaterScreen, propsAreEqual);

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  warningCard: { padding: 20, borderRadius: 16, alignItems: 'center' },
  card: { borderRadius: 16, padding: 24, elevation: 3, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  glassContainer: { height: 280, borderRadius: 20, overflow: 'hidden', borderWidth: 4, marginBottom: 24, position: 'relative' },
  water: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#3b82f6', width: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  percentageText: { fontSize: 48, fontWeight: 'bold' },
  mlText: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  buttonGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  quickButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  quickButtonText: { color: '#2563eb', fontWeight: 'bold' },
  customRow: { flexDirection: 'row', marginBottom: 15 },
  customInput: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 16, marginRight: 10 },
  customBtn: { backgroundColor: '#3b82f6', width: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resetButton: { padding: 12, alignItems: 'center', borderRadius: 10 },
  resetButtonText: { fontWeight: '600' },
  streakCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  streakIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  streakTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  streakText: { fontSize: 13, flexWrap: 'wrap' }
});