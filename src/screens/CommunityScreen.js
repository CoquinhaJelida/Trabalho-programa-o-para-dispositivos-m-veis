import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, ScrollView, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase';
import { 
  getAllUsers, getPublicUserProfile, getChatRooms, createChatRoom, 
  joinCommunity, checkMembership, updateChatRoom, deleteChatRoom, banUserFromRoom, getRoomMembers, sendMessageToRoom, subscribeToRoomMessages, deleteMessageFromRoom
} from '../services/db';

const SUPER_ADMIN_EMAIL = "seu_email_aqui@gmail.com";

export default function CommunityScreen({ theme }) {
  const [activeTab, setActiveTab] = useState('chat'); 
  const [currentRoom, setCurrentRoom] = useState(null); 
  const [inputText, setInputText] = useState('');
  const [roomMessages, setRoomMessages] = useState([]); 
  
  // ADMIN STATES
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomDesc, setEditRoomDesc] = useState('');
  const [editRoomPhoto, setEditRoomPhoto] = useState(null);
  const [roomMembersList, setRoomMembersList] = useState([]);

  const [hasJoined, setHasJoined] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [visitingUser, setVisitingUser] = useState(null);
  const flatListRef = useRef(null);

  // CARREGAMENTOS
  useEffect(() => { if (activeTab === 'chat' && !currentRoom) loadRooms(); }, [activeTab, currentRoom]);
  useEffect(() => { if (activeTab === 'members' && !currentRoom) { setLoadingMembers(true); getAllUsers((users) => { setMembers(users); setLoadingMembers(false); }); } }, [activeTab, currentRoom]);

  // LISTENER E ADMIN
  useEffect(() => {
    let unsubscribe;
    if (currentRoom) {
      const currentUser = auth.currentUser;
      const isOwner = currentUser?.uid === currentRoom.createdBy;
      const superAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;
      setIsAdmin(isOwner || superAdmin);
      setIsSuperAdmin(superAdmin);
      setEditRoomName(currentRoom.name);
      setEditRoomDesc(currentRoom.description);
      setEditRoomPhoto(currentRoom.photo || null);
      checkMembership(currentRoom.id, setHasJoined);
      if ((isOwner || superAdmin) && adminModalVisible) loadRoomMembers();
      unsubscribe = subscribeToRoomMessages(currentRoom.id, (newMsgs) => setRoomMessages(newMsgs));
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [currentRoom, adminModalVisible]);

  const loadRoomMembers = () => { getRoomMembers(currentRoom.id, (list) => setRoomMembersList(list)); };
  const loadRooms = () => { setLoadingRooms(true); getChatRooms((rooms) => { if (rooms.length === 0) { setChatRooms([{ id: '1', name: 'Geral', description: 'Bem-vindo', members: 1, color: ['#f59e0b', '#d97706'] }]); } else { setChatRooms(rooms); } setLoadingRooms(false); }); };
  const handleCreateRoom = () => { if (!newRoomName || !newRoomDesc) return Alert.alert("Erro", "Preencha tudo!"); const colors = [['#ef4444', '#b91c1c'], ['#f97316', '#c2410c'], ['#84cc16', '#4d7c0f'], ['#06b6d4', '#0e7490'], ['#8b5cf6', '#6d28d9'], ['#d946ef', '#a21caf']]; const randomColor = colors[Math.floor(Math.random() * colors.length)]; createChatRoom(newRoomName, newRoomDesc, randomColor, () => { Alert.alert("Sucesso", "Comunidade criada!"); setNewRoomName(''); setNewRoomDesc(''); setIsCreatingRoom(false); loadRooms(); }); };
  const handleJoinRoom = () => { joinCommunity(currentRoom.id, () => { setHasJoined(true); Alert.alert("Bem-vindo!", "Você entrou no grupo."); }, (errorMsg) => { Alert.alert("Acesso Negado", errorMsg); setCurrentRoom(null); }); };
  const handleUpdateRoom = () => { updateChatRoom(currentRoom.id, { name: editRoomName, description: editRoomDesc, photo: editRoomPhoto }, () => { Alert.alert("Sucesso", "Dados atualizados!"); setAdminModalVisible(false); setCurrentRoom(prev => ({ ...prev, name: editRoomName, description: editRoomDesc, photo: editRoomPhoto })); loadRooms(); }); };
  const handlePickRoomPhoto = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, aspect: [1, 1] }); if (!result.canceled) setEditRoomPhoto(result.assets[0].uri); };
  const handleDeleteRoom = () => { Alert.alert("Excluir Sala", "Tem certeza?", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: () => { deleteChatRoom(currentRoom.id, () => { setAdminModalVisible(false); setCurrentRoom(null); loadRooms(); }); }}]); };
  const handleBanUser = (userId) => { Alert.alert("BANIR", "Deseja banir?", [{ text: "Cancelar", style: "cancel" }, { text: "BANIR", style: "destructive", onPress: () => { banUserFromRoom(currentRoom.id, userId, () => { Alert.alert("Banido", "Usuário removido."); loadRoomMembers(); }); }}]); };
  const handleVisitProfile = (userId) => { setVisitingUser(null); setVisitModalVisible(true); getPublicUserProfile(userId, (userData) => { setVisitingUser(userData); }); };
  const handleSend = (text = null, image = null) => { const content = text || inputText; if (!content && !image) return; sendMessageToRoom(currentRoom.id, content, image); setInputText(''); };
  const handlePickImage = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, aspect: [4, 3] }); if (!result.canceled) handleSend(null, result.assets[0].uri); };
  const handleDeleteMessage = (msg) => { Alert.alert("Apagar", "Excluir?", [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: () => deleteMessageFromRoom(currentRoom.id, msg.id) }]); };
  const formatTime = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchText.toLowerCase()));

  // --- COMPONENTES INTERNOS PARA ORGANIZAR O RENDER ---

  const renderLobby = () => (
    <>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Comunidade</Text>
        <View style={styles.tabSwitch}>
          <TouchableOpacity onPress={() => setActiveTab('chat')} style={[styles.tabSwitchBtn, activeTab==='chat' && {borderBottomWidth: 2, borderBottomColor: theme.primary}]}><Text style={[styles.tabSwitchText, {color: activeTab==='chat'?theme.primary:theme.textSub}]}>Salas</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('members')} style={[styles.tabSwitchBtn, activeTab==='members' && {borderBottomWidth: 2, borderBottomColor: theme.primary}]}><Text style={[styles.tabSwitchText, {color: activeTab==='members'?theme.primary:theme.textSub}]}>Membros</Text></TouchableOpacity>
        </View>
      </View>

      {activeTab === 'chat' && (
        <View style={{flex: 1}}>
          {loadingRooms ? <ActivityIndicator color={theme.primary} style={{marginTop:20}} /> : (
            <FlatList data={chatRooms} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20 }} ListEmptyComponent={<Text style={{textAlign:'center', color:theme.textSub}}>Nenhuma sala.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.roomCard, { backgroundColor: theme.card }]} onPress={() => setCurrentRoom(item)}>
                  {item.photo ? <Image source={{ uri: item.photo }} style={styles.roomIconImg} /> : <LinearGradient colors={item.color || ['#666','#444']} style={styles.roomIcon}><Feather name="users" size={24} color="#fff" /></LinearGradient>}
                  <View style={{ flex: 1 }}><Text style={[styles.roomName, { color: theme.text }]}>{item.name}</Text><Text style={[styles.roomDesc, { color: theme.textSub }]}>{item.description}</Text><Text style={[styles.roomMembers, { color: theme.primary }]}>{item.members} online</Text></View>
                  <Feather name="chevron-right" size={24} color={theme.tabIcon} />
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity style={styles.fab} onPress={() => setIsCreatingRoom(true)}><Feather name="plus" size={24} color="#fff" /></TouchableOpacity>
        </View>
      )}

      {activeTab === 'members' && (
        <View style={{ flex: 1 }}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
            <Feather name="search" size={20} color={theme.textSub} style={{marginRight: 10}} />
            <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Buscar membro..." placeholderTextColor={theme.textSub} value={searchText} onChangeText={setSearchText} />
          </View>
          {loadingMembers ? <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 20}} /> : (
            <FlatList data={filteredMembers} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20 }} ListEmptyComponent={<Text style={{textAlign:'center', color:theme.textSub, marginTop:20}}>Nenhum membro.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.memberCard, { backgroundColor: theme.card }]} onPress={() => handleVisitProfile(item.id)}>
                  {item.photo ? <Image source={{ uri: item.photo }} style={styles.memberAvatar} /> : <View style={[styles.memberAvatarPlaceholder, {backgroundColor: theme.inputBg}]}><Feather name="user" size={20} color={theme.textSub} /></View>}
                  <View style={{flex: 1, marginLeft: 12}}><Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text><Text style={[styles.memberLevel, { color: theme.primary }]}>Nível {item.level}</Text></View>
                  <Feather name="eye" size={20} color={theme.tabIcon} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </>
  );

  const renderChat = () => (
    <>
      {currentRoom.photo ? (
        <View style={styles.chatHeaderImageContainer}><Image source={{ uri: currentRoom.photo }} style={styles.chatHeaderImage} /><View style={styles.chatHeaderOverlay}><TouchableOpacity onPress={() => setCurrentRoom(null)} style={styles.backBtn}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity><View style={{flex:1}}><Text style={styles.chatTitle}>{currentRoom.name}</Text><Text style={styles.chatSub}>{currentRoom.members} membros</Text></View>{isAdmin && (<TouchableOpacity onPress={() => setAdminModalVisible(true)}><Feather name="settings" size={24} color="#fff" /></TouchableOpacity>)}</View></View>
      ) : (
        <LinearGradient colors={currentRoom.color || ['#666','#444']} style={styles.chatHeader}><TouchableOpacity onPress={() => setCurrentRoom(null)} style={styles.backBtn}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity><View style={{flex: 1}}><Text style={styles.chatTitle}>{currentRoom.name}</Text><Text style={styles.chatSub}>{currentRoom.members} membros</Text></View>{isAdmin && (<TouchableOpacity onPress={() => setAdminModalVisible(true)}><Feather name="settings" size={24} color="#fff" /></TouchableOpacity>)}</LinearGradient>
      )}

      <FlatList ref={flatListRef} data={roomMessages} keyExtractor={item => item.id} inverted contentContainerStyle={{ padding: 15 }} renderItem={({ item }) => (
        <View style={[styles.msgRow, item.isMe ? styles.msgRowMe : styles.msgRowOther]}>
          {!item.isMe && <View style={[styles.avatar, {backgroundColor: theme.border}]}><Feather name="user" size={16} color={theme.textSub} /></View>}
          <View style={[styles.bubble, item.isMe ? styles.bubbleMe : [styles.bubbleOther, { backgroundColor: theme.card }]]}>
            {!item.isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
            {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
            {item.text ? <Text style={[styles.msgText, item.isMe ? styles.textMe : { color: theme.text }]}>{item.text}</Text> : null}
            <Text style={[styles.msgTime, item.isMe ? {color: 'rgba(255,255,255,0.7)'} : {color: theme.textSub}]}>{formatTime(item.timestamp)}</Text>
          </View>
          {(item.isMe || isSuperAdmin) && (<TouchableOpacity onPress={() => handleDeleteMessage(item)} style={{justifyContent:'center', paddingHorizontal: 5}}><Feather name="trash-2" size={14} color="#ef4444" /></TouchableOpacity>)}
        </View>
      )} />
      
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        {hasJoined ? (
          <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}><Feather name="image" size={24} color={theme.textSub} /></TouchableOpacity>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]} placeholder="Digite..." placeholderTextColor={theme.textSub} value={inputText} onChangeText={setInputText} multiline />
            <TouchableOpacity style={[styles.sendBtn, {backgroundColor: currentRoom.color?.[0] || theme.primary}]} onPress={() => handleSend()}><Feather name="send" size={20} color="#fff" /></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.joinBtn, {backgroundColor: currentRoom.color?.[0] || theme.primary}]} onPress={handleJoinRoom}><Text style={styles.joinBtnText}>ENTRAR NA COMUNIDADE</Text><Feather name="log-in" size={20} color="#fff" style={{marginLeft: 10}} /></TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </>
  );

  // --- RETURN PRINCIPAL (AGORA UNIFICADO) ---
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {currentRoom ? renderChat() : renderLobby()}

      {/* MODAIS GLOBAIS (AGORA DISPONÍVEIS EM TODAS AS TELAS) */}
      
      {/* 1. Modal Criar */}
      <Modal visible={isCreatingRoom} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, {color: theme.text}]}>Nova Comunidade</Text>
            <TextInput style={[styles.modalInput, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Nome da Sala" placeholderTextColor={theme.textSub} value={newRoomName} onChangeText={setNewRoomName} />
            <TextInput style={[styles.modalInput, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Descrição" placeholderTextColor={theme.textSub} value={newRoomDesc} onChangeText={setNewRoomDesc} />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsCreatingRoom(false)} style={[styles.btnCancel, {backgroundColor: theme.inputBg}]}><Text style={[styles.btnTextCancel, {color: theme.text}]}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleCreateRoom} style={[styles.btnSave, {backgroundColor: theme.primary}]}><Text style={styles.btnTextSave}>Criar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Modal Admin */}
      <Modal visible={adminModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, height: '75%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, {color: theme.text}]}>Administração</Text>
              <TouchableOpacity onPress={handlePickRoomPhoto} style={{alignSelf:'center', marginBottom:15}}>{editRoomPhoto ? <Image source={{uri: editRoomPhoto}} style={styles.roomEditThumb} /> : <View style={[styles.roomEditPlaceholder, {borderColor: theme.textSub}]}><Feather name="camera" size={24} color={theme.textSub}/><Text style={{color:theme.textSub, fontSize:10}}>Alterar Foto</Text></View>}</TouchableOpacity>
              <Text style={[styles.label, {color: theme.textSub}]}>Nome da Sala</Text><TextInput style={[styles.modalInput, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} value={editRoomName} onChangeText={setEditRoomName} />
              <Text style={[styles.label, {color: theme.textSub}]}>Descrição</Text><TextInput style={[styles.modalInput, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} value={editRoomDesc} onChangeText={setEditRoomDesc} />
              <TouchableOpacity style={[styles.btnSave, {backgroundColor: theme.primary, marginBottom: 20}]} onPress={handleUpdateRoom}><Text style={styles.btnTextSave}>Salvar Alterações</Text></TouchableOpacity>
              <Text style={[styles.modalTitle, {color: theme.text, fontSize: 16, marginTop: 10}]}>Membros da Sala</Text>
              {roomMembersList.map(member => (<View key={member.id} style={[styles.adminMemberRow, {borderBottomColor: theme.border}]}><View style={{flexDirection:'row', alignItems:'center'}}>{member.photo ? <Image source={{ uri: member.photo }} style={[styles.memberAvatar, {width:30, height:30, marginRight:10}]} /> : <View style={[styles.memberAvatarPlaceholder, {width:30, height:30, backgroundColor: theme.inputBg, marginRight:10}]}><Feather name="user" size={16} color={theme.textSub} /></View>}<Text style={[styles.adminMemberName, {color: theme.text}]}>{member.name}</Text></View>{member.id === currentRoom?.createdBy ? <View style={styles.tagAdmin}><Text style={styles.tagText}>👑 Admin</Text></View> : <View style={{flexDirection:'row', alignItems:'center'}}><View style={[styles.tagMember, {marginRight:10}]}><Text style={[styles.tagText, {color:'#666'}]}>👤 Membro</Text></View><TouchableOpacity onPress={() => handleBanUser(member.id)} style={styles.tagBan}><Feather name="trash-2" size={14} color="#fff" /></TouchableOpacity></View>}</View>))}
              <TouchableOpacity style={[styles.btnSave, {backgroundColor: '#ef4444', marginTop: 30}]} onPress={handleDeleteRoom}><Text style={styles.btnTextSave}>Excluir Sala Permanentemente</Text></TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={{padding: 15, alignSelf: 'center'}} onPress={() => setAdminModalVisible(false)}><Text style={{color: theme.textSub}}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Modal Visita (AGORA GLOBAL) */}
      <Modal visible={visitModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, {color: theme.text}]}>Perfil do Membro</Text><TouchableOpacity onPress={() => setVisitModalVisible(false)}><Feather name="x" size={24} color={theme.text} /></TouchableOpacity></View>
            {visitingUser ? (
              <ScrollView contentContainerStyle={{alignItems: 'center'}}>
                {visitingUser.photo ? <Image source={{ uri: visitingUser.photo }} style={styles.visitAvatar} /> : <View style={[styles.visitAvatarPlaceholder, {backgroundColor: theme.inputBg}]}><Feather name="user" size={40} color={theme.textSub} /></View>}
                <Text style={[styles.visitName, {color: theme.text}]}>{visitingUser.name}</Text>
                <View style={[styles.visitBadge, {backgroundColor: theme.primary}]}><Text style={styles.visitLevel}>Nível {visitingUser.level}</Text></View>
                <Text style={[styles.visitObj, {color: theme.textSub}]}>Objetivo: {visitingUser.objective === 'lose' ? 'Secar' : visitingUser.objective === 'gain' ? 'Crescer' : 'Manter'}</Text>
                <View style={styles.statsGrid}><View style={[styles.statBox, {backgroundColor: theme.inputBg}]}><Text style={[styles.statVal, {color: theme.primary}]}>{visitingUser.stats?.mealsLogged || 0}</Text><Text style={[styles.statLbl, {color: theme.textSub}]}>Refeições</Text></View><View style={[styles.statBox, {backgroundColor: theme.inputBg}]}><Text style={[styles.statVal, {color: theme.primary}]}>{visitingUser.stats?.fastsCompleted || 0}</Text><Text style={[styles.statLbl, {color: theme.textSub}]}>Jejuns</Text></View><View style={[styles.statBox, {backgroundColor: theme.inputBg}]}><Text style={[styles.statVal, {color: theme.primary}]}>{visitingUser.stats?.xp || 0}</Text><Text style={[styles.statLbl, {color: theme.textSub}]}>XP Total</Text></View></View>
              </ScrollView>
            ) : <ActivityIndicator color={theme.primary} />}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, paddingBottom: 10, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSub: { fontSize: 14 },
  tabSwitch: { flexDirection: 'row', marginTop: 15 },
  tabSwitchBtn: { marginRight: 20, paddingBottom: 5 },
  tabSwitchText: { fontSize: 16, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 20, marginBottom: 5, padding: 12, borderRadius: 12, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16 },
  roomCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 15, elevation: 2, gap: 15 },
  roomIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  roomIconImg: { width: 50, height: 50, borderRadius: 25 },
  roomName: { fontSize: 16, fontWeight: 'bold' },
  roomDesc: { fontSize: 12, marginBottom: 2 },
  roomMembers: { fontSize: 10, fontWeight: 'bold' },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, elevation: 1, gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20 },
  memberAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 14, fontWeight: 'bold' },
  memberLevel: { fontSize: 12 },
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 20, elevation: 4 },
  chatHeaderImageContainer: { width: '100%', height: 80 },
  chatHeaderImage: { width: '100%', height: '100%', position: 'absolute' },
  chatHeaderOverlay: { width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'rgba(0,0,0,0.5)' },
  backBtn: { marginRight: 15, padding: 5 },
  chatTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  chatSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  msgRow: { flexDirection: 'row', marginBottom: 15, width: '100%' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 5 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, elevation: 1 },
  bubbleMe: { backgroundColor: '#16a34a', borderBottomRightRadius: 2 },
  bubbleOther: { borderTopLeftRadius: 2 },
  senderName: { fontSize: 10, color: '#f59e0b', fontWeight: 'bold', marginBottom: 2 },
  msgText: { fontSize: 15 },
  textMe: { color: '#fff' },
  msgTime: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  msgImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 10, maxHeight: 100 },
  attachBtn: { padding: 10 },
  sendBtn: { width: 45, height: 45, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 20, elevation: 5, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { width: '100%', height: 50, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCancel: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnTextCancel: { fontWeight: 'bold' },
  btnSave: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnTextSave: { color: '#fff', fontWeight: 'bold' },
  visitAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  visitAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  visitName: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  visitBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  visitLevel: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  visitObj: { fontSize: 14, fontStyle: 'italic', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', gap: 10, width: '100%' },
  statBox: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: 'bold' },
  statLbl: { fontSize: 10 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, margin: 10, borderRadius: 12 },
  joinBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  adminMemberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  adminMemberName: { fontSize: 14, fontWeight: 'bold' },
  tagAdmin: { backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  tagMember: { backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tagBan: { backgroundColor: '#ef4444', padding: 5, borderRadius: 5 },
  roomEditThumb: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center' },
  roomEditPlaceholder: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }
});