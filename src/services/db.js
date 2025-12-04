import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  doc, getDoc, setDoc, collection, addDoc, getDocs, query, limit, updateDoc, arrayUnion, increment, deleteDoc, where 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// --- CHAVES LOCAIS (V4) ---
const BASE_CUSTOM_FOODS = '@my_custom_foods_v4'; 
const BASE_PROFILE = '@user_profile_v4';
const BASE_HISTORY = '@daily_logs_v4';
const BASE_PHOTOS = '@body_photos_v4';
const BASE_FASTING = '@fasting_data_v4';
const BASE_FASTING_HIST = '@fasting_history_v4';
const BASE_STATS = '@gamification_stats_v4';
const BASE_CHALLENGES = '@challenges_data_v4';
const BASE_BG = '@user_bg_v1';

// --- HELPER: DATA ---
export const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};

// --- HELPER: CHAVE DE USUÁRIO ---
const getUserKey = (baseKey) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null; 
  return `${baseKey}_${uid}`;
};

// --- HELPER: SINCRONIZAÇÃO NUVEM ---
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
          const key = getUserKey(baseKey);
          if (key) await AsyncStorage.setItem(key, JSON.stringify(cloudData));
          if (onSuccess) onSuccess(cloudData);
        }
      }
    }
  } catch (e) { console.log(`[CLOUD] Erro load ${field}:`, e.message); }
};

// ==========================================
// 1. COMUNIDADE & SOCIAL (ADMIN E MEMBROS)
// ==========================================

export const createChatRoom = async (name, description, color, onSuccess) => {
  try {
    const newRoom = {
      name,
      description,
      color, 
      members: 1,
      createdBy: auth.currentUser?.uid,
      createdAt: new Date().toISOString(),
      banned_users: [],
      photo: null
    };
    const docRef = await addDoc(collection(db, "chat_rooms"), newRoom);
    await joinCommunity(docRef.id);
    if (onSuccess) onSuccess(true);
  } catch (e) { console.error(e); }
};

export const getChatRooms = async (onSuccess) => {
  try {
    const q = query(collection(db, "chat_rooms"), limit(50));
    const querySnapshot = await getDocs(q);
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    if (onSuccess) onSuccess(rooms);
  } catch (e) { if (onSuccess) onSuccess([]); }
};

// Busca membros de uma sala específica (NOVO)
export const getRoomMembers = async (roomId, onSuccess) => {
  try {
    const q = query(collection(db, "users"), where("joined_rooms", "array-contains", roomId));
    const querySnapshot = await getDocs(q);
    const members = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.profile) {
        members.push({
          id: doc.id,
          name: data.profile.name || 'Usuário',
          photo: data.profile.photo || null,
          level: data.gamification?.level || 1
        });
      }
    });
    if (onSuccess) onSuccess(members);
  } catch (e) {
    console.error("Erro members:", e);
    if (onSuccess) onSuccess([]);
  }
};

export const joinCommunity = async (roomId, onSuccess, onError) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, "chat_rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      const banned = roomSnap.data().banned_users || [];
      if (banned.includes(user.uid)) {
        if (onError) onError("Você foi banido desta comunidade.");
        return;
      }
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { joined_rooms: arrayUnion(roomId) });
    await updateDoc(roomRef, { members: increment(1) });

    if (onSuccess) onSuccess(true);
  } catch (e) { console.error(e); }
};

export const checkMembership = async (roomId, onSuccess) => {
  try {
    const user = auth.currentUser;
    if (!user) { onSuccess(false); return; }
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      const joined = docSnap.data().joined_rooms || [];
      onSuccess(joined.includes(roomId));
    } else { onSuccess(false); }
  } catch (e) { onSuccess(false); }
};

// --- FUNÇÕES DE ADMIN ---
export const updateChatRoom = async (roomId, newData, onSuccess) => {
  try {
    const roomRef = doc(db, "chat_rooms", roomId);
    await updateDoc(roomRef, newData);
    if (onSuccess) onSuccess(true);
  } catch (e) { console.error(e); }
};

export const deleteChatRoom = async (roomId, onSuccess) => {
  try {
    const roomRef = doc(db, "chat_rooms", roomId);
    await deleteDoc(roomRef);
    if (onSuccess) onSuccess(true);
  } catch (e) { console.error(e); }
};

export const banUserFromRoom = async (roomId, userId, onSuccess) => {
  try {
    const roomRef = doc(db, "chat_rooms", roomId);
    await updateDoc(roomRef, { banned_users: arrayUnion(userId) });
    if (onSuccess) onSuccess(true);
  } catch (e) { console.error(e); }
};

