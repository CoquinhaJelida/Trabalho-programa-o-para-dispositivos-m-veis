import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  doc, getDoc, setDoc, collection, addDoc, getDocs, query, limit, updateDoc, arrayUnion, increment, deleteDoc, where, onSnapshot, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../config/firebase';

const storage = getStorage();

// CHAVES LOCAIS
const BASE_CUSTOM_FOODS = '@my_custom_foods_v4'; 
const BASE_PROFILE = '@user_profile_v4';
const BASE_HISTORY = '@daily_logs_v4';
const BASE_PHOTOS = '@body_photos_v4';
const BASE_FASTING = '@fasting_data_v4';
const BASE_FASTING_HIST = '@fasting_history_v4';
const BASE_STATS = '@gamification_stats_v4';
const BASE_CHALLENGES = '@challenges_data_v4';
const BASE_BG = '@user_bg_v1';

export const getTodayKey = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; };
const getUserKey = (baseKey) => { const uid = auth.currentUser?.uid; return uid ? `${baseKey}_${uid}` : null; };
const syncToCloud = async (field, data) => { try { const user = auth.currentUser; if (user) { await setDoc(doc(db, "users", user.uid), { [field]: data }, { merge: true }); } } catch (e) {} };
const syncFromCloud = async (field, baseKey, onSuccess) => { try { const user = auth.currentUser; if (user) { const snap = await getDoc(doc(db, "users", user.uid)); if (snap.exists() && snap.data()[field]) { const d = snap.data()[field]; await AsyncStorage.setItem(getUserKey(baseKey), JSON.stringify(d)); if(onSuccess) onSuccess(d); } } } catch (e) {} };

export const uploadImageToStorage = async (uri, folderName) => {
  try {
    const user = auth.currentUser; if (!user || !uri || uri.startsWith('http')) return uri;
    const response = await fetch(uri); const blob = await response.blob();
    const refStor = ref(storage, `${folderName}/${user.uid}_${Date.now()}.jpg`);
    await uploadBytes(refStor, blob, {contentType:'image/jpeg'});
    blob.close();
    return await getDownloadURL(refStor);
  } catch (e) { return null; }
};

export const sendMessageToRoom = async (roomId, text, imageUri) => {
  try {
    const user = auth.currentUser; if (!user) return;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userName = userDoc.exists() && userDoc.data().profile ? userDoc.data().profile.name : "Membro";
    let finalImg = imageUri ? await uploadImageToStorage(imageUri, `chat_images/${roomId}`) : null;
    await addDoc(collection(db, "chat_rooms", roomId, "messages"), { text: text||'', image: finalImg, senderId: user.uid, senderName: userName, timestamp: serverTimestamp() });
  } catch (e) {}
};

export const deleteMessageFromRoom = async (roomId, messageId, cb) => { try { await deleteDoc(doc(db, "chat_rooms", roomId, "messages", messageId)); if(cb)cb(true); } catch(e){} };

export const subscribeToRoomMessages = (roomId, onUpdate) => {
  const q = query(collection(db, "chat_rooms", roomId, "messages"), orderBy("timestamp", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    const msgs = []; snap.forEach(d => msgs.push({id:d.id, ...d.data(), timestamp: d.data().timestamp?.toDate()||new Date(), isMe: d.data().senderId===auth.currentUser?.uid}));
    onUpdate(msgs);
  });
};

