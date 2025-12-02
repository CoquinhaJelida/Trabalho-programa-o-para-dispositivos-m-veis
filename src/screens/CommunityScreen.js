import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Dados simulados das Salas
const chatRooms = [
  { id: '1', name: 'Perda de Peso 🔥', description: 'Dicas e apoio para secar', members: 1240, color: ['#f59e0b', '#d97706'] },
  { id: '2', name: 'Projeto Monstro 💪', description: 'Hipertrofia e treino pesado', members: 850, color: ['#3b82f6', '#1d4ed8'] },
  { id: '3', name: 'Jejum Intermitente ⏱️', description: 'Protocolos e experiências', members: 600, color: ['#8b5cf6', '#6d28d9'] },
  { id: '4', name: 'Receitas Fit 🥗', description: 'Compartilhe seus pratos', members: 2100, color: ['#10b981', '#047857'] },
];

export default function CommunityScreen() {
  const [currentRoom, setCurrentRoom] = useState(null); // Null = Lista de Salas, Objeto = Dentro da Sala
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState({}); // Objeto guardando msgs por sala ID
  const flatListRef = useRef(null);

  // Função para enviar mensagem
  const handleSend = (text = null, image = null) => {
    const content = text || inputText;
    if (!content && !image) return;

    const newMessage = {
      id: Date.now().toString(),
      text: content,
      image: image,
      isMe: true, // Mensagem minha
      timestamp: new Date(),
      sender: 'Você'
    };

    // Adiciona na lista da sala atual
    setMessages(prev => ({
      ...prev,
      [currentRoom.id]: [newMessage, ...(prev[currentRoom.id] || [])]
    }));

    setInputText('');

    // --- SIMULAÇÃO DE RESPOSTA (BOT) ---
    // (No futuro, aqui entraria o Firebase recebendo msg de outra pessoa)
    setTimeout(() => {
      const botMessage = {
        id: Date.now().toString() + 'bot',
        text: image ? "Uau! Bela foto! 📸" : "Concordo plenamente! Vamos pra cima! 🚀",
        isMe: false,
        timestamp: new Date(),
        sender: 'Membro da Comunidade'
      };
      setMessages(prev => ({
        ...prev,
        [currentRoom.id]: [botMessage, ...(prev[currentRoom.id] || [])]
      }));
    }, 2000);
  };

  // Função de enviar Foto
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      handleSend(null, result.assets[0].uri);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // --- RENDERIZAÇÃO DA LISTA DE SALAS (LOBBY) ---
  if (!currentRoom) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comunidade</Text>
          <Text style={styles.headerSub}>Escolha sua tribo e participe.</Text>
        </View>

        <FlatList
          data={chatRooms}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.roomCard} onPress={() => setCurrentRoom(item)}>
              <LinearGradient colors={item.color} style={styles.roomIcon}>
                <Feather name="users" size={24} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.roomName}>{item.name}</Text>
                <Text style={styles.roomDesc}>{item.description}</Text>
                <Text style={styles.roomMembers}>{item.members} membros online</Text>
              </View>
              <Feather name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // --- RENDERIZAÇÃO DO CHAT (SALA ABERTA) ---
  return (
    <View style={styles.chatContainer}>
      {/* Header do Chat */}
      <LinearGradient colors={currentRoom.color} style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setCurrentRoom(null)} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.chatTitle}>{currentRoom.name}</Text>
          <Text style={styles.chatSub}>{currentRoom.members} membros</Text>
        </View>
      </LinearGradient>

      {/* Lista de Mensagens */}
      <FlatList
        ref={flatListRef}
        data={messages[currentRoom.id] || []} // Pega msgs dessa sala
        keyExtractor={item => item.id}
        inverted // Mensagens novas embaixo
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={[styles.msgRow, item.isMe ? styles.msgRowMe : styles.msgRowOther]}>
            {!item.isMe && <View style={styles.avatar}><Feather name="user" size={16} color="#555" /></View>}
            
            <View style={[styles.bubble, item.isMe ? styles.bubbleMe : styles.bubbleOther]}>
              {!item.isMe && <Text style={styles.senderName}>{item.sender}</Text>}
              
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.msgImage} />
              )}
              
              {item.text && <Text style={[styles.msgText, item.isMe ? styles.textMe : styles.textOther]}>{item.text}</Text>}
              
              <Text style={[styles.msgTime, item.isMe ? {color: 'rgba(255,255,255,0.7)'} : {color: '#999'}]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
            <Feather name="image" size={24} color="#666" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
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
  // ESTILOS DO LOBBY
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 25, paddingTop: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 14, color: '#64748b' },
  
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, elevation: 2, gap: 15 },
  roomIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  roomName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  roomDesc: { fontSize: 12, color: '#666', marginBottom: 2 },
  roomMembers: { fontSize: 10, color: '#999', fontWeight: 'bold' },

  // ESTILOS DO CHAT
  chatContainer: { flex: 1, backgroundColor: '#eef2f6' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 20, elevation: 4 },
  backBtn: { marginRight: 15, padding: 5 },
  chatTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  chatSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  msgRow: { flexDirection: 'row', marginBottom: 15, width: '100%' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 5 },
  
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, elevation: 1 },
  bubbleMe: { backgroundColor: '#16a34a', borderBottomRightRadius: 2 },
  bubbleOther: { backgroundColor: '#fff', borderTopLeftRadius: 2 },
  
  senderName: { fontSize: 10, color: '#f59e0b', fontWeight: 'bold', marginBottom: 2 },
  msgText: { fontSize: 15 },
  textMe: { color: '#fff' },
  textOther: { color: '#333' },
  msgTime: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  msgImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },

  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 10, maxHeight: 100 },
  attachBtn: { padding: 10 },
  sendBtn: { width: 45, height: 45, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
});