import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  doc, getDoc, setDoc, collection, addDoc, getDocs, query, limit, updateDoc, arrayUnion, increment, deleteDoc, where, onSnapshot, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../config/firebase';

// Inicializa Storage
const storage = getStorage();

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

export const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};

const getUserKey = (baseKey) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null; 
  return `${baseKey}_${uid}`;
};

const syncToCloud = async (field, data) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { [field]: data }, { merge: true });
    }
  } catch (e) {}
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
  } catch (e) {}
};

// ==========================================
// 📸 UPLOAD DE IMAGEM (CORRIGIDO COM BLOB/XHR)
// ==========================================

export const uploadImageToStorage = async (uri, folderName) => {
  try {
    const user = auth.currentUser;
    if (!user || !uri) return null;
    if (uri.startsWith('http')) return uri; // Se já for link, retorna

    // 1. Tenta criar o Blob de forma segura para Android
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError("Falha na conversão de rede"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    // 2. Cria a referência no Storage
    const filename = `${user.uid}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `${folderName}/${filename}`);

    // 3. Define metadados (IMPORTANTE PARA O PREVIEW FUNCIONAR)
    const metadata = {
      contentType: 'image/jpeg',
    };

    // 4. Faz o upload
    await uploadBytes(storageRef, blob, metadata);

    // 5. Libera memória
    blob.close();

    // 6. Pega o link público
    const downloadURL = await getDownloadURL(storageRef);
    console.log("[STORAGE] Upload Sucesso:", downloadURL);
    
    return downloadURL;

  } catch (error) {
    console.error("[STORAGE] Erro Fatal:", error);
    return null;
  }
};

// ==========================================
// 1. COMUNIDADE & CHAT REAL-TIME
// ==========================================

export const sendMessageToRoom = async (roomId, text, imageUri) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userName = userDoc.exists() && userDoc.data().profile ? userDoc.data().profile.name : "Membro";

    let finalImageUrl = null;
    if (imageUri) {
      finalImageUrl = await uploadImageToStorage(imageUri, `chat_images/${roomId}`);
    }

    const messageData = {
      text: text || '',
      image: finalImageUrl,
      senderId: user.uid,
      senderName: userName,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, "chat_rooms", roomId, "messages"), messageData);
  } catch (e) { console.error("Erro msg:", e); }
};

export const subscribeToRoomMessages = (roomId, onUpdate) => {
  const q = query(collection(db, "chat_rooms", roomId, "messages"), orderBy("timestamp", "desc"), limit(50));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const msgs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      msgs.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        isMe: data.senderId === auth.currentUser?.uid
      });
    });
    onUpdate(msgs);
  });
  return unsubscribe;
};

export const createChatRoom = async (name, description, color, onSuccess) => {
  try {
    const newRoom = {
      name, description, color, members: 0,
      createdBy: auth.currentUser?.uid,
      createdAt: new Date().toISOString(),
      banned_users: [], photo: null
    };
    const docRef = await addDoc(collection(db, "chat_rooms"), newRoom);
    await joinCommunity(docRef.id);
    if (onSuccess) onSuccess(true);
  } catch (e) { console.error(e); }
};

export const updateChatRoom = async (roomId, newData, onSuccess) => {
  try {
    let photoUrl = newData.photo;
    if (newData.photo && !newData.photo.startsWith('http')) {
       photoUrl = await uploadImageToStorage(newData.photo, 'room_photos');
    }
    const roomRef = doc(db, "chat_rooms", roomId);
    await updateDoc(roomRef, { ...newData, photo: photoUrl });
    if (onSuccess) onSuccess(true);
  } catch (e) { console.error(e); }
};

export const getChatRooms = async (onSuccess) => {
  try {
    const q = query(collection(db, "chat_rooms"), limit(50));
    const querySnapshot = await getDocs(q);
    const rooms = [];
    querySnapshot.forEach((doc) => { rooms.push({ id: doc.id, ...doc.data() }); });
    if (onSuccess) onSuccess(rooms);
  } catch (e) { if (onSuccess) onSuccess([]); }
};

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
  } catch (e) { if (onSuccess) onSuccess([]); }
};

export const joinCommunity = async (roomId, onSuccess, onError) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const roomRef = doc(db, "chat_rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      const banned = roomSnap.data().banned_users || [];
      if (banned.includes(user.uid)) { if (onError) onError("Você foi banido."); return; }
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
    if (docSnap.exists()) { const joined = docSnap.data().joined_rooms || []; onSuccess(joined.includes(roomId)); } else { onSuccess(false); }
  } catch (e) { onSuccess(false); }
};

export const deleteChatRoom = async (roomId, onSuccess) => { try { const roomRef = doc(db, "chat_rooms", roomId); await deleteDoc(roomRef); if (onSuccess) onSuccess(true); } catch (e) { console.error(e); } };
export const banUserFromRoom = async (roomId, userId, onSuccess) => { try { const roomRef = doc(db, "chat_rooms", roomId); await updateDoc(roomRef, { banned_users: arrayUnion(userId) }); if (onSuccess) onSuccess(true); } catch (e) { console.error(e); } };
export const getAllUsers = async (onSuccess) => { try { const q = query(collection(db, "users"), limit(20)); const qs = await getDocs(q); const u = []; qs.forEach((d) => { const dt = d.data(); const docId = d.id; if (dt.profile && dt.profile.name && docId !== auth.currentUser?.uid) u.push({ id: docId, name: dt.profile.name, photo: dt.profile.photo, level: dt.gamification?.level||1, objective: dt.profile.objective||'maintain' }); }); if (onSuccess) onSuccess(u); } catch (e) { if (onSuccess) onSuccess([]); } };
export const getPublicUserProfile = async (uid, onSuccess) => { try { const d = await getDoc(doc(db, "users", uid)); if (d.exists()) { const dt = d.data(); onSuccess({ name: dt.profile?.name, photo: dt.profile?.photo, level: dt.gamification?.level, xp: dt.gamification?.currentXP, objective: dt.profile?.objective, stats: { mealsLogged: dt.history ? Object.keys(dt.history).length : 0, fastsCompleted: (dt.fastingHistory || []).length } }); } } catch (e) {} };

// ==========================================
// 2. REFEIÇÕES E DIÁRIO
// ==========================================

export const addMealToDay = async (mealItem, onSuccess) => { try { const k = getUserKey(BASE_HISTORY); if(!k)return; const t = getTodayKey(); const j = await AsyncStorage.getItem(k); const h = j?JSON.parse(j):{}; const cd = h[t]||{meals:[],water:0,totalCalories:0}; const nl=[mealItem,...cd.meals]; const nt=nl.reduce((a,c)=>a+Number(c.calories),0); h[t]={...cd,meals:nl,totalCalories:nt}; await AsyncStorage.setItem(k,JSON.stringify(h)); if(onSuccess)onSuccess(nl,nt); syncToCloud('history',h); } catch(e){} };
export const deleteMealFromHistory = async (d, id, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k)return; const j = await AsyncStorage.getItem(k); let h = j?JSON.parse(j):{}; if(h[d]&&h[d].meals){ const nm=h[d].meals.filter(m=>m.id!==id); const nt=nm.reduce((a,c)=>a+Number(c.calories),0); h[d]={...h[d],meals:nm,totalCalories:nt}; await AsyncStorage.setItem(k,JSON.stringify(h)); if(cb)cb(nm,nt); syncToCloud('history',h); } } catch(e){} };
export const saveDailyLog = async (d, dm) => { try { const k = getUserKey(BASE_HISTORY); if(!k)return; const j = await AsyncStorage.getItem(k); const h = j?JSON.parse(j):{}; const cd = h[d]||{meals:[],water:0,totalCalories:0}; h[d]={...cd,...dm}; await AsyncStorage.setItem(k,JSON.stringify(h)); syncToCloud('history',h); } catch(e){} };
export const getDayLog = async (d, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k){if(cb)cb({meals:[],water:0,totalCalories:0});return;} const j = await AsyncStorage.getItem(k); const h = j?JSON.parse(j):{}; if(cb)cb(h[d]||{meals:[],water:0,totalCalories:0}); } catch(e){if(cb)cb({meals:[],water:0,totalCalories:0});} };
export const getHistory = async (cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k){if(cb)cb({});return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j?JSON.parse(j):{}); syncFromCloud('history', BASE_HISTORY, cb); } catch(e){if(cb)cb({});} };
export const deleteDailyLog = async (d, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k)return; const j = await AsyncStorage.getItem(k); let h = j?JSON.parse(j):{}; if(h[d]){delete h[d]; await AsyncStorage.setItem(k,JSON.stringify(h)); if(cb)cb(true); syncToCloud('history',h);} } catch(e){} };

// ==========================================
// 3. PERFIL & FOTOS
// ==========================================

export const saveProfile = async (profileData) => {
  try {
    const key = getUserKey(BASE_PROFILE); if (!key) return;
    
    // UPLOAD DE FOTO SE NECESSÁRIO
    if (profileData.photo && !profileData.photo.startsWith('http')) {
      const publicUrl = await uploadImageToStorage(profileData.photo, 'profile_photos');
      if (publicUrl) profileData.photo = publicUrl;
    }

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

export const savePhotoLog = async (d, u, w, m) => { 
  try { 
    const key = getUserKey(BASE_PHOTOS); if(!key) return;
    
    // UPLOAD FOTO GALERIA
    let finalUri = u;
    if (u && !u.startsWith('http')) {
       finalUri = await uploadImageToStorage(u, 'evolution_photos');
    }

    const j = await AsyncStorage.getItem(key); const g = j ? JSON.parse(j) : {}; 
    const l = g[d] || []; 
    g[d] = [{ id: Date.now().toString(), uri: finalUri || u, weight: w || '', measurements: m||{} }, ...l]; 
    await AsyncStorage.setItem(key, JSON.stringify(g)); 
    syncToCloud('photos', g); 
  } catch (e) {} 
};
export const getGallery = async (cb) => { const k = getUserKey(BASE_PHOTOS); if(!k){if(cb)cb({});return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j ? JSON.parse(j) : {}); syncFromCloud('photos', BASE_PHOTOS, cb); };
export const deletePhoto = async (d, id, cb) => { const k = getUserKey(BASE_PHOTOS); if(!k)return; const j = await AsyncStorage.getItem(k); let g = j ? JSON.parse(j) : {}; if (g[d]) { g[d] = g[d].filter(i => i.id !== id); if (g[d].length === 0) delete g[d]; await AsyncStorage.setItem(k,JSON.stringify(g)); if (cb) cb(g); syncToCloud('photos', g); } };

// ==========================================
// 4. GAMIFICAÇÃO & RESTO
// ==========================================
export const getUserStats = async (cb) => { try { const k = getUserKey(BASE_STATS); if(!k){if(cb)cb({level:1,currentXP:0,nextLevelXP:100});return{level:1,currentXP:0,nextLevelXP:100};} const j = await AsyncStorage.getItem(k); const s = j?JSON.parse(j):{level:1,currentXP:0,nextLevelXP:100}; if(cb)cb(s); syncFromCloud('gamification', BASE_STATS, cb); return s; } catch(e){return{level:1,currentXP:0,nextLevelXP:100};} };
export const addXP = async (amt, cb) => { try { const k = getUserKey(BASE_STATS); if(!k)return; const j = await AsyncStorage.getItem(k); let s = j?JSON.parse(j):{level:1,currentXP:0,nextLevelXP:100}; s.currentXP+=amt; let lu=false; while(s.currentXP>=s.nextLevelXP){s.currentXP-=s.nextLevelXP;s.level++;s.nextLevelXP=Math.round(s.nextLevelXP*1.2);lu=true;} await AsyncStorage.setItem(k,JSON.stringify(s)); if(cb)cb(s,lu); syncToCloud('gamification',s); } catch(e){} };
export const saveFastingState = async (s, g, i) => { const k = getUserKey(BASE_FASTING); if(!k)return; const d = {startTime:s, goalHours:g, isFasting:i}; await AsyncStorage.setItem(k,JSON.stringify(d)); syncToCloud('fastingState',d); };
export const getFastingState = async (cb) => { const k = getUserKey(BASE_FASTING); if(!k){if(cb)cb(null);return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j?JSON.parse(j):null); syncFromCloud('fastingState', BASE_FASTING, cb); };
export const saveFastingLog = async (s, e, d, g) => { const k = getUserKey(BASE_FASTING_HIST); if(!k)return; const j = await AsyncStorage.getItem(k); const h = j?JSON.parse(j):[]; const nl={id:Date.now().toString(), startTime:s, endTime:e, durationSeconds:d, goalHours:g, date:new Date(e).toISOString().split('T')[0]}; const nh = [nl, ...h]; await AsyncStorage.setItem(k,JSON.stringify(nh)); syncToCloud('fastingHistory',nh); };
export const getFastingHistory = async (cb) => { const k = getUserKey(BASE_FASTING_HIST); if(!k){if(cb)cb([]);return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j?JSON.parse(j):[]); syncFromCloud('fastingHistory', BASE_FASTING_HIST, cb); };
export const deleteFastingLog = async (id, cb) => { const k = getUserKey(BASE_FASTING_HIST); if(!k)return; const j = await AsyncStorage.getItem(k); let h = j?JSON.parse(j):[]; h=h.filter(i=>i.id!==id); await AsyncStorage.setItem(k,JSON.stringify(h)); if(cb)cb(h); syncToCloud('fastingHistory', h); };
export const getCalorieStreak = async (g, s, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k){if(cb)cb({status:'good',count:0});return;} const h = await AsyncStorage.getItem(k).then(r=>r?JSON.parse(r):{}); const t = getTodayKey(); const td = h[t] || { totalCalories: 0 }; let suc = s ? (td.totalCalories <= g) : (td.totalCalories >= g); const st = suc ? 'good' : 'bad'; let c = 0; for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(new Date().getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if (!dd && i > 0) break; const cl = dd ? dd.totalCalories : 0; let ds = s ? (cl <= g) : (cl >= g); if (st === 'good') { if (ds) c++; else break; } else { if (!ds) c++; else break; } } if (cb) cb({ status: st, count: c }); } catch (e) { if (cb) cb({ status: 'good', count: 0 }); } };
export const getWaterStreak = async (cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k){if(cb)cb(0);return;} const h = await AsyncStorage.getItem(k).then(r=>r?JSON.parse(r):{}); let s = 0; const t = new Date(); for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(t.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if (dd && dd.goal > 0 && dd.water >= dd.goal) s++; else { if (i === 0) continue; else break; } } if (cb) cb(s); } catch (e) { if (cb) cb(0); } };
export const addCustomFood = async (n, c, cat, uw, m, cb) => { try { const k = getUserKey(BASE_CUSTOM_FOODS); if(!k)return; const j = await AsyncStorage.getItem(k); const f = j ? JSON.parse(j) : []; const nf = { id: Date.now().toString(), name: n, calories: c, category: cat, isCustom: true, unit_weight: uw || null, carbs: m?.carbs||0, protein: m?.protein||0, fat: m?.fat||0, sugar: m?.sugar||0, createdBy: auth.currentUser?.uid }; const updatedList = [...f, newFood]; await AsyncStorage.setItem(k,JSON.stringify(updatedList)); if (cb) cb(true); await addDoc(collection(db, "global_foods"), newFood); } catch (e) {} };
export const getCustomFoods = async (cb) => { try { const k = getUserKey(BASE_CUSTOM_FOODS); if (!key) { if(cb) cb([]); return; } const j = await AsyncStorage.getItem(k); if(cb) cb(j ? JSON.parse(j) : []); const q = query(collection(db, "global_foods"), limit(100)); const qs = await getDocs(q); const gf = []; qs.forEach((d) => gf.push({ id: d.id, ...d.data() })); if (gf.length > 0) { if (cb) cb([...(j ? JSON.parse(j) : []), ...gf]); } } catch (e) {} };
export const getChallengeStatus = async (cb) => { const k = getUserKey(BASE_CHALLENGES); if(!k){if(cb)cb({});return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j?JSON.parse(j):{}); syncFromCloud('challenges', BASE_CHALLENGES, cb); };
export const claimChallengeReward = async (cid, xp, cb) => { const k = getUserKey(BASE_CHALLENGES); if(!k)return; const j = await AsyncStorage.getItem(k); const s = j?JSON.parse(j):{}; s[cid]=true; await AsyncStorage.setItem(k,JSON.stringify(s)); await addXP(xp,(ns,lu)=>cb(ns,lu)); syncToCloud('challenges', s); };
export const getGlobalStats = async (cb) => { try { const kh = getUserKey(BASE_HISTORY); const kf = getUserKey(BASE_FASTING_HIST); if(!kh||!kf){if(cb)cb({totalMeals:0,totalFasts:0,maxFastingTime:0});return;} const hj = await AsyncStorage.getItem(kh); const fj = await AsyncStorage.getItem(kf); const h = hj?JSON.parse(hj):{}; const f = fj?JSON.parse(fj):[]; const tm = Object.values(h).reduce((a,d)=>a+(d.meals?d.meals.length:0),0); const tf = f.length; const mf = f.reduce((mx,c)=>Math.max(mx,c.durationSeconds||0),0); if(cb)cb({totalMeals:tm,totalFasts:tf,maxFastingTime:mf}); } catch(e){} };
export const saveBackgroundImage = async (u) => { try { const k = getUserKey(BASE_BG); if(!k)return; if(!u) await AsyncStorage.removeItem(k); else await AsyncStorage.setItem(k,u); } catch(e){} };
export const getBackgroundImage = async (cb) => { try { const k = getUserKey(BASE_BG); if(!k){if(cb)cb(null);return null;} const u = await AsyncStorage.getItem(k); if(cb)cb(u); return u; } catch(e){if(cb)cb(null);return null;} };