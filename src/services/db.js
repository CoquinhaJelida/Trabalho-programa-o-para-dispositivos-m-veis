import AsyncStorage from '@react-native-async-storage/async-storage';

// CHAVES (V3 para garantir que comece limpo e sem bugs antigos)
const CUSTOM_FOODS_KEY = '@my_custom_foods_v3';
const PROFILE_KEY = '@user_profile_v2';
const HISTORY_KEY = '@daily_logs_v3'; // Mudei para V3 para resetar conflitos de hoje
const PHOTOS_KEY = '@body_photos_v2';
const FASTING_KEY = '@fasting_data_v2';
const FASTING_HISTORY_KEY = '@fasting_history_v2';
const STATS_KEY = '@gamification_stats_v2';
const CHALLENGES_KEY = '@challenges_data_v1';

// DATA DE HOJE (Corrigida para Fuso Local)
export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ==========================================
// 1. REFEIÇÕES (LÓGICA BLINDADA)
// ==========================================

// Adiciona refeição lendo o disco primeiro (evita sobrescrever)
export const addMealToDay = async (mealItem, onSuccess) => {
  try {
    const today = getTodayKey();
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    
    // Garante que temos o dia
    const currentDay = history[today] || { meals: [], water: 0, totalCalories: 0 };
    const existingMeals = currentDay.meals || [];
    
    // Adiciona o novo item no TOPO da lista
    const newMealsList = [mealItem, ...existingMeals];
    
    // Recalcula total
    const newTotal = newMealsList.reduce((acc, curr) => acc + Number(curr.calories), 0);
    
    // Atualiza histórico
    history[today] = {
      ...currentDay,
      meals: newMealsList,
      totalCalories: newTotal
    };
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log("[DB] Adicionado. Total itens:", newMealsList.length);
    
    // Retorna a lista nova para a tela atualizar
    if (onSuccess) onSuccess(newMealsList, newTotal);
  } catch (e) {
    console.error("[DB] Erro addMeal:", e);
  }
};

// Deleta refeição lendo o disco primeiro
export const deleteMealFromHistory = async (date, mealId, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    let history = json ? JSON.parse(json) : {};
    
    if (history[date] && history[date].meals) {
      const currentMeals = history[date].meals;
      const newMeals = currentMeals.filter(m => m.id !== mealId);
      const newTotal = newMeals.reduce((acc, c) => acc + Number(c.calories), 0);
      
      history[date] = { ...history[date], meals: newMeals, totalCalories: newTotal };
      
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      console.log("[DB] Deletado. Restam:", newMeals.length);
      
      if (onSuccess) onSuccess(newMeals, newTotal);
    }
  } catch (e) { console.error(e); }
};

// Lê os dados do dia
export const getDayLog = async (date, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    const dayData = history[date] || { meals: [], water: 0, totalCalories: 0 };
    if (onSuccess) onSuccess(dayData);
    return dayData;
  } catch (e) { return { meals: [], water: 0, totalCalories: 0 }; }
};

// Salva água ou outros dados genéricos
export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    history[date] = { ...currentDay, ...dataToMerge };
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
};

