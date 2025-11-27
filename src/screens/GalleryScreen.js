import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, FlatList, Modal, TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { savePhotoLog, getGallery, deletePhoto, getTodayKey, getProfile } from '../services/db';

export default function GalleryScreen() {
  const [gallery, setGallery] = useState({});
  
  // Estado modificado: agora guarda o OBJETO completo da imagem selecionada (uri, id, date)
  const [selectedImage, setSelectedImage] = useState(null); 
  
  // Estados para o Modal de Peso (Adicionar)
  const [modalVisible, setModalVisible] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState(null);
  const [weightInput, setWeightInput] = useState('');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    getGallery(setGallery);
  };

  const prepareWeightInput = () => {
    getProfile((data) => {
      if (data && data.weight) {
        setWeightInput(data.weight);
      } else {
        setWeightInput('');
      }
    });
  };

  const handleAddPhoto = async () => {
    Alert.alert("Nova Foto", "Escolha a origem:", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galeria", onPress: () => pickImage('gallery') },
      { text: "Câmera", onPress: () => pickImage('camera') },
    ]);
  };

  const pickImage = async (type) => {
    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 5],
    };

    if (type === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert("Erro", "Sem permissão de câmera.");
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      setTempPhotoUri(result.assets[0].uri);
      prepareWeightInput();
      setModalVisible(true);
    }
  };

  const saveFinalPhoto = async () => {
    if (tempPhotoUri) {
      const today = getTodayKey();
      await savePhotoLog(today, tempPhotoUri, weightInput);
      setModalVisible(false);
      setTempPhotoUri(null);
      loadImages();
    }
  };

  // Função de deletar chamada de dentro do Modal de Zoom
  const handleDeleteCurrent = () => {
    if (!selectedImage) return;

    Alert.alert(
      "Excluir Foto", 
      "Tem certeza que deseja apagar este registro?", 
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar", 
          style: "destructive", 
          onPress: async () => {
            await deletePhoto(selectedImage.date, selectedImage.id, setGallery);
            setSelectedImage(null); // Fecha o modal após deletar
          } 
        }
      ]
    );
  };

  const dates = Object.keys(gallery).sort().reverse();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btnAdd} onPress={handleAddPhoto}>
        <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
          <Feather name="camera" size={24} color="#fff" />
          <Text style={styles.btnText}>Registrar Progresso</Text>
        </LinearGradient>
      </TouchableOpacity>

      {dates.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="image" size={60} color="#e9d5ff" />
          <Text style={styles.emptyText}>Seu diário visual começa aqui.</Text>
        </View>
      ) : (
        <FlatList
          data={dates}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item: date }) => (
            <View style={styles.dateSection}>
              <View style={styles.dateHeader}>
                <Feather name="calendar" size={16} color="#7c3aed" />
                <Text style={styles.dateText}>{date.split('-').reverse().join('/')}</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {gallery[date].map((item, index) => {
                  const uri = item.uri || item; 
                  const weight = item.weight || null;
                  const id = item.id || item;

                  return (
                    <TouchableOpacity 
                      key={index} 
                      // Passamos o objeto completo (Data, ID, URI) para o modal saber o que deletar
                      onPress={() => setSelectedImage({ uri, id, date })}
                      style={styles.cardWrapper}
                    >
                      <Image source={{ uri }} style={styles.thumbnail} />
                      {weight && (
                        <View style={styles.weightBadge}>
                          <Text style={styles.weightText}>{weight}kg</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        />
      )}

      {/* --- MODAL 1: Inserir Peso (Ao adicionar) --- */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Peso</Text>
            <Text style={styles.modalSub}>Quantos kg você estava pesando nesta foto?</Text>
            
            {tempPhotoUri && (
              <Image source={{ uri: tempPhotoUri }} style={styles.modalPreview} />
            )}

            <TextInput 
              style={styles.input} 
              placeholder="Ex: 75.5" 
              keyboardType="numeric"
              value={weightInput}
              onChangeText={setWeightInput}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveFinalPhoto} style={styles.btnSave}>
                <Text style={styles.btnSaveText}>Salvar Tudo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: Zoom na Foto e Opção de DELETAR --- */}
      <Modal visible={selectedImage !== null} transparent={true} animationType="fade">
        <View style={styles.zoomContainer}>
          
          {/* Botão Fechar (X) */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <Feather name="x" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Botão Deletar (Lixeira) - NOVO */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteCurrent}>
            <Feather name="trash-2" size={24} color="#ef4444" />
            <Text style={styles.deleteText}>Excluir</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image 
              source={{ uri: selectedImage.uri }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  btnAdd: { marginBottom: 15 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, elevation: 3 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 10 },

  dateSection: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 5 },
  dateText: { fontWeight: 'bold', color: '#555', marginLeft: 8 },
  
  cardWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 140, borderRadius: 10, backgroundColor: '#eee' },
  weightBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  weightText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Modal Peso
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalSub: { color: '#666', marginBottom: 15, textAlign: 'center' },
  modalPreview: { width: 100, height: 100, borderRadius: 10, marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, width: '100%', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 10 },
  btnCancel: { flex: 1, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: 'bold' },
  btnSave: { flex: 1, padding: 12, backgroundColor: '#8b5cf6', borderRadius: 10, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },

  // Modal Zoom
  zoomContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  
  // Botão Fechar (Topo Direito)
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  
  // Botão Deletar (Topo Esquerdo)
  deleteBtn: { position: 'absolute', top: 50, left: 20, zIndex: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  deleteText: { color: '#ef4444', marginLeft: 8, fontWeight: 'bold' },

  fullImage: { width: '100%', height: '80%' },
});