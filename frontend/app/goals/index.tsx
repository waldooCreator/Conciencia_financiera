import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, X } from 'lucide-react-native';
import { FormInput, PrimaryButton } from '../../src/components';
import { goalService } from '../../src/services/finance';
import { SavingsGoal } from '../../src/types';

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'funds' | 'delete' | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [fundsAmount, setFundsAmount] = useState('');

  const loadData = useCallback(async () => { try { setGoals(await goalService.getAll()); } catch {} }, []);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openCreate = () => { setModalMode('create'); setName(''); setTarget(''); setErrorMsg(''); };
  const openEdit = (g: SavingsGoal) => { setModalMode('edit'); setEditingGoal(g); setName(g.name); setTarget(g.target_amount); setErrorMsg(''); };
  const openFunds = (g: SavingsGoal) => { setModalMode('funds'); setEditingGoal(g); setFundsAmount(''); setErrorMsg(''); };
  const openDelete = (g: SavingsGoal) => { setModalMode('delete'); setEditingGoal(g); };

  const handleSave = async () => {
    if (!name.trim() || !target) { setErrorMsg('Completa nombre y meta'); return; }
    setLoading(true); setErrorMsg('');
    try {
      if (modalMode === 'create') await goalService.create({ name: name.trim(), target_amount: parseFloat(target) });
      else if (editingGoal) await goalService.update(editingGoal.id, { name: name.trim(), target_amount: parseFloat(target) });
      setModalMode(null); loadData();
    } catch { setErrorMsg('Error'); }
    finally { setLoading(false); }
  };

  const handleFunds = async () => {
    if (!fundsAmount || !editingGoal) { setErrorMsg('Ingresa un monto'); return; }
    setLoading(true); setErrorMsg('');
    try { await goalService.addFunds(editingGoal.id, parseFloat(fundsAmount)); setModalMode(null); loadData(); }
    catch { setErrorMsg('Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingGoal) return;
    setLoading(true);
    try { await goalService.delete(editingGoal.id); setModalMode(null); loadData(); }
    catch { setErrorMsg('No se pudo eliminar'); }
    finally { setLoading(false); }
  };

  return (
    <View className="flex-1 bg-bone">
      <ScrollView className="flex-1 p-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.replace('/settings')} className="mr-4 flex-row items-center">
            <ChevronLeft size={24} strokeWidth={2} color="#030706" />
            <Text className="text-noir text-lg font-semibold ml-1">Volver</Text>
          <Text className="text-2xl font-bold text-noir">Metas de Ahorro</Text>
        </View>
        {errorMsg ? <View className="bg-red-50 border border-red-400 rounded-xl p-3 mb-3"><Text className="text-red-600 text-center">{errorMsg}</Text></View> : null}
        <TouchableOpacity onPress={openCreate} className="bg-steel rounded-xl p-4 mb-4 items-center"><Text className="text-bone font-semibold">+ Nueva Meta</Text></TouchableOpacity>

        {goals.map((g) => (
          <View key={g.id} className="bg-denim rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-center mb-3"><Text className="text-bone font-semibold text-lg">{g.name}</Text><Text className="text-steel font-bold">{g.progress_percentage.toFixed(0)}%</Text></View>
            <View className="bg-steel/20 rounded-full h-3 mb-2"><View className="bg-steel rounded-full h-3" style={{ width: `${Math.min(100, g.progress_percentage)}%` }} /></View>
            <Text className="text-concrete text-sm">${parseFloat(g.current_amount).toLocaleString()} / ${parseFloat(g.target_amount).toLocaleString()}</Text>
            <View className="flex-row mt-3 pt-3 border-t border-steel/20" style={{gap: 6}}>
              <TouchableOpacity onPress={() => openFunds(g)} className="bg-green-500/20 px-3 py-1 rounded-lg"><Text className="text-green-400 text-xs">+ Fondos</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => openEdit(g)} className="bg-steel/30 px-3 py-1 rounded-lg"><Text className="text-steel text-xs">Editar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => openDelete(g)} className="bg-red-500/20 px-3 py-1 rounded-lg"><Text className="text-red-400 text-xs">Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalMode === 'create' || modalMode === 'edit'} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-noir mb-4">{modalMode === 'create' ? 'Nueva' : 'Editar'} Meta</Text>
            <FormInput label="Nombre" placeholder="Ej: Vacaciones" value={name} onChangeText={setName} />
            <FormInput label="Meta ($)" placeholder="0.00" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
            <View className="flex-row mt-4"><View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setModalMode(null)} variant="secondary" /></View><View className="flex-1 ml-2"><PrimaryButton title="Guardar" onPress={handleSave} loading={loading} /></View></View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalMode === 'funds'} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-noir mb-4">Agregar Fondos</Text>
            <Text className="text-concrete mb-4">{editingGoal?.name}</Text>
            <FormInput label="Monto ($)" placeholder="0.00" value={fundsAmount} onChangeText={setFundsAmount} keyboardType="decimal-pad" />
            <View className="flex-row mt-4"><View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setModalMode(null)} variant="secondary" /></View><View className="flex-1 ml-2"><PrimaryButton title="Agregar" onPress={handleFunds} loading={loading} /></View></View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalMode === 'delete'} transparent animationType="fade">
        <View className="flex-1 bg-noir/50 justify-center items-center p-6">
          <View className="bg-bone rounded-2xl p-6 w-80">
            <Text className="text-xl font-bold text-noir mb-2">Eliminar</Text>
            <Text className="text-concrete mb-6">¿Eliminar "{editingGoal?.name}"?</Text>
            <View className="flex-row"><View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setModalMode(null)} variant="secondary" /></View><View className="flex-1 ml-2"><PrimaryButton title="Eliminar" onPress={handleDelete} loading={loading} /></View></View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
