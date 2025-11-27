import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_FOODS_KEY = '@my_custom_foods';
const PROFILE_KEY = '@user_profile';
const HISTORY_KEY = '@daily_logs';
const PHOTOS_KEY = '@body_progress_photos';

// --- AJUDANTE DE DATA ---
export const getTodayKey = () => new Date().toISOString().split('T')[0];

// ==========================================
// FUNÇÕES DE HISTÓRICO (DIÁRIO)
// ==========================================

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    
    // Mescla os dados novos com o que já existia no dia
    history[date] = { ...currentDay, ...dataToMerge };
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
    console.error("Erro ao ler histórico:", e);
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

// ==========================================
// FUNÇÕES DE COMIDA
// ==========================================

export const addCustomFood = async (name, calories, category, onSuccess) => {
  try {
    const existingJSON = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    const existingFoods = existingJSON ? JSON.parse(existingJSON) : [];
    const newFood = { id: Date.now().toString(), name, calories, category, isCustom: true };
    const updatedFoods = [...existingFoods, newFood];
    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updatedFoods));
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
  } catch (e) { console.error(e); }
};

// ==========================================
// FUNÇÕES DE PERFIL
// ==========================================

export const saveProfile = async (profileData) => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
  } catch (e) { console.error(e); }
};

export const getProfile = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    const profile = json ? JSON.parse(json) : null;
    if (onSuccess) onSuccess(profile);
  } catch (e) { console.error(e); }
};

// ==========================================
// FUNÇÕES DE GALERIA (FOTOS)
// ==========================================

export const savePhotoLog = async (date, photoUri) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};

    // Se já tem fotos nesse dia, adiciona na lista, senão cria uma nova lista
    const dayPhotos = gallery[date] || [];
    gallery[date] = [...dayPhotos, photoUri];

    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
  } catch (e) {
    console.error("Erro ao salvar foto:", e);
  }
};

export const getGallery = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(gallery);
    return gallery;
  } catch (e) {
    console.error("Erro ao ler galeria:", e);
    return {};
  }
};

export const deletePhoto = async (date, photoUri, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    let gallery = json ? JSON.parse(json) : {};
    
    if (gallery[date]) {
      gallery[date] = gallery[date].filter(uri => uri !== photoUri);
      // Se não sobrou foto no dia, deleta a chave do dia
      if (gallery[date].length === 0) delete gallery[date];
      
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
      if (onSuccess) onSuccess(gallery);
    }
  } catch (e) {
    console.error(e);
  }
};