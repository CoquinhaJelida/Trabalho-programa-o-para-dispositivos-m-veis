import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as ImagePicker from 'expo-image-picker';
import { saveProfile, getProfile, getHistory, getDayLog, getTodayKey, getCalorieStreak, deleteDailyLog, getChallengeStatus, getUserStats, saveBackgroundImage } from '../services/db';
import { QUESTS } from '../data/quests';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function ProfileScreen({ theme, onUpdateBg }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [targetWeight, setTargetWeight] = useState(''); 
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState(1.2);
  const [objective, setObjective] = useState('maintain');
  
  // ESTADO DOS MACROS
  const [macros, setMacros] = useState({ p: 0, c: 0, f: 0 });
  
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [isStrict, setIsStrict] = useState(false); 
  const [calorieStreak, setCalorieStreak] = useState({ status: 'good', count: 0 });
  const [userStats, setUserStats] = useState({ level: 1, currentXP: 0, nextLevelXP: 100 });

  const [todayCalories, setTodayCalories] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [history, setHistory] = useState({});
  const [expandedDate, setExpandedDate] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState({});

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = () => {
    getProfile((data) => {
      if (data) {
        setName(data.name || ''); setAge(data.age || ''); setWeight(data.weight || ''); setHeight(data.height || '');
        setCalorieGoal(data.calorieGoal || '2000'); setIsStrict(data.isStrict || false); setTargetWeight(data.targetWeight || '');
        setGender(data.gender || 'male'); setActivityLevel(data.activityLevel || 1.2); setObjective(data.objective || 'maintain');
        // Calcula os macros iniciais baseados na meta salva
        calculateMacros(data.calorieGoal || '2000', data.objective || 'maintain');
      }
    });
    getDayLog(getTodayKey(), (data) => {
      const meals = data.meals || [];
      setTodayCalories(meals.reduce((acc, curr) => acc + Number(curr.calories), 0));
      setTodayWater(data.water || 0);
    });
    getHistory(setHistory); getChallengeStatus(setEarnedBadges); getUserStats(setUserStats); 
  };

  useEffect(() => { getCalorieStreak(parseFloat(calorieGoal)||2000, isStrict, setCalorieStreak); }, [todayCalories, calorieGoal, isStrict]);
  useEffect(() => { if(name||age||weight||height||calorieGoal) saveProfile({ name, age, weight, height, calorieGoal, isStrict, targetWeight, gender, activityLevel, objective }); }, [name, age, weight, height, calorieGoal, isStrict, targetWeight, gender, activityLevel, objective]);

  const handleAutoCalculate = () => {
     const w=parseFloat(weight), h=parseFloat(height), a=parseFloat(age);
     if(!w||!h||!a){ Alert.alert("Dados incompletos", "Preencha tudo."); return; }
     let bmr = (10*w) + (6.25*h) - (5*a); if(gender==='male') bmr+=5; else bmr-=161;
     const tdee = bmr * activityLevel;
     let final = tdee; if(objective==='lose') final-=400; if(objective==='gain') final+=300;
     const r = Math.round(final); 
     
     setCalorieGoal(String(r)); 
     calculateMacros(r, objective); // Atualiza os macros visuais
     
     Alert.alert("Calculado!", `Sua meta ideal é de ${r} kcal/dia.`);
  };

  const calculateMacros = (cals, obj) => {
     const t = parseFloat(cals); let p=0.30, c=0.40, f=0.30;
     if(obj==='lose'){p=0.40;c=0.30;f=0.30;} else if(obj==='gain'){p=0.30;c=0.50;f=0.20;}
     setMacros({ p:Math.round((t*p)/4), c:Math.round((t*c)/4), f:Math.round((t*f)/9) });
  };

  const handleDeleteDay = (d) => Alert.alert("Apagar", "Certeza?", [{text:"Cancelar"}, {text:"Apagar", style:"destructive", onPress:()=>deleteDailyLog(d, loadAllData)}]);
  const handleLogout = () => Alert.alert("Sair", "Desconectar?", [{text:"Cancelar"}, {text:"Sair", style:"destructive", onPress:async()=>{try{await signOut(auth)}catch(e){}}}]);
  const handleResetApp = () => Alert.alert("Zerar", "Certeza?", [{text:"Cancelar"}, {text:"ZERAR", style:"destructive", onPress:async()=>{await AsyncStorage.clear();Alert.alert("Feito");}}]);

  const handleChangeWallpaper = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) { const uri = result.assets[0].uri; await saveBackgroundImage(uri); if (onUpdateBg) onUpdateBg(uri); Alert.alert("Sucesso", "Papel de parede atualizado!"); }
  };
  const handleRemoveWallpaper = async () => { await saveBackgroundImage(null); if (onUpdateBg) onUpdateBg(null); Alert.alert("Removido", "Papel de parede restaurado."); };

  const calculateBMI = () => { const h=parseFloat(height)/100, w=parseFloat(weight); return (h&&w)?(w/(h*h)).toFixed(1):null; };
  const bmi = calculateBMI();
  const getBMIStatus = (v) => { if(v<18.5) return {l:'Abaixo',c:'#3b82f6'}; if(v<24.9) return {l:'Normal',c:'#16a34a'}; if(v<29.9) return {l:'Sobrepeso',c:'#eab308'}; return {l:'Obesidade',c:'#ef4444'}; };
  const waterGoal = weight ? (parseFloat(weight)*35).toFixed(0) : 0;
  const goal = parseFloat(calorieGoal)||2000;
  const progressPercent = goal>0 ? Math.min((todayCalories/goal)*100, 100) : 0;
  const sortedDates = Object.keys(history).sort().reverse();
  const formatDate = (d) => d.split('-').reverse().slice(0,2).join('/');
  const isBroken = isStrict && (todayCalories >= goal * 1.5);
  const weightDiff = (weight && targetWeight) ? (parseFloat(weight) - parseFloat(targetWeight)).toFixed(1) : null;
  const myBadges = QUESTS.filter(q => earnedBadges[q.id]);
  const xpPercent = Math.min((userStats.currentXP / userStats.nextLevelXP) * 100, 100);

  const getWeightFeedback = () => {
    if (!weight || !targetWeight) return null;
    const current = parseFloat(weight); const target = parseFloat(targetWeight); const diff = (current - target).toFixed(1);
    if (objective === 'lose') { if (current <= target) return "🎉 Meta de peso atingida!"; return `📉 Falta perder ${Math.abs(diff)} kg`; } 
    else if (objective === 'gain') { if (current >= target) return "🎉 Meta de peso atingida!"; return `📈 Falta ganhar ${Math.abs(diff)} kg`; } 
    else { if (Math.abs(diff) < 1) return "✨ Você está mantendo o peso!"; return diff > 0 ? `⚠️ ${diff}kg acima da meta` : `⚠️ ${Math.abs(diff)}kg abaixo da meta`; }
  };

  // ESTILOS DINÂMICOS
  const cardStyle = [styles.card, { backgroundColor: theme.card }];
  const textStyle = { color: theme.text };
  const subTextStyle = { color: theme.textSub };
  const inputStyle = [styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: 'transparent' }]}>
      
      <View style={cardStyle}>
         <View style={styles.levelHeader}>
           <View style={styles.levelBadge}><Text style={styles.levelText}>NÍVEL {userStats.level}</Text></View>
           <Text style={[styles.xpText, {color: theme.textSub}]}>{userStats.currentXP} / {userStats.nextLevelXP} XP</Text>
         </View>
         <View style={[styles.xpBarBg, {backgroundColor: theme.inputBg}]}>
           <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={[styles.xpBarFill, {width: `${xpPercent}%`}]} />
         </View>
      </View>

      {isStrict && (<View style={[styles.messageCard, calorieStreak.status==='bad'?styles.messageBad:styles.messageGood]}><Feather name={calorieStreak.status==='bad'?"alert-triangle":"check-circle"} size={24} color="#fff" /><View style={{flex:1, marginLeft:10}}><Text style={styles.messageTitle}>{calorieStreak.status==='bad'?"Foco!":"Mandou bem!"}</Text><Text style={styles.messageText}>{calorieStreak.status==='bad'?`Você está ${calorieStreak.count} dias fora.`:`${calorieStreak.count} dias focado.`}</Text></View></View>)}

      <View style={styles.badgeSection}>
        <Text style={[styles.cardTitle, textStyle]}>Conquistas 🏅</Text>
        {myBadges.length===0 ? <Text style={[styles.emptyBadges, subTextStyle]}>Complete desafios!</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:10}}>{myBadges.map(q=>(<View key={q.id} style={styles.badgeItem}><LinearGradient colors={q.color} style={styles.badgeIcon}><Feather name={q.icon} size={24} color="#fff" /></LinearGradient><Text style={[styles.badgeText, subTextStyle]}>{q.title}</Text></View>))}</ScrollView>}
      </View>

      <View style={cardStyle}>
        <Text style={[styles.cardTitle, textStyle]}>Personalização</Text>
        <View style={styles.customRow}>
          <TouchableOpacity style={[styles.customBtn, {backgroundColor: theme.inputBg, borderColor: theme.border}]} onPress={handleChangeWallpaper}>
            <Feather name="image" size={20} color={theme.primary} /><Text style={[styles.customBtnText, {color: theme.text}]}>Alterar Fundo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.customBtn, {backgroundColor: theme.inputBg, borderColor: theme.border}]} onPress={handleRemoveWallpaper}>
            <Feather name="trash-2" size={20} color="#ef4444" /><Text style={[styles.customBtnText, {color: theme.text}]}>Restaurar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={cardStyle}>
        <Text style={[styles.cardTitle, textStyle]}>Dados Pessoais</Text>
        <Text style={[styles.label, subTextStyle]}>Nome</Text><TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor={theme.textSub} />
        <View style={styles.row}><View style={styles.halfInput}><Text style={[styles.label, subTextStyle]}>Idade</Text><TextInput style={inputStyle} value={age} onChangeText={setAge} keyboardType="numeric" placeholderTextColor={theme.textSub} /></View><View style={styles.halfInput}><Text style={[styles.label, subTextStyle]}>Altura</Text><TextInput style={inputStyle} value={height} onChangeText={setHeight} keyboardType="numeric" placeholderTextColor={theme.textSub} /></View></View>
        <View style={styles.row}><View style={styles.halfInput}><Text style={[styles.label, subTextStyle]}>Peso</Text><TextInput style={inputStyle} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholderTextColor={theme.textSub} /></View><View style={styles.halfInput}><Text style={[styles.label, subTextStyle]}>Meta</Text><TextInput style={[inputStyle, {borderColor:'#3b82f6'}]} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" placeholderTextColor={theme.textSub} /></View></View>
        {getWeightFeedback() && <Text style={{color:theme.textSub, fontSize:12, textAlign:'center', marginTop:-10, marginBottom:15}}>{getWeightFeedback()}</Text>}

        <View style={{marginTop:10, padding:15, backgroundColor: theme.isDark ? '#111827' : '#f0f9ff', borderRadius:12, borderWidth:1, borderColor: theme.border}}>
          <Text style={{color: theme.primary, fontWeight:'bold', marginBottom:10}}>Calculadora TDEE</Text>
          <View style={styles.selectRow}><TouchableOpacity style={[styles.selectBtn, gender==='male'&&{backgroundColor:theme.primary}]} onPress={()=>setGender('male')}><Text style={[styles.selectText, gender==='male'&&{color:'#fff'}]}>Homem</Text></TouchableOpacity><TouchableOpacity style={[styles.selectBtn, gender==='female'&&{backgroundColor:theme.primary}]} onPress={()=>setGender('female')}><Text style={[styles.selectText, gender==='female'&&{color:'#fff'}]}>Mulher</Text></TouchableOpacity></View>
          <View style={{flexDirection:'row', flexWrap:'wrap', gap:5, marginBottom:10}}>{[{l:'Sedentário',v:1.2},{l:'Leve',v:1.375},{l:'Mod',v:1.55},{l:'Intenso',v:1.725}].map(i=>(<TouchableOpacity key={i.v} style={[styles.chip, activityLevel===i.v&&{backgroundColor:theme.primary, borderColor:theme.primary}]} onPress={()=>setActivityLevel(i.v)}><Text style={[styles.chipText, activityLevel===i.v&&{color:'#fff'}]}>{i.l}</Text></TouchableOpacity>))}</View>
          <View style={styles.selectRow}><TouchableOpacity style={[styles.selectBtn, objective==='lose'&&{backgroundColor:theme.primary}]} onPress={()=>setObjective('lose')}><Text style={[styles.selectText, objective==='lose'&&{color:'#fff'}]}>Secar</Text></TouchableOpacity><TouchableOpacity style={[styles.selectBtn, objective==='maintain'&&{backgroundColor:theme.primary}]} onPress={()=>setObjective('maintain')}><Text style={[styles.selectText, objective==='maintain'&&{color:'#fff'}]}>Manter</Text></TouchableOpacity><TouchableOpacity style={[styles.selectBtn, objective==='gain'&&{backgroundColor:theme.primary}]} onPress={()=>setObjective('gain')}><Text style={[styles.selectText, objective==='gain'&&{color:'#fff'}]}>Crescer</Text></TouchableOpacity></View>
          
          <TouchableOpacity style={[styles.calcButton, {backgroundColor:theme.primary}]} onPress={handleAutoCalculate}><Feather name="cpu" size={20} color="#fff" /><Text style={{color:'#fff', fontWeight:'bold', marginLeft:8}}>Calcular Meta</Text></TouchableOpacity>
          
          {/* --- AQUI ESTÁ A VOLTA DOS MACROS! --- */}
          <View style={[styles.macroSuggestion, {backgroundColor: theme.inputBg}]}>
            <Text style={[styles.macroTitle, subTextStyle]}>Sugestão de Macros:</Text>
            <View style={styles.macroRow}>
               <Text style={[styles.macroItem, textStyle]}>🥩 {macros.p}g P</Text>
               <Text style={[styles.macroItem, textStyle]}>🥔 {macros.c}g C</Text>
               <Text style={[styles.macroItem, textStyle]}>🥑 {macros.f}g G</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.label, subTextStyle]}>Meta Kcal</Text><TextInput style={[inputStyle, {borderColor:theme.primary, textAlign:'center', fontWeight:'bold'}]} value={calorieGoal} onChangeText={setCalorieGoal} keyboardType="numeric" />
        <View style={styles.switchRow}><View style={{flex:1}}><Text style={[styles.switchTitle, textStyle]}>Modo Rígido</Text><Text style={[styles.switchDesc, subTextStyle]}>Meta como teto.</Text></View><Switch value={isStrict} onValueChange={setIsStrict} trackColor={{false:theme.inputBg, true:theme.primary}} thumbColor={"#fff"} /></View>
      </View>

      {bmi && <View style={styles.resultsContainer}><LinearGradient colors={['#f0fdf4', '#dcfce7']} style={[styles.resultCard, {borderColor:getBMIStatus(bmi).c}]}><Text style={styles.resultLabel}>IMC</Text><Text style={[styles.resultValue, {color:getBMIStatus(bmi).c}]}>{bmi}</Text><Text style={styles.resultStatus}>{getBMIStatus(bmi).label}</Text></LinearGradient><LinearGradient colors={['#eff6ff', '#dbeafe']} style={[styles.resultCard, {borderColor:'#3b82f6'}]}><Text style={styles.resultLabel}>Meta Água</Text><Text style={[styles.resultValue, {color:'#2563eb'}]}>{waterGoal}</Text><Text style={styles.resultStatus}>ml</Text></LinearGradient></View>}

      <Text style={[styles.historyTitle, textStyle]}>Histórico</Text>
      {sortedDates.map(date => {
        const dayData = history[date];
        const isExpanded = expandedDate === date;
        const dayTotal = (dayData.meals||[]).reduce((acc, curr) => acc + Number(curr.calories), 0);
        return (
          <View key={date} style={[styles.historyItem, {backgroundColor: theme.card}]}>
            <TouchableOpacity style={styles.historyHeader} onPress={() => setExpandedDate(isExpanded ? null : date)}>
              <View style={styles.dateBadge}><Text style={styles.dateText}>{formatDate(date)}</Text></View>
              <View style={styles.headerInfo}><Text style={[styles.headerKcal, {color: theme.primary}]}>{Math.round(dayTotal)} kcal</Text><Text style={styles.headerWater}>💧 {dayData.water||0} ml</Text></View>
              <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSub} />
            </TouchableOpacity>
            {isExpanded && <View style={[styles.historyDetails, {backgroundColor: theme.inputBg, borderTopColor: theme.border}]}>{(dayData.meals||[]).map((m, i)=>(<Text key={i} style={[styles.mealName, textStyle]}>• {m.name}</Text>))}<TouchableOpacity style={styles.deleteDayButton} onPress={()=>handleDeleteDay(date)}><Feather name="trash-2" size={16} color="#ef4444" /><Text style={styles.deleteDayText}>Apagar Dia</Text></TouchableOpacity></View>}
          </View>
        );
      })}
      
      <View style={{ marginTop: 30, marginBottom: 40 }}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><Feather name="log-out" size={20} color="#fff" style={{marginRight: 8}} /><Text style={styles.logoutText}>Sair da Conta</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  levelBadge: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  xpText: { fontSize: 12, fontWeight: 'bold' },
  xpBarBg: { width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 5 },
  xpBarFill: { height: '100%' },
  levelSub: { fontSize: 10, fontStyle: 'italic' },
  messageCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 4 },
  messageGood: { backgroundColor: '#16a34a' },
  messageBad: { backgroundColor: '#ef4444' },
  messageTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  messageText: { color: '#fff', fontSize: 13, marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  switchTitle: { fontWeight: 'bold', fontSize: 16 },
  switchDesc: { fontSize: 12 },
  goalCard: { padding: 20, borderRadius: 16, elevation: 4, marginBottom: 20, borderWidth: 1 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  goalTitle: { fontSize: 16, fontWeight: 'bold' },
  goalValues: { fontSize: 24, fontWeight: 'bold' },
  progressBarBackground: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  goalSubtitle: { fontSize: 12, textAlign: 'right', fontStyle: 'italic' },
  card: { padding: 20, borderRadius: 16, elevation: 2, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 5, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  halfInput: { flex: 1 },
  resultsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 25 },
  resultCard: { flex: 1, padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  resultLabel: { fontSize: 12, fontWeight: 'bold' },
  resultValue: { fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
  resultStatus: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptyHistory: { textAlign: 'center', marginTop: 10 },
  historyItem: { borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  dateBadge: { backgroundColor: '#1f2937', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, marginRight: 10 },
  dateText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  headerInfo: { flex: 1, flexDirection: 'row', gap: 15 },
  headerKcal: { fontWeight: 'bold' },
  headerWater: { fontWeight: 'bold' },
  historyDetails: { padding: 15, borderTopWidth: 1 },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  mealName: { fontSize: 14 },
  mealCal: { fontSize: 14, fontWeight: '600' },
  noMealText: { fontSize: 12, fontStyle: 'italic' },
  deleteDayButton: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  deleteDayText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
  selectBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1 },
  selectBtnActive: { },
  selectText: { fontWeight: 'bold', fontSize: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 5, marginBottom: 5 },
  chipActive: { },
  chipText: { fontSize: 12, fontWeight: '600' },
  calcButton: { flexDirection: 'row', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 15, elevation: 3 },
  
  macroSuggestion: { marginTop: 10, padding: 10, borderRadius: 8, alignItems: 'center' },
  macroTitle: { fontSize: 12, marginBottom: 5, fontWeight: 'bold' },
  macroRow: { flexDirection: 'row', gap: 15 },
  macroItem: { fontSize: 14, fontWeight: '600' },
  
  badgeSection: { marginBottom: 20 },
  emptyBadges: { fontStyle: 'italic', fontSize: 12, marginTop: 5 },
  badgeItem: { alignItems: 'center', marginRight: 15 },
  badgeIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 5, elevation: 3 },
  badgeText: { fontSize: 10, fontWeight: 'bold', maxWidth: 60, textAlign: 'center' },
  logoutButton: { backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, elevation: 3, width: '100%' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  customBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  customBtnText: { fontWeight: 'bold', fontSize: 14 }
});