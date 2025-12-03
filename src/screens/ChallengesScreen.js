import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getWaterStreak, getGlobalStats, getChallengeStatus, claimChallengeReward } from '../services/db';
// IMPORTAÇÃO CENTRALIZADA
import { QUESTS } from '../data/quests';

export default function ChallengesScreen({ onGainXP }) {
  const [claimedQuests, setClaimedQuests] = useState({});
  const [stats, setStats] = useState({
    waterStreak: 0,
    totalMeals: 0,
    totalFasts: 0,
    maxFastingTime: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRefreshing(true);
    getChallengeStatus(setClaimedQuests);
    getWaterStreak((streak) => {
      getGlobalStats((globalData) => {
        setStats({
          waterStreak: streak || 0,
          totalMeals: globalData?.totalMeals || 0,
          totalFasts: globalData?.totalFasts || 0,
          maxFastingTime: globalData?.maxFastingTime || 0
        });
        setRefreshing(false);
      });
    });
  };

  const handleClaim = (quest) => {
    claimChallengeReward(quest.id, quest.xp, (newStats, leveledUp) => {
      setClaimedQuests(prev => ({ ...prev, [quest.id]: true }));
      if (onGainXP) onGainXP(quest.xp, `Desafio: ${quest.title}`);
      Alert.alert("Recompensa Resgatada!", `Você ganhou +${quest.xp} XP. \n${leveledUp ? 'SUBIU DE NÍVEL! 🎉' : 'Medalha adicionada ao Perfil!'}`);
    });
  };

  const getProgress = (quest) => {
    let current = 0;
    switch (quest.type) {
      case 'water_streak': current = stats.waterStreak; break;
      case 'total_meals': current = stats.totalMeals; break;
      case 'total_fasts': current = stats.totalFasts; break;
      case 'max_fast_time': current = stats.maxFastingTime; break;
    }
    return Math.min(current, quest.target);
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Central de Desafios</Text>
        <Text style={styles.subtitle}>Complete missões para subir de nível.</Text>
      </View>

      <View style={styles.list}>
        {QUESTS.map(quest => {
          const current = getProgress(quest);
          const progressPercent = (current / quest.target) * 100;
          const isCompleted = current >= quest.target;
          const isClaimed = claimedQuests[quest.id];

          return (
            <View key={quest.id} style={[styles.card, isClaimed && styles.cardClaimed]}>
              <View style={styles.cardHeader}>
                <LinearGradient colors={isClaimed ? ['#ccc', '#999'] : quest.color} style={styles.iconBox}>
                  <Feather name={quest.icon || "star"} size={24} color="#fff" />
                </LinearGradient>
                <View style={{flex: 1}}>
                  <Text style={[styles.questTitle, isClaimed && {color: '#999', textDecorationLine: 'line-through'}]}>{quest.title}</Text>
                  <Text style={styles.questDesc}>{quest.desc}</Text>
                </View>
                {!isClaimed && <View style={styles.xpBadge}><Text style={styles.xpText}>+{quest.xp} XP</Text></View>}
              </View>

              {!isClaimed && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <LinearGradient 
                      colors={quest.color} 
                      style={[styles.progressBarFill, { width: `${progressPercent}%` }]} 
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {quest.type === 'max_fast_time' 
                      ? `${(current/3600).toFixed(1)}h / ${(quest.target/3600).toFixed(0)}h`
                      : `${current} / ${quest.target}`
                    }
                  </Text>
                </View>
              )}

              {isCompleted && !isClaimed && (
                <TouchableOpacity style={styles.claimBtn} onPress={() => handleClaim(quest)}>
                  <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.claimGradient}>
                    <Text style={styles.claimText}>RESGATAR RECOMPENSA</Text>
                    <Feather name="gift" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {isClaimed && (
                <View style={styles.claimedTag}>
                  <Text style={styles.claimedText}>Concluído</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  list: { gap: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, elevation: 3 },
  cardClaimed: { opacity: 0.7, backgroundColor: '#f9fafb', elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  questTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  questDesc: { fontSize: 12, color: '#666', maxWidth: '90%' },
  xpBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  xpText: { fontSize: 10, fontWeight: 'bold', color: '#d97706' },
  progressContainer: { marginTop: 5 },
  progressBarBg: { height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden', marginBottom: 5 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressText: { fontSize: 10, color: '#666', textAlign: 'right', fontWeight: 'bold' },
  claimBtn: { marginTop: 15, borderRadius: 12, overflow: 'hidden' },
  claimGradient: { padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  claimText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  claimedTag: { marginTop: 10, alignItems: 'center', padding: 8, backgroundColor: '#e5e7eb', borderRadius: 8 },
  claimedText: { color: '#666', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
});