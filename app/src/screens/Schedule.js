import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal, Switch, useColorScheme, Alert, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../config/firebase';
import { Clock, Plus, Trash2, CalendarClock, X, ArrowLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Schedule({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <View style={[styles.iconContainer, { backgroundColor: item.enabled ? theme.primaryLight : theme.inputBg }]}>
          <Clock color={item.enabled ? theme.primary : theme.subText} size={20} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: item.enabled ? theme.text : theme.subText }]}>
            {formatTime(item.startHour, item.startMinute)}
          </Text>
          <Text style={[styles.durationText, { color: theme.subText }]}>
            until {formatTime(item.stopHour, item.stopMinute)}
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
          <Trash2 color={theme.danger} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.cardBg} />
      
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={theme.text} size={20} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Schedules</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CalendarClock color={theme.subText} size={36} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: theme.subText }]}>No schedules configured.</Text>
            </View>
          }
        />
      )}

      {/* ADD SCHEDULE MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Schedule</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.text} size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: theme.text }]}>Start Time:</Text>
              {Platform.OS === 'android' ? (
                <TouchableOpacity 
                  style={[styles.pickerBtn, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]} 
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>
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
                  style={[styles.pickerBtn, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]} 
                  onPress={() => setShowStopPicker(true)}
                >
                  <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>
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
                style={[styles.actionBtn, styles.cancelBtn, { borderColor: theme.border }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.saveBtn, { backgroundColor: theme.primary }]} 
                onPress={handleAddSchedule}
              >
                <Text style={styles.saveBtnText}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const lightTheme = {
  pageBg: '#f4f6f0',
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  border: '#e8eceb',
  inputBg: '#f4f6f0',
  inputBorder: '#dde3de',
  primary: '#4a7c59',
  primaryLight: '#eaf2ec',
  switchOff: '#dde3de',
  danger: '#c0392b'
};

const darkTheme = {
  pageBg: '#141a15',
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  border: '#2a3a2d',
  inputBg: '#162019',
  inputBorder: '#2a3a2d',
  primary: '#5a9469',
  primaryLight: '#1a2e1c',
  switchOff: '#2a3a2d',
  danger: '#e74c3c'
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: { marginLeft: 12 },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  durationText: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: { padding: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  saveBtn: {},
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  }
});
