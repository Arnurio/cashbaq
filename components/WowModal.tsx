import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';

interface WowModalProps {
  visible: boolean;
  maxRate: number;
  maxCategory: string;
  marketRate: number;
  marketBank: string;
  onClose: () => void;
}

export default function WowModal({
  visible,
  maxRate,
  maxCategory,
  marketRate,
  marketBank,
  onClose,
}: WowModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Карта добавлена!</Text>

          <View style={styles.greenBlock}>
            <Text style={styles.blockLabel}>Ваш максимальный кэшбэк</Text>
            <Text style={styles.bigRate}>{maxRate}%</Text>
            <Text style={styles.blockSub}>{maxCategory}</Text>
          </View>

          {marketRate > maxRate && (
            <View style={styles.orangeBlock}>
              <Text style={styles.blockLabel}>На рынке можно получить</Text>
              <Text style={styles.bigRateOrange}>{marketRate}%</Text>
              <Text style={styles.blockSubOrange}>{marketBank}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Начать</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 20,
  },
  greenBlock: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  orangeBlock: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  blockLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  bigRate: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 40,
    color: '#0D7C5F',
  },
  bigRateOrange: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 40,
    color: '#EA580C',
  },
  blockSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: '#0D7C5F',
  },
  blockSubOrange: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: '#EA580C',
  },
  btn: {
    backgroundColor: '#0D7C5F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  btnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
