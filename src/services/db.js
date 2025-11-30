import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CHAVES DO BANCO DE DADOS (V3 para limpar conflitos antigos) ---
const CUSTOM_FOODS_KEY = '@my_custom_foods_v3'; 
const PROFILE_KEY = '@user_profile_v2';
const HISTORY_KEY = '@daily_logs_v2';
const PHOTOS_KEY = '@body_photos_v2';
const FASTING_KEY = '@fasting_data_v2'; // Estado atual (rodando)
const FASTING_HISTORY_KEY = '@fasting_history_v2'; // Histórico finalizado

// --- HELPER: DATA LOCAL (CORREÇÃO DE FUSO) ---
// Garante que a data salva seja a do seu celular, não a mundial
export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ==========================================
// 1. FUNÇÕES DE JEJUM (FASTING)
// ==========================================

// Salva o estado do cronômetro (rodando ou parado)
export const saveFastingState = async (startTime, goalHours, isFasting) => {
  try {
    const data = { 
      startTime: startTime, 
      goalHours: goalHours, 
      isFasting: isFasting 
    };
    await AsyncStorage.setItem(FASTING_KEY, JSON.stringify(data));
  } catch (e) { console.error("[DB] Erro FastingState:", e); }
};

// Recupera se tem um jejum rodando
export const getFastingState = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(FASTING_KEY);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : null);
  } catch (e) { console.error(e); }
};

// Salva no histórico quando TERMINA (Correção de Data Local aplicada)
export const saveFastingLog = async (startTime, endTime, durationSeconds, goalHours) => {
  try {
    const json = await AsyncStorage.getItem(FASTING_HISTORY_KEY);
    const history = json ? JSON.parse(json) : [];
    
    // Cria data local baseada no momento do término
    const endDateObj = new Date(endTime);
    const year = endDateObj.getFullYear();
    const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(endDateObj.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const newLog = {
      id: Date.now().toString() + Math.random().toString(), // ID único forte
      startTime,
      endTime,
      durationSeconds,
      goalHours,
      date: localDateString // Salva data correta do Brasil
    };

    const updatedHistory = [newLog, ...history];
    await AsyncStorage.setItem(FASTING_HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log("[DB] Jejum salvo:", newLog);
  } catch (e) { console.error("[DB] Erro saveFastingLog:", e); }
};

// Pega lista de jejuns antigos
export const getFastingHistory = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(FASTING_HISTORY_KEY);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : []);
  } catch (e) { console.error(e); }
};

// Apaga um jejum do histórico
export const deleteFastingLog = async (id, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(FASTING_HISTORY_KEY);
    let history = json ? JSON.parse(json) : [];
    history = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(FASTING_HISTORY_KEY, JSON.stringify(history));
    if (onSuccess) onSuccess(history);
  } catch (e) { console.error(e); }
};

// ==========================================
// 2. HISTÓRICO DIÁRIO (REFEIÇÕES + ÁGUA)
// ==========================================

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    
    // Mescla com segurança
    history[date] = { ...currentDay, ...dataToMerge };
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) { console.error(e); }
};

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

export const addMealToDay = async (mealItem, onSuccess) => {
  try {
    const today = getTodayKey();
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    const currentDay = history[today] || { meals: [], water: 0, totalCalories: 0 };
    
    const newMealsList = [mealItem, ...currentDay.meals];
    const newTotal = newMealsList.reduce((acc, curr) => acc + Number(curr.calories), 0);
    
    history[today] = { ...currentDay, meals: newMealsList, totalCalories: newTotal };
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    if (onSuccess) onSuccess(newMealsList, newTotal);
  } catch (e) { console.error(e); }
};

export const deleteDailyLog = async (date, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    let history = json ? JSON.parse(json) : {};
    if (history[date]) {
      delete history[date];
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      if (onSuccess) onSuccess(true);
    }
  } catch (e) {}
};

