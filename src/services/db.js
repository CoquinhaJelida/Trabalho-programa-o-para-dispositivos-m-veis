import AsyncStorage from '@react-native-async-storage/async-storage';

// CHAVES DE ARMAZENAMENTO
const CUSTOM_FOODS_KEY = '@my_custom_foods';
const PROFILE_KEY = '@user_profile';
const HISTORY_KEY = '@daily_logs';
const PHOTOS_KEY = '@body_progress_photos';

// DATA LOCAL (BRASIL/CELULAR)
export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ==========================================
// 1. FUNÇÕES DE HISTÓRICO (DIÁRIO)
// ==========================================

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    
    // Recupera o dia atual ou cria um novo
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    
    // Mescla os dados (mantém o que não mudou e atualiza o novo)
    history[date] = { ...currentDay, ...dataToMerge };
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log("Diário salvo:", date, dataToMerge); // Log para debug
  } catch (e) {
    console.error("Erro ao salvar diário:", e);
  }
};

export const getHistory = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(history);
    return history;
  } catch (e) {
    return {};
  }
};

export const getDayLog = async (date, onSuccess) => {
  try {
    const history = await getHistory();
    const dayData = history[date] || { meals: [], water: 0, totalCalories: 0 };
    if (onSuccess) onSuccess(dayData);
    return dayData;
  } catch (e) {
    return { meals: [], water: 0, totalCalories: 0 };
  }
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
  } catch (e) {
    console.error(e);
  }
};

// ==========================================
// 2. FUNÇÕES DE STREAK (CALORIAS E ÁGUA)
// ==========================================

export const getCalorieStreak = async (currentGoal, isStrict, onSuccess) => {
  try {
    const history = await getHistory();
    const todayKey = getTodayKey();
    
    // Verifica status de hoje
    const todayData = history[todayKey] || { totalCalories: 0 };
    const todayCals = todayData.totalCalories;
    
    let isTodaySuccess = false;
    if (isStrict) {
      isTodaySuccess = todayCals <= currentGoal; // Modo Rígido: Não passar
    } else {
      isTodaySuccess = todayCals >= currentGoal; // Modo Flex: Atingir
    }

    const targetStatus = isTodaySuccess ? 'good' : 'bad';
    let count = 0;

    // Checa dias anteriores
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(new Date().getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dayData = history[k];
      if (!dayData && i > 0) break; // Parar se não tem registro (exceto hoje)

      const cals = dayData ? dayData.totalCalories : 0;
      let daySuccess = false;
      
      if (isStrict) daySuccess = cals <= currentGoal;
      else daySuccess = cals >= currentGoal;

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
      const d = new Date();
      d.setDate(today.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dayData = history[k];
      if (dayData && dayData.goal > 0 && dayData.water >= dayData.goal) {
        streak++;
      } else {
        if (i === 0) continue; // Se hoje ainda não bateu, ignora e vê ontem
        else break;
      }
    }
    if (onSuccess) onSuccess(streak);
  } catch (e) {
    if (onSuccess) onSuccess(0);
  }
};

// ==========================================
// 3. OUTRAS FUNÇÕES (COMIDA, PERFIL, FOTOS)
// ==========================================

export const addCustomFood = async (name, calories, category, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    const foods = json ? JSON.parse(json) : [];
    const newFood = { id: Date.now().toString(), name, calories, category, isCustom: true };
    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify([...foods, newFood]));
    if (onSuccess) onSuccess(true);
  } catch (e) {}
};

export const getCustomFoods = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : []);
  } catch (e) {}
};

export const saveProfile = async (data) => {
  try { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data)); } catch (e) {}
};

export const getProfile = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : null);
  } catch (e) {}
};

export const savePhotoLog = async (date, uri, weight) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    const list = gallery[date] || [];
    gallery[date] = [{ id: Date.now().toString(), uri, weight }, ...list];
    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
  } catch (e) {}
};

export const getGallery = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : {});
  } catch (e) {}
};

export const deletePhoto = async (date, id, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    if (gallery[date]) {
      gallery[date] = gallery[date].filter(i => i.id !== id);
      if (gallery[date].length === 0) delete gallery[date];
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
      if (onSuccess) onSuccess(gallery);
    }
  } catch (e) {}
};