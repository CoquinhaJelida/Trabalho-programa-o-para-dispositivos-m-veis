import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// --- NOMES BASE DAS CHAVES (Agora serão dinâmicos) ---
const BASE_CUSTOM_FOODS = '@my_custom_foods_v3'; 
const BASE_PROFILE = '@user_profile_v2';
const BASE_HISTORY = '@daily_logs_v3';
const BASE_PHOTOS = '@body_photos_v2';
const BASE_FASTING = '@fasting_data_v2';
const BASE_FASTING_HIST = '@fasting_history_v2';
const BASE_STATS = '@gamification_stats_v2';
const BASE_CHALLENGES = '@challenges_data_v1';

export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- HELPER: GERAR CHAVE ÚNICA POR USUÁRIO ---
// Transforma '@perfil' em '@perfil_UID12345'
const getUserKey = (baseKey) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return baseKey; // Fallback de segurança
  return `${baseKey}_${uid}`;
};

// --- HELPER: SYNC COM FIREBASE ---
const syncToCloud = async (field, data) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { [field]: data }, { merge: true });
    }
  } catch (e) { console.log(`[CLOUD] Erro sync ${field}:`, e.message); }
};

const syncFromCloud = async (field, baseKey, onSuccess) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const cloudData = docSnap.data()[field];
        if (cloudData) {
          // Salva na chave específica do usuário
          const userKey = getUserKey(baseKey);
          await AsyncStorage.setItem(userKey, JSON.stringify(cloudData));
          if (onSuccess) onSuccess(cloudData);
        }
      }
    }
  } catch (e) { console.log(`[CLOUD] Erro load ${field}:`, e.message); }
};

// ==========================================
// 1. REFEIÇÕES (HÍBRIDO + MULTI-USUÁRIO)
// ==========================================

export const addMealToDay = async (mealItem, onSuccess) => {
  try {
    const today = getTodayKey();
    const key = getUserKey(BASE_HISTORY); // Chave do usuário
    
    const json = await AsyncStorage.getItem(key);
    const history = json ? JSON.parse(json) : {};
    
    const currentDay = history[today] || { meals: [], water: 0, totalCalories: 0 };
    const newMealsList = [mealItem, ...currentDay.meals];
    const newTotal = newMealsList.reduce((acc, curr) => acc + Number(curr.calories), 0);
    
    history[today] = { ...currentDay, meals: newMealsList, totalCalories: newTotal };
    
    await AsyncStorage.setItem(key, JSON.stringify(history));
    if (onSuccess) onSuccess(newMealsList, newTotal);

    syncToCloud('history', history);
  } catch (e) { console.error(e); }
};

export const deleteMealFromHistory = async (date, mealId, onSuccess) => {
  try {
    const key = getUserKey(BASE_HISTORY);
    const json = await AsyncStorage.getItem(key);
    let history = json ? JSON.parse(json) : {};
    if (history[date] && history[date].meals) {
      const newMeals = history[date].meals.filter(m => m.id !== mealId);
      const newTotal = newMeals.reduce((acc, c) => acc + Number(c.calories), 0);
      history[date] = { ...history[date], meals: newMeals, totalCalories: newTotal };
      await AsyncStorage.setItem(key, JSON.stringify(history));
      if (onSuccess) onSuccess(newMeals, newTotal);
      syncToCloud('history', history);
    }
  } catch (e) {}
};

export const saveDailyLog = async (date, dataToMerge) => {
  try {
    const key = getUserKey(BASE_HISTORY);
    const json = await AsyncStorage.getItem(key);
    const history = json ? JSON.parse(json) : {};
    const currentDay = history[date] || { meals: [], water: 0, totalCalories: 0 };
    history[date] = { ...currentDay, ...dataToMerge };
    await AsyncStorage.setItem(key, JSON.stringify(history));
    syncToCloud('history', history);
  } catch (e) {}
};