// --- PERFIS PÚBLICOS ---
export const getAllUsers = async (onSuccess) => {
  try {
    const q = query(collection(db, "users"), limit(20));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.profile && doc.id !== auth.currentUser?.uid) {
        users.push({
          id: doc.id,
          name: data.profile.name || 'Usuário',
          photo: data.profile.photo || null,
          level: data.gamification?.level || 1,
          objective: data.profile.objective || 'maintain'
        });
      }
    });
    if (onSuccess) onSuccess(users);
  } catch (e) { if (onSuccess) onSuccess([]); }
};

export const getPublicUserProfile = async (uid, onSuccess) => {
  try {
    const d = await getDoc(doc(db, "users", uid));
    if (d.exists()) {
      const dt = d.data();
      onSuccess({
        name: dt.profile?.name,
        photo: dt.profile?.photo,
        level: dt.gamification?.level,
        xp: dt.gamification?.currentXP,
        objective: dt.profile?.objective,
        stats: {
          mealsLogged: dt.history ? Object.keys(dt.history).length : 0,
          fastsCompleted: (dt.fastingHistory || []).length
        }
      });
    }
  } catch (e) {}
};

// ==========================================
// 2. REFEIÇÕES E DIÁRIO
// ==========================================

export const addMealToDay = async (mealItem, onSuccess) => {
  try {
    const key = getUserKey(BASE_HISTORY);
    if (!key) return;
    const today = getTodayKey();
    
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
    if (!key) return;
    
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
    if (!key) return;
    
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
    if (!key) { if(onSuccess) onSuccess({ meals: [], water: 0, totalCalories: 0 }); return; }
    
    const json = await AsyncStorage.getItem(key);
    const history = json ? JSON.parse(json) : {};
    const dayData = history[date] || { meals: [], water: 0, totalCalories: 0 };
    
    if (onSuccess) onSuccess(dayData);
  } catch (e) { if(onSuccess) onSuccess({ meals: [], water: 0, totalCalories: 0 }); }
};

export const getHistory = async (onSuccess) => {
  try {
    const key = getUserKey(BASE_HISTORY);
    if (!key) { if(onSuccess) onSuccess({}); return; }
    
    const json = await AsyncStorage.getItem(key);
    const history = json ? JSON.parse(json) : {};
    
    if (onSuccess) onSuccess(history);
    syncFromCloud('history', BASE_HISTORY, onSuccess);
  } catch (e) { if(onSuccess) onSuccess({}); }
};

export const deleteDailyLog = async (date, onSuccess) => {
  try {
    const key = getUserKey(BASE_HISTORY);
    if (!key) return;
    
    const json = await AsyncStorage.getItem(key);
    let history = json ? JSON.parse(json) : {};
    
    if (history[date]) {
      delete history[date];
      await AsyncStorage.setItem(key, JSON.stringify(history));
      if (onSuccess) onSuccess(true);
      syncToCloud('history', history);
    }
  } catch (e) {}
};

// ==========================================
// 3. PERFIL
// ==========================================
export const saveProfile = async (profileData) => {
  try {
    const key = getUserKey(BASE_PROFILE);
    if (!key) return;
    await AsyncStorage.setItem(key, JSON.stringify(profileData));
    syncToCloud('profile', profileData);
  } catch (e) {}
};

export const getProfile = async (onSuccess) => {
  try {
    const key = getUserKey(BASE_PROFILE);
    if (!key) { if(onSuccess) onSuccess(null); return; }
    
    const json = await AsyncStorage.getItem(key);
    if (json && onSuccess) onSuccess(JSON.parse(json));
    syncFromCloud('profile', BASE_PROFILE, onSuccess);
  } catch (e) {}
};

// ==========================================
// 4. GAMIFICAÇÃO (XP)
// ==========================================
export const getUserStats = async (onSuccess) => {
  try {
    const key = getUserKey(BASE_STATS);
    if (!key) { 
      if(onSuccess) onSuccess({level:1, currentXP:0, nextLevelXP:100}); 
      return {level:1, currentXP:0, nextLevelXP:100}; 
    }
    const json = await AsyncStorage.getItem(key);
    const stats = json ? JSON.parse(json) : { level: 1, currentXP: 0, nextLevelXP: 100 };
    
    if (onSuccess) onSuccess(stats);
    syncFromCloud('gamification', BASE_STATS, onSuccess);
    return stats;
  } catch (e) { return { level: 1, currentXP: 0, nextLevelXP: 100 }; }
};

