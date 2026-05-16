import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal, Switch, useColorScheme, Alert, Platform, ImageBackground } from 'react-native';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../config/firebase';
import { Clock, Plus, Trash2, CalendarClock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Schedule() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [stopTime, setStopTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showStopPicker, setShowStopPicker] = useState(false);

  useEffect(() => {
    const schedRef = ref(database, 'state/schedules');
    const unsubscribe = onValue(schedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSchedules(Array.isArray(data) ? data : Object.values(data));
      } else {
        setSchedules([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleSchedule = (index, value) => {
    const newSchedules = [...schedules];
    newSchedules[index].enabled = value;
    set(ref(database, 'state/schedules'), newSchedules);
  };

  const handleDelete = (index) => {
    Alert.alert("Delete Schedule", "Remove this watering schedule?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          const newSchedules = schedules.filter((_, i) => i !== index);
          set(ref(database, 'state/schedules'), newSchedules);
        }
      }
    ]);
  };

  const handleAddSchedule = () => {
    if (schedules.length >= 5) {
      Alert.alert("Limit Reached", "You can only set a maximum of 5 schedules.");
      return;
    }

    const newSchedule = {
      startHour: startTime.getHours(),
      startMinute: startTime.getMinutes(),
      stopHour: stopTime.getHours(),
      stopMinute: stopTime.getMinutes(),
      enabled: true
    };

    const newSchedules = [...schedules, newSchedule];
    set(ref(database, 'state/schedules'), newSchedules);
    setModalVisible(false);
    
    // Reset modal state
    setStartTime(new Date());
    setStopTime(new Date());
  };

  const formatTime = (hour, min) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderItem = ({ item, index }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.cardInfo}>
        <Clock color={item.enabled ? theme.primary : theme.subText} size={24} />
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: item.enabled ? theme.text : theme.subText }]}>
            {formatTime(item.startHour, item.startMinute)}
          </Text>
          <Text style={[styles.durationText, { color: theme.subText }]}>
            to {formatTime(item.stopHour, item.stopMinute)}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Switch
          value={item.enabled}
          onValueChange={(val) => handleToggleSchedule(index, val)}
          trackColor={{ false: theme.switchOff, true: theme.primary }}
          thumbColor="#ffffff"
          style={{ marginRight: 10 }}
        />
        <TouchableOpacity onPress={() => handleDelete(index)} style={styles.deleteBtn}>
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground 
      source={require('../../assets/orchard_bg.png')} 
      style={styles.background}
      blurRadius={Platform.OS === 'ios' ? 8 : 4}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: 'rgba(255, 255, 255, 0.8)', borderBottomColor: theme.primary }]}>
          <Text style={[styles.title, { color: '#14532d' }]}>Automations</Text>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: theme.primary, borderRadius: 8 }]}
            onPress={() => setModalVisible(true)}
          >
            <Plus color="#ffffff" size={24} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={schedules}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CalendarClock color={theme.subText} size={48} />
              <Text style={[styles.emptyText, { color: theme.subText }]}>No schedules configured.</Text>
            </View>
          }
        />

        {/* ADD SCHEDULE MODAL */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Schedule</Text>
              
              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: theme.text }]}>Start Time:</Text>
                {Platform.OS === 'android' ? (
                  <TouchableOpacity 
                    style={[styles.pickerBtn, { borderColor: theme.border }]} 
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                      {formatTime(startTime.getHours(), startTime.getMinutes())}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, date) => {
                      if (date) setStartTime(date);
                    }}
                    style={{ width: 100 }}
                  />
                )}

                {showStartPicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, date) => {
                      setShowStartPicker(false);
                      if (date) setStartTime(date);
                    }}
                  />
                )}
              </View>

              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: theme.text }]}>Stop Time:</Text>
                {Platform.OS === 'android' ? (
                  <TouchableOpacity 
                    style={[styles.pickerBtn, { borderColor: theme.border }]} 
                    onPress={() => setShowStopPicker(true)}
                  >
                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                      {formatTime(stopTime.getHours(), stopTime.getMinutes())}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <DateTimePicker
                    value={stopTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, date) => {
                      if (date) setStopTime(date);
                    }}
                    style={{ width: 100 }}
                  />
                )}

                {showStopPicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={stopTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, date) => {
                      setShowStopPicker(false);
                      if (date) setStopTime(date);
                    }}
                  />
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.cancelBtn]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.saveBtn, { backgroundColor: theme.primary }]} 
                  onPress={handleAddSchedule}
                >
                  <Text style={styles.saveBtnText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const lightTheme = {
  overlayBg: 'rgba(240, 253, 244, 0.85)',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  text: '#14532d',
  subText: '#166534',
  border: '#bbf7d0',
  primary: '#dc2626',
  switchOff: '#cbd5e1',
};

const darkTheme = {
  overlayBg: 'rgba(2, 44, 34, 0.85)',
  cardBg: 'rgba(2, 44, 34, 0.95)',
  text: '#f0fdf4',
  subText: '#a7f3d0',
  border: '#065f46',
  primary: '#ef4444',
  switchOff: '#475569',
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addBtn: { padding: 4 },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 12,
    elevation: 1,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: { marginLeft: 16 },
  timeText: {
    fontSize: 20,
    fontWeight: '800',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  deleteBtn: { padding: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 4,
    borderWidth: 1,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerBtn: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  saveBtn: { elevation: 2 },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