// ==========================================
// 2. OUTRAS FUNÇÕES (MANTIDAS)
// ==========================================
export const getHistory = async (cb) => { try { const j = await AsyncStorage.getItem(HISTORY_KEY); if(cb) cb(j?JSON.parse(j):{}); } catch(e){} };
export const deleteDailyLog = async (d, cb) => { try { const j = await AsyncStorage.getItem(HISTORY_KEY); let h = j?JSON.parse(j):{}; if(h[d]) { delete h[d]; await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h)); if(cb) cb(true); } } catch(e){} };
export const saveFastingState = async (s, g, i) => { try { await AsyncStorage.setItem(FASTING_KEY, JSON.stringify({startTime:s, goalHours:g, isFasting:i})); } catch(e){} };
export const getFastingState = async (cb) => { try { const j = await AsyncStorage.getItem(FASTING_KEY); if(cb) cb(j?JSON.parse(j):null); } catch(e){} };
export const saveFastingLog = async (s, e, d, g) => { try { const j = await AsyncStorage.getItem(FASTING_HISTORY_KEY); const h = j?JSON.parse(j):[]; const nl={id:Date.now().toString(), startTime:s, endTime:e, durationSeconds:d, goalHours:g, date:new Date(e).toISOString().split('T')[0]}; await AsyncStorage.setItem(FASTING_HISTORY_KEY, JSON.stringify([nl,...h])); } catch(e){} };
export const getFastingHistory = async (cb) => { try { const j = await AsyncStorage.getItem(FASTING_HISTORY_KEY); if(cb) cb(j?JSON.parse(j):[]); } catch(e){} };
export const deleteFastingLog = async (id, cb) => { try { const j = await AsyncStorage.getItem(FASTING_HISTORY_KEY); let h = j?JSON.parse(j):[]; h=h.filter(i=>i.id!==id); await AsyncStorage.setItem(FASTING_HISTORY_KEY, JSON.stringify(h)); if(cb) cb(h); } catch(e){} };
export const getCalorieStreak = async (g, s, cb) => { try { const h = await getHistory(); const t = getTodayKey(); const td = h[t] || { totalCalories: 0 }; let suc = s ? (td.totalCalories <= g) : (td.totalCalories >= g); const st = suc ? 'good' : 'bad'; let c = 0; for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(new Date().getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if (!dd && i > 0) break; const cl = dd ? dd.totalCalories : 0; let ds = s ? (cl <= g) : (cl >= g); if (st === 'good') { if (ds) c++; else break; } else { if (!ds) c++; else break; } } if (cb) cb({ status: st, count: c }); } catch (e) { if (cb) cb({ status: 'good', count: 0 }); } };
export const getWaterStreak = async (cb) => { try { const h = await getHistory(); let s = 0; const t = new Date(); for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(t.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if (dd && dd.goal > 0 && dd.water >= dd.goal) s++; else { if (i === 0) continue; else break; } } if (cb) cb(s); } catch (e) { if (cb) cb(0); } };
export const addCustomFood = async (n, c, cat, uw, m, cb) => { try { const j = await AsyncStorage.getItem(CUSTOM_FOODS_KEY); const f = j ? JSON.parse(j) : []; const nf = { id: Date.now().toString(), name: n, calories: c, category: cat, isCustom: true, unit_weight: uw || null, carbs: m?.carbs||0, protein: m?.protein||0, fat: m?.fat||0, sugar: m?.sugar||0 }; await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify([...f, nf])); if (cb) cb(true); } catch (e) {} };
export const getCustomFoods = async (cb) => { try { const j = await AsyncStorage.getItem(CUSTOM_FOODS_KEY); if (cb) cb(j ? JSON.parse(j) : []); } catch (e) {} };
export const savePhotoLog = async (d, u, w, m) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); const g = j ? JSON.parse(j) : {}; const l = g[d] || []; g[d] = [{ id: Date.now().toString()+Math.random(), uri: u, weight: w || '', measurements: m||{} }, ...l]; await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(g)); } catch (e) {} };
export const getGallery = async (cb) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); if (cb) cb(j ? JSON.parse(j) : {}); } catch (e) {} };
export const deletePhoto = async (d, id, cb) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); let g = j ? JSON.parse(j) : {}; if (g[d]) { g[d] = g[d].filter(i => i.id !== id); if (g[d].length === 0) delete g[d]; await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(g)); if (cb) cb(g); } } catch (e) {} };
export const saveProfile = async (p) => { try { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch(e) {} };
export const getProfile = async (cb) => { try { const j = await AsyncStorage.getItem(PROFILE_KEY); if (cb) cb(j ? JSON.parse(j) : null); } catch (e) {} };
export const getChallengeStatus = async (cb) => { try { const j = await AsyncStorage.getItem(CHALLENGES_KEY); if(cb) cb(j?JSON.parse(j):{}); } catch(e){return{}} };
export const claimChallengeReward = async (cid, xp, cb) => { try { const j = await AsyncStorage.getItem(CHALLENGES_KEY); const s = j?JSON.parse(j):{}; s[cid]=true; await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(s)); await addXP(xp, (ns,lu)=>cb(ns,lu)); } catch(e){} };
export const getGlobalStats = async (cb) => { try { const hj = await AsyncStorage.getItem(HISTORY_KEY); const fj = await AsyncStorage.getItem(FASTING_HISTORY_KEY); const h = hj?JSON.parse(hj):{}; const f = fj?JSON.parse(fj):[]; const tm = Object.values(h).reduce((a,d)=>a+(d.meals?d.meals.length:0),0); const tf = f.length; const mf = f.reduce((mx,c)=>Math.max(mx,c.durationSeconds||0),0); if(cb) cb({totalMeals:tm, totalFasts:tf, maxFastingTime:mf}); } catch(e){} };
export const getUserStats = async (cb) => { try { const j = await AsyncStorage.getItem(STATS_KEY); const s = j?JSON.parse(j):{level:1,currentXP:0,nextLevelXP:100}; if(cb) cb(s); return s; } catch(e){return {level:1,currentXP:0,nextLevelXP:100}} };
export const addXP = async (amt, cb) => { try { const cs = await getUserStats(); let {level,currentXP,nextLevelXP} = cs; currentXP+=amt; let lu=false; while(currentXP>=nextLevelXP){ currentXP-=nextLevelXP; level++; nextLevelXP=Math.round(nextLevelXP*1.2); lu=true; } const ns={level,currentXP,nextLevelXP}; await AsyncStorage.setItem(STATS_KEY, JSON.stringify(ns)); if(cb) cb(ns,lu); } catch(e){} };