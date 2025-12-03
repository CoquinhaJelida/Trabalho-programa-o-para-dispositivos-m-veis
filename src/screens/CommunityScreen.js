import React, { useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const chatRooms = [
  { id: '1', name: 'Perda de Peso 🔥', description: 'Dicas e apoio para secar', members: 1240, color: ['#f59e0b', '#d97706'] },
  { id: '2', name: 'Projeto Monstro 💪', description: 'Hipertrofia e treino pesado', members: 850, color: ['#3b82f6', '#1d4ed8'] },
  { id: '3', name: 'Jejum Intermitente ⏱️', description: 'Protocolos e experiências', members: 600, color: ['#8b5cf6', '#6d28d9'] },
  { id: '4', name: 'Receitas Fit 🥗', description: 'Compartilhe seus pratos', members: 2100, color: ['#10b981', '#047857'] },
];

export default function CommunityScreen({ theme }) {
  const [currentRoom, setCurrentRoom] = useState(null); 
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState({}); 
  const flatListRef = useRef(null);

  const handleSend = (text = null, image = null) => {
    const content = text || inputText;
    if (!content && !image) return;

    const newMessage = {
      id: Date.now().toString(), text: content, image: image, isMe: true, timestamp: new Date(), sender: 'Você'
    };

    setMessages(prev => ({ ...prev, [currentRoom.id]: [newMessage, ...(prev[currentRoom.id] || [])] }));
    setInputText('');

    setTimeout(() => {
      const botMessage = {
        id: Date.now().toString() + 'bot', text: image ? "Uau! Bela foto! 📸" : "Concordo plenamente! Vamos pra cima! 🚀", isMe: false, timestamp: new Date(), sender: 'Membro da Comunidade'
      };
      setMessages(prev => ({ ...prev, [currentRoom.id]: [botMessage, ...(prev[currentRoom.id] || [])] }));
    }, 2000);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, aspect: [4, 3] });
    if (!result.canceled) handleSend(null, result.assets[0].uri);
  };

  const formatTime = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (!currentRoom) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Comunidade</Text>
          <Text style={[styles.headerSub, { color: theme.textSub }]}>Escolha sua tribo e participe.</Text>
        </View>

        <FlatList
          data={chatRooms}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.roomCard, { backgroundColor: theme.card }]} onPress={() => setCurrentRoom(item)}>
              <LinearGradient colors={item.color} style={styles.roomIcon}>
                <Feather name="users" size={24} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.roomName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.roomDesc, { color: theme.textSub }]}>{item.description}</Text>
                <Text style={[styles.roomMembers, { color: theme.primary }]}>{item.members} membros online</Text>
              </View>
              <Feather name="chevron-right" size={24} color={theme.tabIcon} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={[styles.chatContainer, { backgroundColor: theme.background }]}>
      <LinearGradient colors={currentRoom.color} style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setCurrentRoom(null)} style={styles.backBtn}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <View>
          <Text style={styles.chatTitle}>{currentRoom.name}</Text>
          <Text style={styles.chatSub}>{currentRoom.members} membros</Text>
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages[currentRoom.id] || []}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={[styles.msgRow, item.isMe ? styles.msgRowMe : styles.msgRowOther]}>
            {!item.isMe && <View style={[styles.avatar, {backgroundColor: theme.border}]}><Feather name="user" size={16} color={theme.textSub} /></View>}
            
            <View style={[styles.bubble, item.isMe ? styles.bubbleMe : [styles.bubbleOther, { backgroundColor: theme.card }]]}>
              {!item.isMe && <Text style={styles.senderName}>{item.sender}</Text>}
              {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
              {item.text && <Text style={[styles.msgText, item.isMe ? styles.textMe : { color: theme.text }]}>{item.text}</Text>}
              <Text style={[styles.msgTime, item.isMe ? {color: 'rgba(255,255,255,0.7)'} : {color: theme.textSub}]}>{formatTime(item.timestamp)}</Text>
            </View>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
            <Feather name="image" size={24} color={theme.textSub} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={theme.textSub}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, {backgroundColor: currentRoom.color[0]}]} onPress={() => handleSend()}>
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, paddingTop: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSub: { fontSize: 14 },
  roomCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 15, elevation: 2, gap: 15 },
  roomIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  roomName: { fontSize: 16, fontWeight: 'bold' },
  roomDesc: { fontSize: 12, marginBottom: 2 },
  roomMembers: { fontSize: 10, fontWeight: 'bold' },
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 20, elevation: 4 },
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
});