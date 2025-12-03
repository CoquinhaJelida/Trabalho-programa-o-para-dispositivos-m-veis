import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CHAVES DO BANCO ---
const CUSTOM_FOODS_KEY = '@my_custom_foods_v3'; 
const PROFILE_KEY = '@user_profile_v2';
const HISTORY_KEY = '@daily_logs_v2';
const PHOTOS_KEY = '@body_photos_v2';
const FASTING_KEY = '@fasting_data_v2';
const FASTING_HISTORY_KEY = '@fasting_history_v2';
const STATS_KEY = '@gamification_stats_v2';
const CHALLENGES_KEY = '@challenges_data_v1'; // Chave nova

export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ==========================================
// 1. DESAFIOS (QUESTS) - NOVO!
// ==========================================

export const getChallengeStatus = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(CHALLENGES_KEY);
    const status = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(status);
    return status;
  } catch (e) { return {}; }
};

export const claimChallengeReward = async (challengeId, xpAmount, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(CHALLENGES_KEY);
    const status = json ? JSON.parse(json) : {};
    
    // Marca como resgatado
    status[challengeId] = true;
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(status));

    // Adiciona o XP
    await addXP(xpAmount, (newStats, leveledUp) => {
      if (onSuccess) onSuccess(newStats, leveledUp);
    });
  } catch (e) { console.error(e); }
};

export const getGlobalStats = async (onSuccess) => {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
    const fastingJson = await AsyncStorage.getItem(FASTING_HISTORY_KEY);
    
    const history = historyJson ? JSON.parse(historyJson) : {};
    const fasts = fastingJson ? JSON.parse(fastingJson) : [];

    // Calcula totais gerais para as missões
    const totalMeals = Object.values(history).reduce((acc, day) => acc + (day.meals ? day.meals.length : 0), 0);
    const totalFasts = fasts.length;
    const maxFastingTime = fasts.reduce((max, curr) => Math.max(max, curr.durationSeconds || 0), 0);

    if (onSuccess) onSuccess({ totalMeals, totalFasts, maxFastingTime });
  } catch (e) { console.error(e); }
};

// ==========================================
// 2. XP E NÍVEIS
// ==========================================

export const getUserStats = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(STATS_KEY);
    const stats = json ? JSON.parse(json) : { level: 1, currentXP: 0, nextLevelXP: 100 };
    if (onSuccess) onSuccess(stats);
    return stats;
  } catch (e) { return { level: 1, currentXP: 0, nextLevelXP: 100 }; }
};

export const addXP = async (amount, onSuccess) => {
  try {
    const currentStats = await getUserStats();
    let { level, currentXP, nextLevelXP } = currentStats;
    currentXP += amount;
    let leveledUp = false;
    while (currentXP >= nextLevelXP) {
      currentXP -= nextLevelXP;
      level++;
      nextLevelXP = Math.round(nextLevelXP * 1.2);
      leveledUp = true;
    }
    const newStats = { level, currentXP, nextLevelXP };
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    if (onSuccess) onSuccess(newStats, leveledUp);
  } catch (e) {}
};

// ==========================================
// 3. FUNÇÕES GERAIS (MANTIDAS)
// ==========================================

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    history[date] = { ...currentDay, ...dataToMerge };
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
};
export const getHistory = async (onSuccess) => { try { const j = await AsyncStorage.getItem(HISTORY_KEY); if(onSuccess) onSuccess(j?JSON.parse(j):{}); } catch(e){} };
export const getDayLog = async (date, onSuccess) => { try { const h = await getHistory(); const d = h[date] || { meals: [], water: 0, totalCalories: 0 }; if(onSuccess) onSuccess(d); } catch(e){} };
export const deleteDailyLog = async (date, onSuccess) => { try { const j = await AsyncStorage.getItem(HISTORY_KEY); let h = j?JSON.parse(j):{}; if(h[date]) { delete h[date]; await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h)); if(onSuccess) onSuccess(true); } } catch(e){} };
export const deleteMealFromHistory = async (date, mealId, onSuccess) => { try { const j = await AsyncStorage.getItem(HISTORY_KEY); let h = j?JSON.parse(j):{}; if(h[date] && h[date].meals) { const nm = h[date].meals.filter(m=>m.id!==mealId); const nt = nm.reduce((a,c)=>a+Number(c.calories),0); h[date] = {...h[date], meals:nm, totalCalories:nt}; await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h)); if(onSuccess) onSuccess(nm, nt); } } catch(e){} };
export const addMealToDay = async (mealItem, onSuccess) => { try { const t = getTodayKey(); const j = await AsyncStorage.getItem(HISTORY_KEY); const h = j?JSON.parse(j):{}; const cd = h[t] || { meals: [], water: 0, totalCalories: 0 }; const nl = [mealItem, ...cd.meals]; const nt = nl.reduce((a,c)=>a+Number(c.calories),0); h[t] = {...cd, meals:nl, totalCalories:nt}; await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h)); if(onSuccess) onSuccess(nl, nt); } catch(e){} };