export const addXP = async (amount, onSuccess) => {
  try {
    const key = getUserKey(BASE_STATS);
    if (!key) return;
    
    const json = await AsyncStorage.getItem(key);
    let stats = json ? JSON.parse(json) : { level: 1, currentXP: 0, nextLevelXP: 100 };
    
    stats.currentXP += amount;
    let leveledUp = false;
    
    while (stats.currentXP >= stats.nextLevelXP) {
      stats.currentXP -= stats.nextLevelXP;
      stats.level++;
      stats.nextLevelXP = Math.round(stats.nextLevelXP * 1.2);
      leveledUp = true;
    }
    
    await AsyncStorage.setItem(key, JSON.stringify(stats));
    if (onSuccess) onSuccess(stats, leveledUp);
    syncToCloud('gamification', stats);
  } catch (e) {}
};

// ==========================================
// 5. JEJUM
// ==========================================
export const saveFastingState = async (startTime, goalHours, isFasting) => {
  try {
    const key = getUserKey(BASE_FASTING); if (!key) return;
    const data = { startTime, goalHours, isFasting };
    await AsyncStorage.setItem(key, JSON.stringify(data));
    syncToCloud('fastingState', data);
  } catch(e){}
};

export const getFastingState = async (onSuccess) => {
  try {
    const key = getUserKey(BASE_FASTING); if (!key) { if(onSuccess) onSuccess(null); return; }
    const json = await AsyncStorage.getItem(key);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : null);
    syncFromCloud('fastingState', BASE_FASTING, onSuccess);
  } catch(e){}
};

export const saveFastingLog = async (startTime, endTime, durationSeconds, goalHours) => {
  try {
    const key = getUserKey(BASE_FASTING_HIST); if (!key) return;
    const json = await AsyncStorage.getItem(key);
    const history = json ? JSON.parse(json) : [];
    const newLog = {
      id: Date.now().toString(), 
      startTime, endTime, durationSeconds, goalHours, 
      date: new Date(endTime).toISOString().split('T')[0]
    };
    const newHistory = [newLog, ...history];
    await AsyncStorage.setItem(key, JSON.stringify(newHistory));
    syncToCloud('fastingHistory', newHistory);
  } catch(e){}
};

export const getFastingHistory = async (onSuccess) => {
  try {
    const key = getUserKey(BASE_FASTING_HIST); if (!key) { if(onSuccess) onSuccess([]); return; }
    const json = await AsyncStorage.getItem(key);
    if (onSuccess) onSuccess(json ? JSON.parse(json) : []);
    syncFromCloud('fastingHistory', BASE_FASTING_HIST, onSuccess);
  } catch(e){}
};

export const deleteFastingLog = async (id, onSuccess) => {
  try {
    const key = getUserKey(BASE_FASTING_HIST); if (!key) return;
    const json = await AsyncStorage.getItem(key);
    let history = json ? JSON.parse(json) : [];
    history = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(key, JSON.stringify(history));
    if (onSuccess) onSuccess(history);
    syncToCloud('fastingHistory', history);
  } catch(e){}
};

// ==========================================
// 6. ALIMENTOS, FOTOS, STREAKS
// ==========================================
export const addCustomFood = async (n, c, cat, uw, m, cb) => {
  try {
    const key = getUserKey(BASE_CUSTOM_FOODS); if(!key) return;
    const j = await AsyncStorage.getItem(key); const f = j ? JSON.parse(j) : [];
    const newFood = { id: Date.now().toString(), name: n, calories: c, category: cat, isCustom: true, unit_weight: uw || null, carbs: m?.carbs||0, protein: m?.protein||0, fat: m?.fat||0, sugar: m?.sugar||0, createdBy: auth.currentUser?.uid };
    const updatedList = [...f, newFood];
    await AsyncStorage.setItem(key, JSON.stringify(updatedList));
    if (cb) cb(true);
    await addDoc(collection(db, "global_foods"), newFood);
  } catch (e) {}
};

export const getCustomFoods = async (cb) => {
  try {
    const key = getUserKey(BASE_CUSTOM_FOODS); if (!key) { if(cb) cb([]); return; }
    const j = await AsyncStorage.getItem(key); 
    if (cb) cb(j ? JSON.parse(j) : []); 
    const q = query(collection(db, "global_foods"), limit(100));
    const qs = await getDocs(q);
    const globalFoods = [];
    qs.forEach((doc) => globalFoods.push({ id: doc.id, ...doc.data() }));
    if (globalFoods.length > 0 && cb) {
      cb([...(j ? JSON.parse(j) : []), ...globalFoods]);
    }
  } catch (e) {}
};

export const savePhotoLog = async (d, u, w, m) => {
  try {
    const key = getUserKey(BASE_PHOTOS); if(!key) return;
    const j = await AsyncStorage.getItem(key); const g = j ? JSON.parse(j) : {}; 
    const l = g[d] || [];
    g[d] = [{ id: Date.now().toString(), uri: u, weight: w || '', measurements: m||{} }, ...l];
    await AsyncStorage.setItem(key, JSON.stringify(g));
    syncToCloud('photos', g);
  } catch (e) {}
};

