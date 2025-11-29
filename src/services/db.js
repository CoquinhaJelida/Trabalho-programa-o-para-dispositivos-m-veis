import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CHAVES DO BANCO DE DADOS ---
const CUSTOM_FOODS_KEY = '@my_custom_foods_v2'; // Mudei o nome para garantir que venha limpo
const PROFILE_KEY = '@user_profile_v2';
const HISTORY_KEY = '@daily_logs_v2';
const PHOTOS_KEY = '@body_photos_v2';

// --- DATA CORRETA (Fuso Horário Local) ---
export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ==========================================
// 1. HISTÓRICO DIÁRIO (Comida + Água + Kcal)
// ==========================================

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    
    // Recupera o dia ou inicia zerado
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    
    // Mescla o que já tinha com o novo dado
    history[date] = { ...currentDay, ...dataToMerge };
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log(`[DB] Salvo em ${date}:`, dataToMerge); // Debug no terminal
  } catch (e) {
    console.error("[DB] Erro ao salvar diário:", e);
  }
};

export const getHistory = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(history);
    return history;
  } catch (e) {
    console.error("[DB] Erro ao ler histórico:", e);
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
      console.log(`[DB] Dia ${date} apagado.`);
      if (onSuccess) onSuccess(true);
    }
  } catch (e) {
    console.error(e);
  }
};

// ==========================================
// 2. STREAKS (Sequências)
// ==========================================

export const getCalorieStreak = async (currentGoal, isStrict, onSuccess) => {
  try {
    const history = await getHistory();
    const todayKey = getTodayKey();
    
    // Verifica hoje
    const todayData = history[todayKey] || { totalCalories: 0 };
    const todayCals = todayData.totalCalories;
    
    // Define se hoje é sucesso ou falha baseado no modo
    let isTodaySuccess = isStrict ? (todayCals <= currentGoal) : (todayCals >= currentGoal);
    
    // Define o status alvo da sequência ('good' ou 'bad')
    const targetStatus = isTodaySuccess ? 'good' : 'bad';
    let count = 0;

    // Conta dias para trás
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(new Date().getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dayData = history[k];
      
      // Se não tem registro no dia (e não é hoje), a sequência quebra
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
      const d = new Date();
      d.setDate(today.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dayData = history[k];
      // Verifica se a meta existe e foi batida
      if (dayData && dayData.goal > 0 && dayData.water >= dayData.goal) {
        streak++;
      } else {
        if (i === 0) continue; // Se hoje ainda não bateu, ignora
        else break; // Quebrou a sequência
      }
    }
    if (onSuccess) onSuccess(streak);
  } catch (e) {
    if (onSuccess) onSuccess(0);
  }
};

// ==========================================
// 3. COMIDAS CUSTOMIZADAS (BUSCA)
// ==========================================

export const addCustomFood = async (name, calories, category, unitWeight, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    const foods = json ? JSON.parse(json) : [];
    
    const newFood = { 
      id: Date.now().toString(), 
      name, 
      calories, 
      category, 
      isCustom: true,
      unit_weight: unitWeight || null 
    };

    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify([...foods, newFood]));
    console.log("[DB] Comida criada:", name);
    if (onSuccess) onSuccess(true);
  } catch (e) {
    console.error(e);
  }
};

export const getCustomFoods = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    const foods = json ? JSON.parse(json) : [];
    if (onSuccess) onSuccess(foods);
  } catch (e) {}
};

// ==========================================
// 4. GALERIA DE FOTOS
// ==========================================

export const savePhotoLog = async (date, uri, weight) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    
    const dayPhotos = gallery[date] || [];
    const newEntry = { id: Date.now().toString(), uri, weight: weight || '' };
    
    gallery[date] = [newEntry, ...dayPhotos];
    
    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
    console.log("[DB] Foto salva em:", date);
  } catch (e) {}
};

export const getGallery = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(gallery);
  } catch (e) {}
};

export const deletePhoto = async (date, id, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    let gallery = json ? JSON.parse(json) : {};
    if (gallery[date]) {
      gallery[date] = gallery[date].filter(i => i.id !== id);
      if (gallery[date].length === 0) delete gallery[date];
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
      if (onSuccess) onSuccess(gallery);
    }
  } catch (e) {}
};

// ==========================================
// 5. PERFIL
// ==========================================

export const saveProfile = async (profileData) => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
  } catch (e) {}
};

export const getProfile = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : null);
  } catch (e) {}
};

// --- FERRAMENTA DE RESET (DEBUG) ---
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    console.log("[DB] BANCO LIMPO!");
  } catch(e) {}
};