import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { FormInput, PrimaryButton } from '../../src/components';
import { categoryService } from '../../src/services/finance';
import { Category } from '../../src/types';

const COLORS = ['#6196aa', '#20394a', '#030706', '#c9ccc3', '#f9f5ed', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6196aa');

  const loadData = useCallback(async () => {
    try { setCategories(await categoryService.getAll()); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openCreate = () => { setModalMode('create'); setName(''); setColor('#6196aa'); setErrorMsg(''); };
  const openEdit = (cat: Category) => { setModalMode('edit'); setEditingCat(cat); setName(cat.name); setColor(cat.color_hex); setErrorMsg(''); };
  const openDelete = (cat: Category) => { setModalMode('delete'); setEditingCat(cat); };

  const handleSave = async () => {
    if (!name.trim()) { setErrorMsg('Ingresa un nombre'); return; }
    setLoading(true); setErrorMsg('');
    try {
      if (modalMode === 'create') await categoryService.create({ name: name.trim(), color_hex: color });
      else if (editingCat) await categoryService.update(editingCat.id, { name: name.trim(), color_hex: color });
      setModalMode(null); loadData();
    } catch { setErrorMsg('Error al guardar'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingCat) return;
    setLoading(true);
    try { await categoryService.delete(editingCat.id); setModalMode(null); loadData(); }
    catch { setErrorMsg('No se pudo eliminar'); setLoading(false); }
  };

  return (
    <View className="flex-1 bg-bone">
      <ScrollView className="flex-1 p-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.replace('/settings')} className="mr-4">
            <Text className="text-steel text-lg font-semibold">{'← Volver'}</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-noir">Categorías</Text>
        </View>
        {errorMsg ? <View className="bg-red-50 border border-red-400 rounded-xl p-3 mb-3"><Text className="text-red-600 text-center">{errorMsg}</Text></View> : null}
        <TouchableOpacity onPress={openCreate} className="bg-steel rounded-xl p-4 mb-4 items-center"><Text className="text-bone font-semibold">+ Nueva Categoría</Text></TouchableOpacity>

        {categories.map((cat) => (
          <View key={cat.id} className="bg-denim rounded-2xl p-4 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: cat.color_hex }} />
              <Text className="text-bone text-lg">{cat.name}</Text>
            </View>
            <View className="flex-row" style={{gap: 6}}>
              <TouchableOpacity onPress={() => openEdit(cat)} className="bg-steel/30 px-3 py-1 rounded-lg"><Text className="text-steel text-sm">Editar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => openDelete(cat)} className="bg-red-500/20 px-3 py-1 rounded-lg"><Text className="text-red-400 text-sm">Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={modalMode === 'create' || modalMode === 'edit'} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-noir mb-4">{modalMode === 'create' ? 'Nueva' : 'Editar'} Categoría</Text>
            <FormInput label="Nombre" placeholder="Ej: Hormiga" value={name} onChangeText={setName} />
            <Text className="text-noir font-medium mb-2 text-base">Color</Text>
            <View className="flex-row flex-wrap mb-4" style={{gap: 8}}>
              {COLORS.map((c) => (<TouchableOpacity key={c} onPress={() => setColor(c)} className={`w-10 h-10 rounded-full ${color === c ? 'border-2 border-noir' : ''}`} style={{ backgroundColor: c }} />))}
            </View>
            <View className="flex-row mt-4"><View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setModalMode(null)} variant="secondary" /></View><View className="flex-1 ml-2"><PrimaryButton title="Guardar" onPress={handleSave} loading={loading} /></View></View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={modalMode === 'delete'} transparent animationType="fade">
        <View className="flex-1 bg-noir/50 justify-center items-center p-6">
          <View className="bg-bone rounded-2xl p-6 w-80">
            <Text className="text-xl font-bold text-noir mb-2">Eliminar</Text>
            <Text className="text-concrete mb-6">¿Eliminar "{editingCat?.name}"?</Text>
            <View className="flex-row"><View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setModalMode(null)} variant="secondary" /></View><View className="flex-1 ml-2"><PrimaryButton title="Eliminar" onPress={handleDelete} loading={loading} /></View></View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
