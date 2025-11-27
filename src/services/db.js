import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves de armazenamento
const CUSTOM_FOODS_KEY = '@my_custom_foods';
const PROFILE_KEY = '@user_profile';
const HISTORY_KEY = '@daily_logs';
const PHOTOS_KEY = '@body_progress_photos';

export const getTodayKey = () => new Date().toISOString().split('T')[0];

// ==========================================
// FUNÇÕES DE GALERIA (FOTOS + PESO)
// ==========================================

export const savePhotoLog = async (date, photoUri, weight) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    const gallery = json ? JSON.parse(json) : {};

    const dayPhotos = gallery[date] || [];
    
    // Agora salvamos um OBJETO com uri e peso
    const newEntry = {
      id: Date.now().toString(),
      uri: photoUri,
      weight: weight || '' // Peso opcional
    };

    gallery[date] = [newEntry, ...dayPhotos]; // Adiciona no começo da lista

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
    return {};
  }
};

export const deletePhoto = async (date, photoId, onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PHOTOS_KEY);
    let gallery = json ? JSON.parse(json) : {};
    
    if (gallery[date]) {
      // Filtra removendo o item com aquele ID
      gallery[date] = gallery[date].filter(item => item.id !== photoId);
      
      if (gallery[date].length === 0) delete gallery[date];
      
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(gallery));
      if (onSuccess) onSuccess(gallery);
    }
  } catch (e) {
    console.error(e);
  }
};

// ... MANTENHA AS OUTRAS FUNÇÕES (addCustomFood, getProfile, etc.) IGUAIS ABAIXO ...
// (Para facilitar, vou repetir as outras aqui para você copiar o arquivo inteiro sem erro)

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const history = json ? JSON.parse(json) : {};
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    history[date] = { ...currentDay, ...dataToMerge };
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
};

export const getHistory = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    const h = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(h);
  } catch (e) {}
};

export const getDayLog = async (date, onSuccess) => {
  try {
    const history = await getHistory();
    const d = history[date] || { meals: [], water: 0, totalCalories: 0 };
    if (onSuccess) onSuccess(d);
  } catch (e) {}
};

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
    const f = json ? JSON.parse(json) : [];
    if (onSuccess) onSuccess(f);
  } catch (e) {}
};

export const saveProfile = async (profileData) => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
  } catch (e) {}
};

export const getProfile = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    const p = json ? JSON.parse(json) : null;
    if (onSuccess) onSuccess(p);
  } catch (e) {}
};