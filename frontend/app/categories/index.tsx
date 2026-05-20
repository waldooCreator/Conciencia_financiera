import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FormInput, PrimaryButton } from '../../src/components';
import { categoryService } from '../../src/services/finance';
import { Category } from '../../src/types';

const COLORS = ['#6196aa', '#20394a', '#030706', '#c9ccc3', '#f9f5ed', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6196aa');

  const loadData = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Ingresa un nombre'); return; }
    setLoading(true);
    try {
      await categoryService.create({ name: name.trim(), color_hex: color });
      setName('');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo crear la categoría');
    } finally { setLoading(false); }
  };

  return (
    <View className="flex-1 bg-bone">
      <ScrollView className="flex-1 p-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-steel text-lg font-semibold">{'← Volver'}</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-noir">Categorías</Text>
        </View>

        <TouchableOpacity onPress={() => setShowModal(true)} className="bg-steel rounded-xl p-4 mb-4 items-center">
          <Text className="text-bone font-semibold">+ Nueva Categoría</Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <View key={cat.id} className="bg-denim rounded-2xl p-4 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: cat.color_hex }} />
              <Text className="text-bone text-lg">{cat.name}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-noir mb-4">Nueva Categoría</Text>
            <FormInput label="Nombre" placeholder="Ej: Hormiga" value={name} onChangeText={setName} />
            
            <Text className="text-noir font-medium mb-2 text-base">Color</Text>
            <View className="flex-row flex-wrap gap-3 mb-4">
              {COLORS.map((c) => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  className={`w-10 h-10 rounded-full ${color === c ? 'border-2 border-noir' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </View>

            <View className="flex-row mt-4">
              <View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setShowModal(false)} variant="secondary" /></View>
              <View className="flex-1 ml-2"><PrimaryButton title="Crear" onPress={handleCreate} loading={loading} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
