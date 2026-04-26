import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { BRAND_COLOR } from '../lib/constants';

interface ReportInaccuracyModalProps {
  visible: boolean;
  bankId: string;
  bankName: string;
  categoryId: string;
  categoryName: string;
  currentRate: number;
  onClose: (submitted: boolean) => void;
}

export default function ReportInaccuracyModal({
  visible,
  bankId,
  bankName,
  categoryId,
  categoryName,
  currentRate,
  onClose,
}: ReportInaccuracyModalProps) {
  const [suggested, setSuggested] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setSuggested('');
    setComment('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = (submitted: boolean) => {
    reset();
    onClose(submitted);
  };

  const handleSubmit = async () => {
    setError(null);
    const suggestedRate = suggested.trim()
      ? parseFloat(suggested.replace(',', '.'))
      : null;

    if (suggested.trim() && (suggestedRate === null || !Number.isFinite(suggestedRate))) {
      setError('Введите число (например, 5 или 2.5)');
      return;
    }

    if (!suggested.trim() && !comment.trim()) {
      setError('Укажите ставку или опишите в комментарии');
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('rate_reports').insert({
      bank_id: bankId,
      category_id: categoryId,
      current_rate: currentRate,
      suggested_rate: suggestedRate,
      comment: comment.trim() || null,
    });

    if (insertError) {
      setError('Не удалось отправить. Попробуйте позже.');
      setSubmitting(false);
      return;
    }

    handleClose(true);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => handleClose(false)}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={() => handleClose(false)} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Сообщить о неточности</Text>
            <TouchableOpacity onPress={() => handleClose(false)} hitSlop={10}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.contextBox}>
            <Text style={styles.contextLine}>
              <Text style={styles.contextLabel}>Банк: </Text>
              {bankName}
            </Text>
            <Text style={styles.contextLine}>
              <Text style={styles.contextLabel}>Категория: </Text>
              {categoryName}
            </Text>
            <Text style={styles.contextLine}>
              <Text style={styles.contextLabel}>Сейчас показано: </Text>
              {currentRate}%
            </Text>
          </View>

          <Text style={styles.label}>Какая ставка на самом деле?</Text>
          <View style={styles.rateInputRow}>
            <TextInput
              style={styles.rateInput}
              value={suggested}
              onChangeText={setSuggested}
              placeholder="например, 5"
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
              maxLength={5}
            />
            <Text style={styles.rateSuffix}>%</Text>
          </View>

          <Text style={styles.label}>Комментарий (необязательно)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Например, ссылка на акцию или скриншот"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            maxLength={300}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Отправка...' : 'Отправить'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Спасибо! Мы проверим ставку и обновим её, если ваш отчёт подтвердится.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: '#111827',
  },
  contextBox: {
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  contextLabel: {
    fontFamily: 'Manrope_500Medium',
    color: '#6B7280',
  },
  contextLine: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#111827',
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  rateInput: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: '#111827',
    paddingVertical: 14,
  },
  rateSuffix: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: '#6B7280',
  },
  commentInput: {
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  error: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#EF4444',
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  hint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
});