export const createChatRoom = async (n, d, c, cb) => { try { const docRef = await addDoc(collection(db,"chat_rooms"), {name:n, description:d, color:c, members:0, createdBy:auth.currentUser?.uid, createdAt:new Date().toISOString(), banned_users:[], photo:null}); await joinCommunity(docRef.id); if(cb)cb(true); } catch(e){} };
export const getChatRooms = async (cb) => { try { const q=query(collection(db,"chat_rooms"),limit(50)); const s=await getDocs(q); const r=[]; s.forEach(d=>r.push({id:d.id,...d.data()})); if(cb)cb(r); } catch(e){if(cb)cb([])} };
export const getRoomMembers = async (rid, cb) => { try { const q=query(collection(db,"users"),where("joined_rooms","array-contains",rid)); const s=await getDocs(q); const m=[]; s.forEach(d=>{const dt=d.data(); if(dt.profile)m.push({id:d.id, name:dt.profile.name, photo:dt.profile.photo, level:dt.gamification?.level||1})}); if(cb)cb(m); } catch(e){if(cb)cb([])} };
export const joinCommunity = async (rid, cb, err) => { try { const u=auth.currentUser; if(!u)return; const r=doc(db,"chat_rooms",rid); const s=await getDoc(r); if(s.exists() && (s.data().banned_users||[]).includes(u.uid)) {if(err)err("Banido."); return;} await updateDoc(doc(db,"users",u.uid),{joined_rooms:arrayUnion(rid)}); await updateDoc(r,{members:increment(1)}); if(cb)cb(true); } catch(e){} };
export const checkMembership = async (rid, cb) => { try { const u=auth.currentUser; if(!u){cb(false);return;} const s=await getDoc(doc(db,"users",u.uid)); cb(s.exists() && (s.data().joined_rooms||[]).includes(rid)); } catch(e){cb(false)} };
export const updateChatRoom = async (rid, d, cb) => { try { let p=d.photo; if(p&&!p.startsWith('http')) p=await uploadImageToStorage(p,'room_photos'); await updateDoc(doc(db,"chat_rooms",rid),{...d, photo:p}); if(cb)cb(true); } catch(e){} };
export const deleteChatRoom = async (rid, cb) => { try { await deleteDoc(doc(db,"chat_rooms",rid)); if(cb)cb(true); } catch(e){} };
export const banUserFromRoom = async (rid, uid, cb) => { try { await updateDoc(doc(db,"chat_rooms",rid),{banned_users:arrayUnion(uid)}); if(cb)cb(true); } catch(e){} };
export const getAllUsers = async (cb) => { try { const cid=auth.currentUser?.uid; const q=query(collection(db,"users"),limit(20)); const s=await getDocs(q); const u=[]; s.forEach(d=>{const dt=d.data(); if(dt.profile&&dt.profile.name&&d.id!==cid) u.push({id:d.id, name:dt.profile.name, photo:dt.profile.photo, level:dt.gamification?.level||1, objective:dt.profile.objective})}); if(cb)cb(u); } catch(e){if(cb)cb([])} };

// --- CORREÇÃO AQUI: GARANTIA DE RETORNO ---
export const getPublicUserProfile = async (uid, onSuccess) => {
  try {
    const d = await getDoc(doc(db, "users", uid));
    if (d.exists()) {
      const dt = d.data();
      onSuccess({
        name: dt.profile?.name || "Usuário",
        photo: dt.profile?.photo || null,
        level: dt.gamification?.level || 1,
        xp: dt.gamification?.currentXP || 0,
        objective: dt.profile?.objective || 'maintain',
        stats: {
          mealsLogged: dt.history ? Object.keys(dt.history).length : 0,
          fastsCompleted: (dt.fastingHistory || []).length
        }
      });
    } else {
      onSuccess(null); // Retorna null se não achar, pro loading parar
    }
  } catch (e) {
    onSuccess(null); // Retorna null se der erro
  }
};

