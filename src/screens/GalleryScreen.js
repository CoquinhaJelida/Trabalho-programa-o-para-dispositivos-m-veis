import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, FlatList, Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Importante!
import { savePhotoLog, getGallery, deletePhoto, getTodayKey } from '../services/db';

export default function GalleryScreen() {
  const [gallery, setGallery] = useState({});
  const [selectedImage, setSelectedImage] = useState(null); // Para o modal de zoom

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    getGallery(setGallery);
  };

  // Função para abrir Câmera ou Galeria
  const handleAddPhoto = async () => {
    Alert.alert(
      "Registrar Progresso",
      "Escolha uma opção:",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Galeria", onPress: () => pickImage('gallery') },
        { text: "Câmera", onPress: () => pickImage('camera') },
      ]
    );
  };

  const pickImage = async (type) => {
    let result;
    
    if (type === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.granted === false) {
        return Alert.alert("Erro", "Precisamos de acesso à câmera.");
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8, // Qualidade boa mas leve
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    }

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const today = getTodayKey();
      
      await savePhotoLog(today, uri);
      loadImages(); // Recarrega a tela
    }
  };

  const handleDelete = (date, uri) => {
    Alert.alert("Excluir", "Deseja apagar esta foto?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", onPress: () => deletePhoto(date, uri, setGallery) }
    ]);
  };

  const dates = Object.keys(gallery).sort().reverse();

  return (
    <View style={styles.container}>
      {/* Botão de Adicionar */}
      <TouchableOpacity style={styles.btnAdd} onPress={handleAddPhoto}>
        <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
          <Feather name="camera" size={24} color="#fff" />
          <Text style={styles.btnText}>Nova Foto</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.title}>Minha Evolução</Text>

      {dates.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="image" size={50} color="#ddd" />
          <Text style={styles.emptyText}>Nenhuma foto registrada ainda.</Text>
          <Text style={styles.emptySubText}>Tire uma foto hoje para começar!</Text>
        </View>
      ) : (
        <FlatList
          data={dates}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item: date }) => (
            <View style={styles.dateSection}>
              <View style={styles.dateHeader}>
                <Feather name="calendar" size={16} color="#6d28d9" />
                <Text style={styles.dateText}>{date.split('-').reverse().join('/')}</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {gallery[date].map((uri, index) => (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => setSelectedImage(uri)}
                    onLongPress={() => handleDelete(date, uri)}
                    style={styles.imageWrapper}
                  >
                    <Image source={{ uri }} style={styles.thumbnail} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        />
      )}

      {/* Modal para ver foto grande */}
      <Modal visible={selectedImage !== null} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <Feather name="x" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  btnAdd: { marginBottom: 20 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, elevation: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 10 },
  emptySubText: { fontSize: 14, color: '#aaa' },

  dateSection: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 5 },
  dateText: { fontWeight: 'bold', color: '#333', marginLeft: 8 },
  
  imageWrapper: { marginRight: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  thumbnail: { width: 100, height: 100 },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: '100%', height: '80%' },
});