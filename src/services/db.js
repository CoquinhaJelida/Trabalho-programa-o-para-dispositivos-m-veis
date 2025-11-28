import AsyncStorage from '@react-native-async-storage/async-storage';

// CHAVES DE ARMAZENAMENTO
const CUSTOM_FOODS_KEY = '@my_custom_foods';
const PROFILE_KEY = '@user_profile';
const HISTORY_KEY = '@daily_logs';
const PHOTOS_KEY = '@body_progress_photos';

// ==========================================
// CORREÇÃO DO RELÓGIO (DATA LOCAL)
// ==========================================
export const getTodayKey = () => {
  const now = new Date(); // Pega a data/hora exata do celular
  const year = now.getFullYear();
  // O mês começa em 0 (janeiro), então somamos +1
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Retorna "YYYY-MM-DD" baseado no horário do Brasil/Celular
  return `${year}-${month}-${day}`;
};

// ==========================================
// FUNÇÕES DE HISTÓRICO (DIÁRIO)
// ==========================================

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    
    // Atualiza mantendo os dados antigos
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
// FUNÇÕES DE FOTOS (GALERIA)
// ==========================================

export const savePhotoLog = async (date, photoUri, weight) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    const dayPhotos = gallery[date] || [];
    
    const newEntry = {
      id: Date.now().toString(),
      uri: photoUri,
      weight: weight || ''
    };

    gallery[date] = [newEntry, ...dayPhotos];
    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
  } catch (e) { console.error(e); }
};

export const getGallery = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(gallery);
    return gallery;
  } catch (e) { return {}; }
};

export const deletePhoto = async (date, photoId, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    let gallery = json ? JSON.parse(json) : {};
    if (gallery[date]) {
      gallery[date] = gallery[date].filter(item => item.id !== photoId);
      if (gallery[date].length === 0) delete gallery[date];
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
      if (onSuccess) onSuccess(gallery);
    }
  } catch (e) { console.error(e); }
};

// ==========================================
// FUNÇÕES DE COMIDA (CUSTOMIZADAS)
// ==========================================

export const addCustomFood = async (name, calories, category, onSuccess) => {
  try {
    const existingJSON = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    const existingFoods = existingJSON ? JSON.parse(existingJSON) : [];
    const newFood = { id: Date.now().toString(), name, calories, category, isCustom: true };
    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify([...existingFoods, newFood]));
    if (onSuccess) onSuccess(true);
  } catch (e) {}
};

export const getCustomFoods = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : []);
  } catch (e) {}
};

// ==========================================
// FUNÇÕES DE PERFIL
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