export const deleteMealFromHistory = async (date, mealId, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    let history = json ? JSON.parse(json) : {};
    if (history[date] && history[date].meals) {
      const newMeals = history[date].meals.filter(m => m.id !== mealId);
      const newTotal = newMeals.reduce((acc, c) => acc + Number(c.calories), 0);
      history[date] = { ...history[date], meals: newMeals, totalCalories: newTotal };
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      if (onSuccess) onSuccess(newMeals, newTotal); // Retorna a nova lista
    }
  } catch (e) { console.error(e); }
};

// ==========================================
// 3. STREAKS (CALORIAS E ÁGUA)
// ==========================================

export const getCalorieStreak = async (currentGoal, isStrict, onSuccess) => {
  try {
    const history = await getHistory();
    const todayKey = getTodayKey();
    const todayData = history[todayKey] || { totalCalories: 0 };
    
    // Define sucesso de hoje
    let isTodaySuccess = isStrict 
      ? (todayData.totalCalories <= currentGoal) 
      : (todayData.totalCalories >= currentGoal);
    
    const targetStatus = isTodaySuccess ? 'good' : 'bad';
    let count = 0;

    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(new Date().getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const k = `${year}-${month}-${day}`;
      
      const dayData = history[k];
      if (!dayData && i > 0) break;

      const cals = dayData ? dayData.totalCalories : 0;
      let daySuccess = isStrict ? (cals <= currentGoal) : (cals >= currentGoal);

      if (targetStatus === 'good') {
        if (daySuccess) count++; else break;
      } else {
        if (!daySuccess) count++; else break;
      }
    }
    if (onSuccess) onSuccess({ status: targetStatus, count });
  } catch (e) {
    if (onSuccess) onSuccess({ status: 'good', count: 0 });
  }
};

export const getWaterStreak = async (onSuccess) => {
  try {
    const history = await getHistory();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const k = `${year}-${month}-${day}`;
      
      const dd = history[k];
      if (dd && dd.goal > 0 && dd.water >= dd.goal) streak++;
      else {
        if (i === 0) continue; 
        else break; 
      }
    }
    if (onSuccess) onSuccess(streak);
  } catch (e) { if (onSuccess) onSuccess(0); }
};

// ==========================================
// 4. OUTRAS (FOTOS, COMIDAS CUSTOM, PERFIL)
// ==========================================

export const addCustomFood = async (n, c, cat, unitW, macros, cb) => {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    const foods = json ? JSON.parse(json) : [];
    const nf = { 
      id: Date.now().toString(), name: n, calories: c, category: cat, isCustom: true, unit_weight: unitW || null,
      carbs: macros?.carbs||0, protein: macros?.protein||0, fat: macros?.fat||0, sugar: macros?.sugar||0
    };
    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify([...foods, nf]));
    if (cb) cb(true);
  } catch (e) {}
};

export const getCustomFoods = async (cb) => { try { const j = await AsyncStorage.getItem(CUSTOM_FOODS_KEY); if (cb) cb(j ? JSON.parse(j) : []); } catch (e) {} };

export const savePhotoLog = async (date, uri, w) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    const list = gallery[date] || [];
    gallery[date] = [{ id: Date.now().toString(), uri, weight: w || '' }, ...list];
    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
  } catch (e) {}
};

export const getGallery = async (cb) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); if (cb) cb(j ? JSON.parse(j) : {}); } catch (e) {} };
export const deletePhoto = async (d, id, cb) => { try { const j = await AsyncStorage.getItem(PHOTOS_KEY); let g = j ? JSON.parse(j) : {}; if (g[d]) { g[d] = g[d].filter(i => i.id !== id); if (g[d].length === 0) delete g[d]; await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(g)); if (cb) cb(g); } } catch (e) {} };
export const saveProfile = async (p) => { try { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {} };
export const getProfile = async (cb) => { try { const j = await AsyncStorage.getItem(PROFILE_KEY); if (cb) cb(j ? JSON.parse(j) : null); } catch (e) {} };