export const getGallery = async (cb) => {
  try {
    const key = getUserKey(BASE_PHOTOS); if (!key) { if(cb) cb({}); return; }
    const j = await AsyncStorage.getItem(key);
    if (cb) cb(j ? JSON.parse(j) : {});
    syncFromCloud('photos', BASE_PHOTOS, cb);
  } catch (e) {}
};

export const deletePhoto = async (d, id, cb) => {
  try {
    const key = getUserKey(BASE_PHOTOS); if(!key) return;
    const j = await AsyncStorage.getItem(key); let g = j ? JSON.parse(j) : {};
    if (g[d]) {
      g[d] = g[d].filter(i => i.id !== id);
      if (g[d].length === 0) delete g[d];
      await AsyncStorage.setItem(key, JSON.stringify(g));
      if (cb) cb(g);
      syncToCloud('photos', g);
    }
  } catch (e) {}
};

export const getChallengeStatus = async (cb) => {
  try {
    const key = getUserKey(BASE_CHALLENGES); if (!key) { if(cb) cb({}); return; }
    const j = await AsyncStorage.getItem(key);
    if (cb) cb(j ? JSON.parse(j) : {});
    syncFromCloud('challenges', BASE_CHALLENGES, cb);
  } catch (e) {}
};

export const claimChallengeReward = async (cid, xp, cb) => {
  try {
    const key = getUserKey(BASE_CHALLENGES); if (!key) return;
    const j = await AsyncStorage.getItem(key); const s = j ? JSON.parse(j) : {};
    s[cid] = true;
    await AsyncStorage.setItem(key, JSON.stringify(s));
    await addXP(xp, (ns, lu) => cb(ns, lu));
    syncToCloud('challenges', s);
  } catch (e) {}
};

export const getGlobalStats = async (cb) => {
  try {
    const kh = getUserKey(BASE_HISTORY); const kf = getUserKey(BASE_FASTING_HIST);
    if (!kh || !kf) { if(cb) cb({totalMeals:0,totalFasts:0,maxFastingTime:0}); return; }
    const hj = await AsyncStorage.getItem(kh);
    const fj = await AsyncStorage.getItem(kf);
    const h = hj ? JSON.parse(hj) : {};
    const f = fj ? JSON.parse(fj) : [];
    const tm = Object.values(h).reduce((a,d)=>a+(d.meals?d.meals.length:0),0);
    const tf = f.length;
    const mf = f.reduce((mx,c)=>Math.max(mx,c.durationSeconds||0),0);
    if(cb) cb({totalMeals:tm,totalFasts:tf,maxFastingTime:mf});
  } catch(e) {}
};

export const getCalorieStreak = async (g, s, cb) => {
  try {
    const key = getUserKey(BASE_HISTORY); if (!key) { if(cb) cb({status:'good',count:0}); return; }
    const h = await AsyncStorage.getItem(key).then(r => r ? JSON.parse(r) : {});
    const t = getTodayKey();
    const td = h[t] || { totalCalories: 0 };
    let suc = s ? (td.totalCalories <= g) : (td.totalCalories >= g);
    const st = suc ? 'good' : 'bad';
    let c = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(new Date().getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dd = h[k];
      if (!dd && i > 0) break;
      const cl = dd ? dd.totalCalories : 0;
      let ds = s ? (cl <= g) : (cl >= g);
      if (st === 'good') { if (ds) c++; else break; } else { if (!ds) c++; else break; }
    }
    if (cb) cb({ status: st, count: c });
  } catch (e) { if (cb) cb({ status: 'good', count: 0 }); }
};

export const getWaterStreak = async (cb) => {
  try {
    const key = getUserKey(BASE_HISTORY); if (!key) { if(cb) cb(0); return; }
    const h = await AsyncStorage.getItem(key).then(r => r ? JSON.parse(r) : {});
    let s = 0; const t = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(t.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dd = h[k];
      if (dd && dd.goal > 0 && dd.water >= dd.goal) s++; else { if (i === 0) continue; else break; }
    }
    if (cb) cb(s);
  } catch (e) { if (cb) cb(0); }
};

export const saveBackgroundImage = async (u) => { try { const k = getUserKey(BASE_BG); if(!k)return; if(!u) await AsyncStorage.removeItem(k); else await AsyncStorage.setItem(k,u); } catch(e){} };
export const getBackgroundImage = async (cb) => { try { const k = getUserKey(BASE_BG); if(!k){if(cb)cb(null);return null;} const u = await AsyncStorage.getItem(k); if(cb)cb(u); return u; } catch(e){if(cb)cb(null);return null;} };