export const getDayLog = async (date, onSuccess) => {
  try {
    const key = getUserKey(BASE_HISTORY);
    const json = await AsyncStorage.getItem(key);
    const history = json ? JSON.parse(json) : {};
    const dayData = history[date] || { meals: [], water: 0, totalCalories: 0 };
    if (onSuccess) onSuccess(dayData);
  } catch (e) { if(onSuccess) onSuccess({ meals: [], water: 0, totalCalories: 0 }); }
};

export const getHistory = async (onSuccess) => {
  try {
    const key = getUserKey(BASE_HISTORY);
    const json = await AsyncStorage.getItem(key);
    const history = json ? JSON.parse(json) : {};
    if (onSuccess) onSuccess(history);
    syncFromCloud('history', BASE_HISTORY, onSuccess);
  } catch (e) { if(onSuccess) onSuccess({}); }
};

export const deleteDailyLog = async (date, onSuccess) => { 
  try { 
    const key = getUserKey(BASE_HISTORY);
    const j = await AsyncStorage.getItem(key); 
    let h = j?JSON.parse(j):{}; 
    if(h[date]) { 
      delete h[date]; 
      await AsyncStorage.setItem(key, JSON.stringify(h)); 
      if(onSuccess) onSuccess(true); 
      syncToCloud('history', h); 
    } 
  } catch(e){} 
};

// ==========================================
// 2. PERFIL
// ==========================================
export const saveProfile = async (profileData) => {
  try {
    const key = getUserKey(BASE_PROFILE);
    await AsyncStorage.setItem(key, JSON.stringify(profileData));
    syncToCloud('profile', profileData);
  } catch (e) {}
};
export const getProfile = async (onSuccess) => {
  try {
    const key = getUserKey(BASE_PROFILE);
    const json = await AsyncStorage.getItem(key);
    if (json && onSuccess) onSuccess(JSON.parse(json));
    syncFromCloud('profile', BASE_PROFILE, onSuccess);
  } catch (e) {}
};

// ==========================================
// 3. GAMIFICAÇÃO
// ==========================================
export const getUserStats = async (cb) => { 
  try { 
    const key = getUserKey(BASE_STATS);
    const j = await AsyncStorage.getItem(key); 
    const s = j ? JSON.parse(j) : { level: 1, currentXP: 0, nextLevelXP: 100 }; 
    if (cb) cb(s); 
    syncFromCloud('gamification', BASE_STATS, cb); 
    return s; 
  } catch (e) { return { level: 1, currentXP: 0, nextLevelXP: 100 }; } 
};
export const addXP = async (amt, cb) => { 
  try { 
    const key = getUserKey(BASE_STATS);
    const j = await AsyncStorage.getItem(key); 
    let s = j ? JSON.parse(j) : { level: 1, currentXP: 0, nextLevelXP: 100 }; 
    s.currentXP += amt; let lu = false; 
    while (s.currentXP >= s.nextLevelXP) { s.currentXP -= s.nextLevelXP; s.level++; s.nextLevelXP = Math.round(s.nextLevelXP * 1.2); lu = true; } 
    await AsyncStorage.setItem(key, JSON.stringify(s)); 
    if (cb) cb(s, lu); 
    syncToCloud('gamification', s); 
  } catch (e) {} 
};