export const getCalorieStreak = async (goal, strict, cb) => { try { const h = await getHistory(); const t = getTodayKey(); const d = h[t] || { totalCalories: 0 }; let suc = strict ? (d.totalCalories <= goal) : (d.totalCalories >= goal); const st = suc ? 'good' : 'bad'; let c = 0; for (let i = 0; i < 365; i++) { const dt = new Date(); dt.setDate(new Date().getDate()-i); const k = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; const dd = h[k]; if (!dd && i > 0) break; const cl = dd ? dd.totalCalories : 0; let ds = strict ? (cl <= goal) : (cl >= goal); if (st === 'good') { if (ds) c++; else break; } else { if (!ds) c++; else break; } } if(cb) cb({status:st, count:c}); } catch(e) { if(cb) cb({status:'good',count:0}); } };
export const getWaterStreak = async (cb) => { try { const h = await getHistory(); let s = 0; const t = new Date(); for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(t.getDate()-i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if(dd && dd.goal > 0 && dd.water >= dd.goal) s++; else { if(i===0) continue; else break; } } if(cb) cb(s); } catch(e) { if(cb) cb(0); } };

export const saveFastingState = async (s, g, i) => { try { await AsyncStorage.setItem(FASTING_KEY, JSON.stringify({startTime:s, goalHours:g, isFasting:i})); } catch(e){} };
export const getFastingState = async (cb) => { try { const j = await AsyncStorage.getItem(FASTING_KEY); if(cb) cb(j?JSON.parse(j):null); } catch(e){} };
export const saveFastingLog = async (s, e, d, g) => { try { const j = await AsyncStorage.getItem(FASTING_HISTORY_KEY); const h = j?JSON.parse(j):[]; const ed=new Date(e); const k=`${ed.getFullYear()}-${String(ed.getMonth()+1).padStart(2,'0')}-${String(ed.getDate()).padStart(2,'0')}`; const nl={id:Date.now().toString(), startTime:s, endTime:e, durationSeconds:d, goalHours:g, date:k}; await AsyncStorage.setItem(FASTING_HISTORY_KEY, JSON.stringify([nl,...h])); } catch(e){} };
export const getFastingHistory = async (cb) => { try { const j = await AsyncStorage.getItem(FASTING_HISTORY_KEY); if(cb) cb(j?JSON.parse(j):[]); } catch(e){} };
export const deleteFastingLog = async (id, cb) => { try { const j = await AsyncStorage.getItem(FASTING_HISTORY_KEY); let h = j?JSON.parse(j):[]; h=h.filter(i=>i.id!==id); await AsyncStorage.setItem(FASTING_HISTORY_KEY, JSON.stringify(h)); if(cb) cb(h); } catch(e){} };

export const addCustomFood = async (n, c, cat, uw, m, cb) => { try { const j = await AsyncStorage.getItem(CUSTOM_FOODS_KEY); const f = j ? JSON.parse(j) : []; const nf = { id: Date.now().toString(), name: n, calories: c, category: cat, isCustom: true, unit_weight: uw || null, carbs: m?.carbs||0, protein: m?.protein||0, fat: m?.fat||0, sugar: m?.sugar||0 }; await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify([...f, nf])); if (cb) cb(true); } catch (e) {} };
export const getCustomFoods = async (cb) => { try { const j = await AsyncStorage.getItem(CUSTOM_FOODS_KEY); if (cb) cb(j ? JSON.parse(j) : []); } catch (e) {} };
export const savePhotoLog = async (d, u, w, m) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); const g = j ? JSON.parse(j) : {}; const l = g[d] || []; g[d] = [{ id: Date.now().toString(), uri: u, weight: w || '', measurements: m||{} }, ...l]; await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(g)); } catch (e) {} };
export const getGallery = async (cb) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); if (cb) cb(j ? JSON.parse(j) : {}); } catch (e) {} };
export const deletePhoto = async (d, id, cb) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); let g = j ? JSON.parse(j) : {}; if (g[d]) { g[d] = g[d].filter(i => i.id !== id); if (g[d].length === 0) delete g[d]; await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(g)); if (cb) cb(g); } } catch (e) {} };
export const saveProfile = async (p) => { try { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch(e) {} };
export const getProfile = async (cb) => { try { const j = await AsyncStorage.getItem(PROFILE_KEY); if (cb) cb(j ? JSON.parse(j) : null); } catch (e) {} };