// OUTRAS FUNÇÕES (Mantidas)
export const addMealToDay = async (mi, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k)return; const t = getTodayKey(); const j = await AsyncStorage.getItem(k); const h = j?JSON.parse(j):{}; const cd = h[t]||{meals:[],water:0,totalCalories:0}; const nl=[mi,...cd.meals]; const nt=nl.reduce((a,c)=>a+Number(c.calories),0); h[t]={...cd,meals:nl,totalCalories:nt}; await AsyncStorage.setItem(k,JSON.stringify(h)); if(cb)cb(nl,nt); syncToCloud('history',h); } catch(e){} };
export const deleteMealFromHistory = async (d, id, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k)return; const j = await AsyncStorage.getItem(k); let h = j?JSON.parse(j):{}; if(h[d]&&h[d].meals){ const nm=h[d].meals.filter(m=>m.id!==id); const nt=nm.reduce((a,c)=>a+Number(c.calories),0); h[d]={...h[d],meals:nm,totalCalories:nt}; await AsyncStorage.setItem(k,JSON.stringify(h)); if(cb)cb(nm,nt); syncToCloud('history',h); } } catch(e){} };
export const saveDailyLog = async (d, dm) => { try { const k = getUserKey(BASE_HISTORY); if(!k)return; const j = await AsyncStorage.getItem(k); const h = j?JSON.parse(j):{}; const cd = h[d]||{meals:[],water:0,totalCalories:0}; h[d]={...cd,...dm}; await AsyncStorage.setItem(k,JSON.stringify(h)); syncToCloud('history',h); } catch(e){} };
export const getDayLog = async (d, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k){if(cb)cb({meals:[],water:0,totalCalories:0});return;} const j = await AsyncStorage.getItem(k); const h = j?JSON.parse(j):{}; if(cb)cb(h[d]||{meals:[],water:0,totalCalories:0}); } catch(e){if(cb)cb({meals:[],water:0,totalCalories:0});} };
export const getHistory = async (cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k){if(cb)cb({});return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j?JSON.parse(j):{}); syncFromCloud('history', BASE_HISTORY, cb); } catch(e){if(cb)cb({});} };
export const deleteDailyLog = async (d, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k)return; const j = await AsyncStorage.getItem(k); let h = j?JSON.parse(j):{}; if(h[d]){delete h[d]; await AsyncStorage.setItem(k,JSON.stringify(h)); if(cb)cb(true); syncToCloud('history',h);} } catch(e){} };
export const saveProfile = async (p) => { try { const k = getUserKey(BASE_PROFILE); if(!k)return; if(p.photo&&!p.photo.startsWith('http')){const u=await uploadImageToStorage(p.photo,'profile_photos');if(u)p.photo=u;} await AsyncStorage.setItem(k,JSON.stringify(p)); syncToCloud('profile',p); } catch(e){} };
export const getProfile = async (cb) => { try { const k = getUserKey(BASE_PROFILE); if(!k){if(cb)cb(null);return;} const j = await AsyncStorage.getItem(k); if(j&&cb)cb(JSON.parse(j)); syncFromCloud('profile', BASE_PROFILE, cb); } catch(e){} };
export const getUserStats = async (cb) => { try { const k = getUserKey(BASE_STATS); if(!k){if(cb)cb({level:1,currentXP:0,nextLevelXP:100});return{level:1,currentXP:0,nextLevelXP:100};} const j = await AsyncStorage.getItem(k); const s = j?JSON.parse(j):{level:1,currentXP:0,nextLevelXP:100}; if(cb)cb(s); syncFromCloud('gamification', BASE_STATS, cb); return s; } catch(e){return{level:1,currentXP:0,nextLevelXP:100};} };
export const addXP = async (amt, cb) => { try { const k = getUserKey(BASE_STATS); if(!k)return; const j = await AsyncStorage.getItem(k); let s = j?JSON.parse(j):{level:1,currentXP:0,nextLevelXP:100}; s.currentXP+=amt; let lu=false; while(s.currentXP>=s.nextLevelXP){s.currentXP-=s.nextLevelXP;s.level++;s.nextLevelXP=Math.round(s.nextLevelXP*1.2);lu=true;} await AsyncStorage.setItem(k,JSON.stringify(s)); if(cb)cb(s,lu); syncToCloud('gamification',s); } catch(e){} };
export const saveFastingState = async (s, g, i) => { const k = getUserKey(BASE_FASTING); if(!k)return; const d = {startTime:s, goalHours:g, isFasting:i}; await AsyncStorage.setItem(k,JSON.stringify(d)); syncToCloud('fastingState',d); };
export const getFastingState = async (cb) => { const k = getUserKey(BASE_FASTING); if(!k){if(cb)cb(null);return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j?JSON.parse(j):null); syncFromCloud('fastingState', BASE_FASTING, cb); };
export const saveFastingLog = async (s, e, d, g) => { const k = getUserKey(BASE_FASTING_HIST); if(!k)return; const j = await AsyncStorage.getItem(k); const h = j?JSON.parse(j):[]; const nl={id:Date.now().toString(), startTime:s, endTime:e, durationSeconds:d, goalHours:g, date:new Date(e).toISOString().split('T')[0]}; const nh = [nl, ...h]; await AsyncStorage.setItem(k,JSON.stringify(nh)); syncToCloud('fastingHistory',nh); };
export const getFastingHistory = async (cb) => { const k = getUserKey(BASE_FASTING_HIST); if(!k){if(cb)cb([]);return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j?JSON.parse(j):[]); syncFromCloud('fastingHistory', BASE_FASTING_HIST, cb); };
export const deleteFastingLog = async (id, cb) => { const k = getUserKey(BASE_FASTING_HIST); if(!k)return; const j = await AsyncStorage.getItem(k); let h = j?JSON.parse(j):[]; h=h.filter(i=>i.id!==id); await AsyncStorage.setItem(k,JSON.stringify(h)); if(cb)cb(h); syncToCloud('fastingHistory', h); };
export const getCalorieStreak = async (g, s, cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k){if(cb)cb({status:'good',count:0});return;} const h = await AsyncStorage.getItem(k).then(r=>r?JSON.parse(r):{}); const t = getTodayKey(); const td = h[t] || { totalCalories: 0 }; let suc = s ? (td.totalCalories <= g) : (td.totalCalories >= g); const st = suc ? 'good' : 'bad'; let c = 0; for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(new Date().getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if (!dd && i > 0) break; const cl = dd ? dd.totalCalories : 0; let ds = s ? (cl <= g) : (cl >= g); if (st === 'good') { if (ds) c++; else break; } else { if (!ds) c++; else break; } } if (cb) cb({ status: st, count: c }); } catch (e) { if (cb) cb({ status: 'good', count: 0 }); } };
export const getWaterStreak = async (cb) => { try { const k = getUserKey(BASE_HISTORY); if(!k){if(cb)cb(0);return;} const h = await AsyncStorage.getItem(k).then(r=>r?JSON.parse(r):{}); let s = 0; const t = new Date(); for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(t.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const dd = h[k]; if (dd && dd.goal > 0 && dd.water >= dd.goal) s++; else { if (i === 0) continue; else break; } } if (cb) cb(s); } catch (e) { if (cb) cb(0); } };
export const addCustomFood = async (n, c, cat, uw, m, cb) => { try { const k = getUserKey(BASE_CUSTOM_FOODS); if(!k)return; const j = await AsyncStorage.getItem(k); const f = j ? JSON.parse(j) : []; const newFood = { id: Date.now().toString(), name: n, calories: c, category: cat, isCustom: true, unit_weight: uw || null, carbs: m?.carbs||0, protein: m?.protein||0, fat: m?.fat||0, sugar: m?.sugar||0, createdBy: auth.currentUser?.uid }; const updatedList = [...f, newFood]; await AsyncStorage.setItem(k,JSON.stringify(updatedList)); if (cb) cb(true); await addDoc(collection(db, "global_foods"), newFood); } catch (e) {} };
export const getCustomFoods = async (cb) => { try { const k = getUserKey(BASE_CUSTOM_FOODS); if (!key) { if(cb) cb([]); return; } const j = await AsyncStorage.getItem(k); if(cb) cb(j ? JSON.parse(j) : []); const q = query(collection(db, "global_foods"), limit(100)); const qs = await getDocs(q); const gf = []; qs.forEach((d) => gf.push({ id: d.id, ...d.data() })); if (gf.length > 0) { if (cb) cb([...(j ? JSON.parse(j) : []), ...gf]); } } catch (e) {} };
export const savePhotoLog = async (d, u, w, m) => { try { const k = getUserKey(BASE_PHOTOS); if(!k)return; const j = await AsyncStorage.getItem(k); const g = j ? JSON.parse(j) : {}; const l = g[d] || []; g[d] = [{ id: Date.now().toString(), uri: u, weight: w || '', measurements: m||{} }, ...l]; await AsyncStorage.setItem(k,JSON.stringify(g)); syncToCloud('photos', g); } catch (e) {} };
export const getGallery = async (cb) => { const k = getUserKey(BASE_PHOTOS); if(!k){if(cb)cb({});return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j ? JSON.parse(j) : {}); syncFromCloud('photos', BASE_PHOTOS, cb); };
export const deletePhoto = async (d, id, cb) => { const k = getUserKey(BASE_PHOTOS); if(!k)return; const j = await AsyncStorage.getItem(k); let g = j ? JSON.parse(j) : {}; if (g[d]) { g[d] = g[d].filter(i => i.id !== id); if (g[d].length === 0) delete g[d]; await AsyncStorage.setItem(k,JSON.stringify(g)); if (cb) cb(g); syncToCloud('photos', g); } };
export const getChallengeStatus = async (cb) => { const k = getUserKey(BASE_CHALLENGES); if(!k){if(cb)cb({});return;} const j = await AsyncStorage.getItem(k); if(cb)cb(j?JSON.parse(j):{}); syncFromCloud('challenges', BASE_CHALLENGES, cb); };
export const claimChallengeReward = async (cid, xp, cb) => { const k = getUserKey(BASE_CHALLENGES); if(!k)return; const j = await AsyncStorage.getItem(k); const s = j?JSON.parse(j):{}; s[cid]=true; await AsyncStorage.setItem(k,JSON.stringify(s)); await addXP(xp,(ns,lu)=>cb(ns,lu)); syncToCloud('challenges', s); };
export const saveBackgroundImage = async (u) => { try { const k = getUserKey(BASE_BG); if(!k)return; if(!u) await AsyncStorage.removeItem(k); else await AsyncStorage.setItem(k,u); } catch(e){} };
export const getBackgroundImage = async (cb) => { try { const k = getUserKey(BASE_BG); if(!k){if(cb)cb(null);return null;} const u = await AsyncStorage.getItem(k); if(cb)cb(u); return u; } catch(e){if(cb)cb(null);return null;} };