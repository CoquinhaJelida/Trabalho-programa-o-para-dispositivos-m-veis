import AsyncStorage from '@react-native-async-storage/async-storage';

// CHAVES (V3 para garantir limpeza)
const CUSTOM_FOODS_KEY = '@my_custom_foods_v3';
const PROFILE_KEY = '@user_profile_v2';
const HISTORY_KEY = '@daily_logs_v2';
const PHOTOS_KEY = '@body_photos_v2';

export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ==========================================
// FUNÇÃO BLINDADA: ADICIONAR REFEIÇÃO
// ==========================================
export const addMealToDay = async (mealItem, onSuccess) => {
  try {
    const today = getTodayKey();
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    
    // Pega o dia atual ou cria novo
    const currentDay = history[today] || { meals: [], water: 0, totalCalories: 0 };
    
    // Adiciona o novo item à lista existente (sem apagar os antigos)
    const newMealsList = [mealItem, ...currentDay.meals];
    
    // Recalcula o total baseado na nova lista
    const newTotal = newMealsList.reduce((acc, curr) => acc + Number(curr.calories), 0);
    
    // Atualiza o histórico
    history[today] = {
      ...currentDay,
      meals: newMealsList,
      totalCalories: newTotal
    };
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log("[DB] Refeição salva com sucesso:", mealItem.name);
    
    if (onSuccess) onSuccess(newMealsList, newTotal);
  } catch (e) {
    console.error("[DB] Erro ao salvar refeição:", e);
  }
};

export const deleteMealFromHistory = async (mealId, onSuccess) => {
  try {
    const today = getTodayKey();
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    
    if (history[today]) {
      const newMeals = history[today].meals.filter(m => m.id !== mealId);
      const newTotal = newMeals.reduce((acc, c) => acc + Number(c.calories), 0);
      
      history[today] = { ...history[today], meals: newMeals, totalCalories: newTotal };
      
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      if (onSuccess) onSuccess(newMeals, newTotal);
    }
  } catch (e) { console.error(e); }
};

// ... OUTRAS FUNÇÕES (MANTIDAS IGUAIS) ...

export const getHistory = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(history);
    return history;
  } catch (e) { return {}; }
};

export const getDayLog = async (date, onSuccess) => {
  try {
    const history = await getHistory();
    const dayData = history[date] || { meals: [], water: 0, totalCalories: 0 };
    if (onSuccess) onSuccess(dayData);
    return dayData;
  } catch (e) { return { meals: [], water: 0, totalCalories: 0 }; }
};

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    history[date] = { ...currentDay, ...dataToMerge };
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
};

export const getCalorieStreak = async (currentGoal, isStrict, onSuccess) => {
  try {
    const history = await getHistory();
    const todayKey = getTodayKey();
    const todayData = history[todayKey] || { totalCalories: 0 };
    const isTodaySuccess = isStrict ? (todayData.totalCalories <= currentGoal) : (todayData.totalCalories >= currentGoal);
    const targetStatus = isTodaySuccess ? 'good' : 'bad';
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(new Date().getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayData = history[k];
      if (!dayData && i > 0) break;
      const cals = dayData ? dayData.totalCalories : 0;
      let daySuccess = isStrict ? (cals <= currentGoal) : (cals >= currentGoal);
      if (targetStatus === 'good') { if (daySuccess) count++; else break; } else { if (!daySuccess) count++; else break; }
    }
    if (onSuccess) onSuccess({ status: targetStatus, count });
  } catch (e) { if (onSuccess) onSuccess({ status: 'good', count: 0 }); }
};

// GALERIA (FOTOS DO CORPO)
export const savePhotoLog = async (date, uri, w) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    const d = gallery[date] || [];
    // ID ÚNICO FORTE
    const newEntry = { id: Date.now().toString() + Math.random().toString(), uri, weight: w || '' };
    gallery[date] = [newEntry, ...d];
    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
  } catch (e) {}
};

export const getGallery = async (cb) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); if(cb) cb(j?JSON.parse(j):{}); } catch(e){} };
export const deletePhoto = async (d, id, cb) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); let g = j ? JSON.parse(j) : {}; if(g[d]) { g[d] = g[d].filter(i => i.id !== id); if(g[d].length===0) delete g[d]; await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(g)); if(cb) cb(g); } } catch(e){} };

export const addCustomFood = async (n, c, cat, w, macros, cb) => {
  try {
    const j = await AsyncStorage.getItem(CUSTOM_FOODS_KEY); const f = j ? JSON.parse(j) : [];
    const nf = { id:Date.now().toString(), name:n, calories:c, category:cat, isCustom:true, unit_weight: w||null, carbs:macros?.carbs||0, protein:macros?.protein||0, fat:macros?.fat||0, sugar:macros?.sugar||0 };
    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify([...f, nf]));
    if(cb) cb(true);
  } catch(e){}
};
export const getCustomFoods = async (cb) => { try { const j = await AsyncStorage.getItem(CUSTOM_FOODS_KEY); if(cb) cb(j?JSON.parse(j):[]); } catch(e){} };
export const saveProfile = async (p) => { try { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch(e){} };
export const getProfile = async (cb) => { try { const j = await AsyncStorage.getItem(PROFILE_KEY); if(cb) cb(j?JSON.parse(j):null); } catch(e){} };
export const deleteDailyLog = async (date, cb) => { try { const j = await AsyncStorage.getItem(HISTORY_KEY); let h = j ? JSON.parse(j) : {}; if(h[date]) { delete h[date]; await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h)); if(cb) cb(true); } } catch(e){} };
export const getWaterStreak = async (cb) => { try { const j = await AsyncStorage.getItem(HISTORY_KEY); const h = j ? JSON.parse(j) : {}; let s = 0; const t = new Date(); for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(t.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; const dd = h[k]; if (dd && dd.goal > 0 && dd.water >= dd.goal) s++; else { if (i === 0) continue; else break; } } if (cb) cb(s); } catch (e) { if (cb) cb(0); } };