// ==========================================
// 4. JEJUM
// ==========================================
export const saveFastingState = async (s, g, i) => { 
  const d = { startTime:s, goalHours:g, isFasting:i }; 
  await AsyncStorage.setItem(getUserKey(BASE_FASTING), JSON.stringify(d)); 
  syncToCloud('fastingState', d); 
};
export const getFastingState = async (cb) => { 
  const j = await AsyncStorage.getItem(getUserKey(BASE_FASTING)); 
  if(cb) cb(j?JSON.parse(j):null); 
  syncFromCloud('fastingState', BASE_FASTING, cb); 
};
export const saveFastingLog = async (s, e, d, g) => { 
  const key = getUserKey(BASE_FASTING_HIST);
  const j = await AsyncStorage.getItem(key); 
  const h = j?JSON.parse(j):[]; 
  const nl={id:Date.now().toString(), startTime:s, endTime:e, durationSeconds:d, goalHours:g, date:new Date(e).toISOString().split('T')[0]}; 
  const nh = [nl, ...h]; 
  await AsyncStorage.setItem(key, JSON.stringify(nh)); 
  syncToCloud('fastingHistory', nh); 
};
export const getFastingHistory = async (cb) => { 
  const j = await AsyncStorage.getItem(getUserKey(BASE_FASTING_HIST)); 
  if(cb) cb(j?JSON.parse(j):[]); 
  syncFromCloud('fastingHistory', BASE_FASTING_HIST, cb); 
};
export const deleteFastingLog = async (id, cb) => { 
  const key = getUserKey(BASE_FASTING_HIST);
  const j = await AsyncStorage.getItem(key); 
  let h = j?JSON.parse(j):[]; 
  h=h.filter(i=>i.id!==id); 
  await AsyncStorage.setItem(key, JSON.stringify(h)); 
  if(cb) cb(h); 
  syncToCloud('fastingHistory', h); 
};

// ==========================================
// 5. ALIMENTOS & FOTOS
// ==========================================

// Alimentos Customizados (Agora salvos por usuário localmente também)
export const addCustomFood = async (n, c, cat, uw, m, cb) => { 
  try {
    const key = getUserKey(BASE_CUSTOM_FOODS);
    // Salva local (User específico)
    const j = await AsyncStorage.getItem(key); const f = j ? JSON.parse(j) : [];
    const newFood = { id: Date.now().toString(), name: n, calories: c, category: cat, isCustom: true, unit_weight: uw || null, carbs: m?.carbs||0, protein: m?.protein||0, fat: m?.fat||0, sugar: m?.sugar||0, createdBy: auth.currentUser?.uid };
    const updatedList = [...f, newFood];
    await AsyncStorage.setItem(key, JSON.stringify(updatedList));
    if (cb) cb(true);

    // Salva GLOBAL no Firebase (Coleção separada, não no user doc)
    await addDoc(collection(db, "global_foods"), newFood);

  } catch (e) {} 
};

export const getCustomFoods = async (cb) => { 
  try {
    const key = getUserKey(BASE_CUSTOM_FOODS);
    // 1. Local do Usuário
    const j = await AsyncStorage.getItem(key); 
    if(cb) cb(j ? JSON.parse(j) : []); 
    
    // 2. Global (Traz novos da comunidade)
    const q = query(collection(db, "global_foods"), limit(100)); 
    const querySnapshot = await getDocs(q);
    const globalFoods = [];
    querySnapshot.forEach((doc) => globalFoods.push({ id: doc.id, ...doc.data() }));
    if (globalFoods.length > 0) {
        // Mescla com local (poderia ser mais sofisticado, mas sobrescreve o cache por enquanto para simplificar)
        await AsyncStorage.setItem(key, JSON.stringify(globalFoods));
        if (cb) cb(globalFoods);
    }
  } catch (e) {} 
};

export const savePhotoLog = async (d, u, w, m) => { 
  try { 
    const key = getUserKey(BASE_PHOTOS);
    const j = await AsyncStorage.getItem(key); 
    const g = j ? JSON.parse(j) : {}; 
    const l = g[d] || []; 
    g[d] = [{ id: Date.now().toString(), uri: u, weight: w || '', measurements: m||{} }, ...l]; 
    await AsyncStorage.setItem(key, JSON.stringify(g)); 
    syncToCloud('photos', g); 
  } catch (e) {} 
};
export const getGallery = async (cb) => { 
  const j = await AsyncStorage.getItem(getUserKey(BASE_PHOTOS)); 
  if (cb) cb(j ? JSON.parse(j) : {}); 
  syncFromCloud('photos', BASE_PHOTOS, cb); 
};
export const deletePhoto = async (d, id, cb) => { 
  const key = getUserKey(BASE_PHOTOS);
  const j = await AsyncStorage.getItem(key); 
  let g = j ? JSON.parse(j) : {}; 
  if (g[d]) { g[d] = g[d].filter(i => i.id !== id); if (g[d].length === 0) delete g[d]; await AsyncStorage.setItem(key, JSON.stringify(g)); if (cb) cb(g); syncToCloud('photos', g); } 
};

