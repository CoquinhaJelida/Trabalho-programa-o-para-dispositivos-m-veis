import AsyncStorage from '@react-native-async-storage/async-storage';

// CHAVES DE ARMAZENAMENTO
const CUSTOM_FOODS_KEY = '@my_custom_foods';
const PROFILE_KEY = '@user_profile';
const HISTORY_KEY = '@daily_logs'; // Onde salvamos o histórico de kcal/água
const PHOTOS_KEY = '@body_progress_photos';

// Pega data de hoje (YYYY-MM-DD)
export const getTodayKey = () => new Date().toISOString().split('T')[0];

// --- FUNÇÕES DE HISTÓRICO (IMPORTANTE PARA A BARRINHA) ---

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    
    // Pega o que já tem no dia ou cria zerado
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    
    // Atualiza apenas o que mudou (ex: só as refeições, mantendo a água)
    history[date] = { ...currentDay, ...dataToMerge };
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log("Salvo com sucesso:", history[date]); // Debug
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

// --- FUNÇÕES DE FOTOS (GALERIA) ---
export const savePhotoLog = async (date, photoUri, weight) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    const dayPhotos = gallery[date] || [];
    const newEntry = { id: Date.now().toString(), uri: photoUri, weight: weight || '' };
    gallery[date] = [newEntry, ...dayPhotos];
    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
  } catch (e) { console.error(e); }
};

export const getGallery = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(gallery);
  } catch (e) {}
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
  } catch (e) {}
};

// --- FUNÇÕES DE COMIDA (BUSCA) ---
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

// --- FUNÇÕES DE PERFIL ---
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