import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { AppColors } from '@/constants/theme';

type Reason = 'fake' | 'spam' | 'inappropriate' | 'wrong_info' | 'duplicate' | 'other';

const REASONS: { id: Reason; label: string; desc: string }[] = [
  { id: 'fake', label: 'Хуурамч', desc: 'Хуурамч зар, мөнгө залилах оролдлого' },
  { id: 'spam', label: 'Спам', desc: 'Давхардсан эсвэл автоматаар тавьсан' },
  { id: 'inappropriate', label: 'Зохисгүй агуулга', desc: 'Доромжлол, бохир үг' },
  { id: 'wrong_info', label: 'Буруу мэдээлэл', desc: 'Үнэ, тоо, байршил буруу' },
  { id: 'duplicate', label: 'Давхардсан', desc: 'Өөр хэн нэгний зарыг хуулсан' },
  { id: 'other', label: 'Бусад', desc: 'Бусад шалтгаан' },
];

type Props = {
  listingId: string | number;
  compact?: boolean;
  onReported?: (reason: Reason) => void;
};

export function ReportButton({ listingId, compact, onReported }: Props) {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Reason | null>(null);

  const submit = () => {
    if (!selected) return;
    // Phase 2: POST /api/listings/:id/report { reason }
    Alert.alert(
      'Мэдэгдэл хүлээн авлаа',
      'Таны мэдэгдлийг багийн дарга шалгана. 3+ мэдэгдэлтэй зар автоматаар нуугдана.'
    );
    onReported?.(selected);
    setVisible(false);
    setSelected(null);
  };

  return (
    <>
      <TouchableOpacity
        style={compact ? styles.compactBtn : styles.btn}
        onPress={() => setVisible(true)}
      >
        <Text style={compact ? styles.compactText : styles.btnText}>
          🚩 {compact ? 'Мэдэгдэх' : 'Зөрчил мэдэгдэх'}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Text style={styles.title}>Зөрчил мэдэгдэх</Text>
            <Text style={styles.subtitle}>
              Юутай холбоотой зөрчил вэ? Ямар ч мэдэгдэл нэр нууцлагдана.
            </Text>

            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.reasonCard, selected === r.id && styles.reasonCardActive]}
                onPress={() => setSelected(r.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reasonLabel, selected === r.id && styles.reasonLabelActive]}>
                    {r.label}
                  </Text>
                  <Text style={styles.reasonDesc}>{r.desc}</Text>
                </View>
                {selected === r.id && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => {
                  setVisible(false);
                  setSelected(null);
                }}
              >
                <Text style={styles.cancelText}>Цуцлах</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.submitBtn, !selected && styles.submitDisabled]}
                disabled={!selected}
                onPress={submit}
              >
                <Text style={styles.submitText}>Илгээх</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: AppColors.danger,
    alignItems: 'center',
  },
  btnText: { fontSize: 13, fontWeight: '700', color: AppColors.danger },
  compactBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  compactText: { fontSize: 11, color: AppColors.grayDark, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%',
  },
  title: { fontSize: 18, fontWeight: '700', color: AppColors.black },
  subtitle: { fontSize: 13, color: AppColors.grayDark, marginTop: 6, marginBottom: 14 },
  reasonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: AppColors.grayMedium, marginBottom: 8,
  },
  reasonCardActive: { borderColor: AppColors.primary, backgroundColor: '#F0FFF4' },
  reasonLabel: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  reasonLabelActive: { color: AppColors.primary },
  reasonDesc: { fontSize: 12, color: AppColors.grayDark, marginTop: 3 },
  check: { fontSize: 20, color: AppColors.primary, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: AppColors.grayLight },
  cancelText: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  submitBtn: { backgroundColor: AppColors.danger },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 14, fontWeight: '700', color: AppColors.white },
});