export const getChallengeStatus = async (cb) => { 
  const j = await AsyncStorage.getItem(getUserKey(BASE_CHALLENGES)); 
  if(cb) cb(j?JSON.parse(j):{}); 
  syncFromCloud('challenges', BASE_CHALLENGES, cb); 
};
export const claimChallengeReward = async (cid, xp, cb) => { 
  const key = getUserKey(BASE_CHALLENGES);
  const j = await AsyncStorage.getItem(key); 
  const s = j?JSON.parse(j):{}; s[cid]=true; 
  await AsyncStorage.setItem(key, JSON.stringify(s)); 
  await addXP(xp, (ns,lu)=>cb(ns,lu)); 
  syncToCloud('challenges', s); 
};

export const getGlobalStats = async (cb) => { 
  try { 
    const hj = await AsyncStorage.getItem(getUserKey(BASE_HISTORY)); 
    const fj = await AsyncStorage.getItem(getUserKey(BASE_FASTING_HIST)); 
    const h = hj?JSON.parse(hj):{}; 
    const f = fj?JSON.parse(fj):[]; 
    const tm = Object.values(h).reduce((a,d)=>a+(d.meals?d.meals.length:0),0); 
    const tf = f.length; 
    const mf = f.reduce((mx,c)=>Math.max(mx,c.durationSeconds||0),0); 
    if(cb) cb({totalMeals:tm, totalFasts:tf, maxFastingTime:mf}); 
  } catch(e){} 
};
export const getCalorieStreak = async (g, s, cb) => { try { const h = await AsyncStorage.getItem(getUserKey(BASE_HISTORY)).then(r=>r?JSON.parse(r):{}); const t = getTodayKey(); const td = h[t] || { totalCalories: 0 }; let suc = s ? (td.totalCalories <= g) : (td.totalCalories >= g); const st = suc ? 'good' : 'bad'; let c = 0; for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(new Date().getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if (!dd && i > 0) break; const cl = dd ? dd.totalCalories : 0; let ds = s ? (cl <= g) : (cl >= g); if (st === 'good') { if (ds) c++; else break; } else { if (!ds) c++; else break; } } if (cb) cb({ status: st, count: c }); } catch (e) { if (cb) cb({ status: 'good', count: 0 }); } };
export const getWaterStreak = async (cb) => { try { const h = await AsyncStorage.getItem(getUserKey(BASE_HISTORY)).then(r=>r?JSON.parse(r):{}); let s = 0; const t = new Date(); for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(t.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if (dd && dd.goal > 0 && dd.water >= dd.goal) s++; else { if (i === 0) continue; else break; } } if (cb) cb(s); } catch (e) { if (cb) cb(0); } };
// ... MANTENHA OS IMPORTS E CHAVES ANTERIORES ...
const BG_IMAGE_KEY = '@custom_background_v1';

// ... MANTENHA AS OUTRAS FUNÇÕES IGUAIS ...

// ==========================================
// 6. CUSTOMIZAÇÃO (PAPEL DE PAREDE)
// ==========================================

export const saveBackgroundImage = async (uri) => {
  try {
    // Se uri for null, remove a chave (volta ao padrão)
    if (!uri) {
      await AsyncStorage.removeItem(getUserKey(BG_IMAGE_KEY));
    } else {
      await AsyncStorage.setItem(getUserKey(BG_IMAGE_KEY), uri);
    }
    // Opcional: Sync com nuvem se quiser (mas bg costuma ser local)
  } catch (e) { console.error(e); }
};

export const getBackgroundImage = async (onSuccess) => {
  try {
    const uri = await AsyncStorage.getItem(getUserKey(BG_IMAGE_KEY));
    if (onSuccess) onSuccess(uri);
    return uri;
  } catch (e) { return null; }
};