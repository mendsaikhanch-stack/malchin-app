import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { AppColors } from '@/constants/theme';
import { householdApi, getToken } from '@/services/api';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Эзэн',
  admin: 'Админ',
  herder: 'Адуучин/Малчин',
  vet: 'Мал эмч',
  member: 'Гишүүн',
  viewer: 'Зочин' };

const ROLE_COLORS: Record<string, string> = {
  owner: '#43A047',   // ногоон
  admin: '#1E88E5',   // цэнхэр
  herder: '#FDD835',  // шар
  vet: '#FF8F00',     // улбар
  member: '#9E9E9E',  // саарал
  viewer: '#E0E0E0',  // цагаан
};

const ROLE_TEXT_COLORS: Record<string, string> = {
  owner: '#FFFFFF',
  admin: '#FFFFFF',
  herder: '#1A1A1A',
  vet: '#FFFFFF',
  member: '#FFFFFF',
  viewer: '#1A1A1A' };

const ALL_ROLES = ['owner', 'admin', 'herder', 'vet', 'member', 'viewer'];

export default function HouseholdScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [household, setHousehold] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Create form
  const [createName, setCreateName] = useState('');
  const [createAimag, setCreateAimag] = useState('');
  const [createSum, setCreateSum] = useState('');
  const [createBag, setCreateBag] = useState('');
  const [creating, setCreating] = useState(false);

  // Join form
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Role picker
  const [rolePickerUserId, setRolePickerUserId] = useState<number | null>(null);

  const fetchHousehold = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await householdApi.getMy();
      if (res && res.household) {
        setHousehold(res.household);
        // Determine current user from members
        if (res.household.members) {
          const me = res.household.members.find((m: any) => m.is_current_user);
          if (me) {
            setCurrentUserId(me.user_id || me.id);
            setCurrentUserRole(me.role || '');
          }
        }
        // Fetch stats
        try {
          const statsRes = await householdApi.getStats();
          setStats(statsRes);
        } catch {
          // Stats may not be available
        }
      } else {
        setHousehold(null);
      }
    } catch {
      setHousehold(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHousehold();
  }, [fetchHousehold]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHousehold();
  }, [fetchHousehold]);

  const handleCreate = async () => {
    if (!createName.trim()) {
      Alert.alert('Алдаа', 'Өрхийн нэр оруулна уу');
      return;
    }
    setCreating(true);
    try {
      await householdApi.create({
        name: createName.trim(),
        aimag: createAimag.trim() || undefined,
        sum: createSum.trim() || undefined,
        bag: createBag.trim() || undefined });
      setCreateName('');
      setCreateAimag('');
      setCreateSum('');
      setCreateBag('');
      await fetchHousehold();
      Alert.alert('Амжилттай', 'Өрх амжилттай үүсгэлээ!');
    } catch {
      Alert.alert('Алдаа', 'Өрх үүсгэхэд алдаа гарлаа');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length < 6) {
      Alert.alert('Алдаа', 'Урилгын кодоо зөв оруулна уу (6 тэмдэгт)');
      return;
    }
    setJoining(true);
    try {
      await householdApi.join({ invite_code: inviteCode.trim().toUpperCase() });
      setInviteCode('');
      await fetchHousehold();
      Alert.alert('Амжилттай', 'Өрхөд амжилттай нэгдлээ!');
    } catch {
      Alert.alert('Алдаа', 'Урилгын код буруу эсвэл хүчингүй байна');
    } finally {
      setJoining(false);
    }
  };

  const handleCopyInviteCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Хуулагдлаа', `Урилгын код: ${code} хуулагдлаа`);
  };

  const handleRegenerateCode = async () => {
    Alert.alert(
      'Урилгын код шинэчлэх',
      'Хуучин код хүчингүй болно. Шинэчлэх үү?',
      [
        { text: 'Болих' },
        {
          text: 'Тийм',
          onPress: async () => {
            try {
              await householdApi.regenerateInviteCode();
              await fetchHousehold();
              Alert.alert('Амжилттай', 'Урилгын код шинэчлэгдлээ');
            } catch {
              Alert.alert('Алдаа', 'Код шинэчлэхэд алдаа гарлаа');
            }
          } },
      ]
    );
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      await householdApi.changeMemberRole(userId, newRole);
      setRolePickerUserId(null);
      await fetchHousehold();
      Alert.alert('Амжилттай', 'Гишүүний эрх өөрчлөгдлөө');
    } catch {
      Alert.alert('Алдаа', 'Эрх өөрчлөхөд алдаа гарлаа');
    }
  };

  const handleRemoveMember = (userId: number, memberName: string) => {
    Alert.alert(
      'Гишүүн хасах',
      `${memberName}-г өрхөөс хасах уу?`,
      [
        { text: 'Болих' },
        {
          text: 'Хасах',
          style: 'destructive',
          onPress: async () => {
            try {
              await householdApi.removeMember(userId);
              await fetchHousehold();
              Alert.alert('Амжилттай', 'Гишүүн хасагдлаа');
            } catch {
              Alert.alert('Алдаа', 'Гишүүн хасахад алдаа гарлаа');
            }
          } },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Өрхөөс гарах',
      'Та энэ өрхөөс гарахдаа итгэлтэй байна уу?',
      [
        { text: 'Болих' },
        {
          text: 'Гарах',
          style: 'destructive',
          onPress: async () => {
            try {
              await householdApi.leave();
              setHousehold(null);
              setStats(null);
              setCurrentUserRole('');
              Alert.alert('Амжилттай', 'Өрхөөс гарлаа');
            } catch {
              Alert.alert('Алдаа', 'Өрхөөс гарахад алдаа гарлаа');
            }
          } },
      ]
    );
  };

  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Ачааллаж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // STATE 1: No household
  if (!household) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.headerEmoji}>{'\�\�\‍\�\�\‍\�\�\‍\�\�'}</Text>
          <Text style={styles.headerTitle}>Өрх бүл</Text>
          <Text style={styles.headerSubtitle}>
            Өрхийн гишүүдтэйгээ хамтран малаа удирдаарай
          </Text>

          {/* Create household card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Өрх үүсгэх</Text>
            <Text style={styles.cardDesc}>
              Шинэ өрх үүсгэж, гишүүдээ урих
            </Text>

            <Text style={styles.label}>Өрхийн нэр *</Text>
            <TextInput
              style={styles.input}
              value={createName}
              onChangeText={setCreateName}
              placeholder="Жишээ: Батын өрх"
              placeholderTextColor={AppColors.gray}
            />

            <Text style={styles.label}>Аймаг</Text>
            <TextInput
              style={styles.input}
              value={createAimag}
              onChangeText={setCreateAimag}
              placeholder="Аймгийн нэр"
              placeholderTextColor={AppColors.gray}
            />

            <Text style={styles.label}>Сум</Text>
            <TextInput
              style={styles.input}
              value={createSum}
              onChangeText={setCreateSum}
              placeholder="Сумын нэр"
              placeholderTextColor={AppColors.gray}
            />

            <Text style={styles.label}>Баг</Text>
            <TextInput
              style={styles.input}
              value={createBag}
              onChangeText={setCreateBag}
              placeholder="Багийн нэр"
              placeholderTextColor={AppColors.gray}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, creating && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={creating}
            >
              <Text style={styles.primaryBtnText}>
                {creating ? 'Үүсгэж байна...' : 'Үүсгэх'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Join household card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Өрхөд нэгдэх</Text>
            <Text style={styles.cardDesc}>
              Урилгын код ашиглан өрхөд нэгдэх
            </Text>

            <Text style={styles.label}>Урилгын код</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor={AppColors.gray}
              maxLength={6}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, joining && { opacity: 0.7 }]}
              onPress={handleJoin}
              disabled={joining}
            >
              <Text style={styles.primaryBtnText}>
                {joining ? 'Нэгдэж байна...' : 'Нэгдэх'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STATE 2: Has household
  const members = household.members || [];
  const invCode = household.invite_code || '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
      >
        {/* Household header */}
        <View style={styles.householdHeader}>
          <Text style={styles.householdEmoji}>{'\�\�'}</Text>
          <Text style={styles.householdName}>{household.name}</Text>
          {household.aimag && (
            <Text style={styles.householdLocation}>
              {'\�\�'} {household.aimag}
              {household.sum ? `, ${household.sum}` : ''}
              {household.bag ? `, ${household.bag}` : ''}
            </Text>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.total_members ?? members.length}</Text>
            <Text style={styles.statLabel}>Нийт гишүүд</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.total_livestock ?? 0}</Text>
            <Text style={styles.statLabel}>Нийт мал</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.livestock_types ?? 0}</Text>
            <Text style={styles.statLabel}>Малын төрөл</Text>
          </View>
        </View>

        {/* Members section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Гишүүд</Text>
          {members.map((member: any) => {
            const memberId = member.user_id || member.id;
            const memberRole = member.role || 'member';
            const isCurrentUser = member.is_current_user || memberId === currentUserId;
            const showControls = isAdmin && !isCurrentUser && memberRole !== 'owner';

            return (
              <View key={memberId} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {(member.name || 'Г').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>
                      {member.name || 'Нэргүй'}
                      {isCurrentUser ? ' (Та)' : ''}
                    </Text>
                    {member.phone && (
                      <Text style={styles.memberPhone}>{member.phone}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: ROLE_COLORS[memberRole] || ROLE_COLORS.member },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        { color: ROLE_TEXT_COLORS[memberRole] || '#FFFFFF' },
                      ]}
                    >
                      {ROLE_LABELS[memberRole] || memberRole}
                    </Text>
                  </View>
                </View>

                {/* Role picker for admins */}
                {showControls && (
                  <View style={styles.memberControls}>
                    {rolePickerUserId === memberId ? (
                      <View style={styles.rolePickerContainer}>
                        <Text style={styles.rolePickerLabel}>Эрх сонгох:</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.rolePickerScroll}
                        >
                          {ALL_ROLES.filter((r) => r !== 'owner').map((role) => (
                            <TouchableOpacity
                              key={role}
                              style={[
                                styles.roleChip,
                                {
                                  backgroundColor:
                                    memberRole === role
                                      ? ROLE_COLORS[role]
                                      : '#F0F0F0' },
                              ]}
                              onPress={() => handleChangeRole(memberId, role)}
                            >
                              <Text
                                style={[
                                  styles.roleChipText,
                                  {
                                    color:
                                      memberRole === role
                                        ? ROLE_TEXT_COLORS[role]
                                        : '#616161' },
                                ]}
                              >
                                {ROLE_LABELS[role]}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <TouchableOpacity
                          style={styles.cancelPickerBtn}
                          onPress={() => setRolePickerUserId(null)}
                        >
                          <Text style={styles.cancelPickerText}>Болих</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.memberActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setRolePickerUserId(memberId)}
                        >
                          <Text style={styles.actionBtnText}>Эрх өөрчлөх</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.removeBtn]}
                          onPress={() =>
                            handleRemoveMember(memberId, member.name || 'Гишүүн')
                          }
                        >
                          <Text style={styles.removeBtnText}>Хасах</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Invite code section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Урилгын код</Text>
          <View style={styles.inviteCodeCard}>
            <Text style={styles.inviteCodeDesc}>
              Энэ кодыг гишүүдэд өгөөд өрхөд нэгдүүлнэ
            </Text>
            <Text style={styles.inviteCode}>{invCode}</Text>
            <View style={styles.inviteActions}>
              <TouchableOpacity
                style={styles.inviteBtn}
                onPress={() => handleCopyInviteCode(invCode)}
              >
                <Text style={styles.inviteBtnText}>Хуулах</Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  style={[styles.inviteBtn, styles.inviteBtnSecondary]}
                  onPress={handleRegenerateCode}
                >
                  <Text style={styles.inviteBtnSecondaryText}>Шинэчлэх</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Leave button */}
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Text style={styles.leaveBtnText}>Өрхөөс гарах</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const PRIMARY = '#2d5016';
const PRIMARY_LIGHT = '#4a7c28';
const BG = '#f5f7f0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: AppColors.grayDark },

  // Header (no household)
  headerEmoji: {
    fontSize: 56,
    textAlign: 'center',
    marginTop: 24 },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: PRIMARY,
    textAlign: 'center',
    marginTop: 12 },
  headerSubtitle: {
    fontSize: 15,
    color: AppColors.grayDark,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24 },

  // Cards
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
    elevation: 2 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 4 },
  cardDesc: {
    fontSize: 13,
    color: AppColors.grayDark,
    marginBottom: 16 },

  // Form
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginBottom: 6,
    marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: AppColors.black,
    backgroundColor: AppColors.white },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center' },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20 },
  primaryBtnText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700' },

  // Household header
  householdHeader: {
    alignItems: 'center',
    paddingVertical: 24 },
  householdEmoji: {
    fontSize: 48 },
  householdName: {
    fontSize: 24,
    fontWeight: '900',
    color: PRIMARY,
    marginTop: 8,
    textAlign: 'center' },
  householdLocation: {
    fontSize: 14,
    color: AppColors.grayDark,
    marginTop: 6 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    boxShadow: '0px 1px 4px rgba(0,0,0,0.04)',
    elevation: 1 },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: PRIMARY },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginTop: 4,
    textAlign: 'center' },

  // Section
  section: {
    marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 12 },

  // Members
  memberCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.04)',
    elevation: 1 },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center' },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12 },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.white },
  memberDetails: {
    flex: 1 },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.black },
  memberPhone: {
    fontSize: 13,
    color: AppColors.grayDark,
    marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10 },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700' },

  // Member controls
  memberControls: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0' },
  memberActions: {
    flexDirection: 'row',
    gap: 8 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEF5E6' },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY },
  removeBtn: {
    backgroundColor: '#FDEDED' },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.danger },

  // Role picker
  rolePickerContainer: {
    marginTop: 4 },
  rolePickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginBottom: 8 },
  rolePickerScroll: {
    marginBottom: 8 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6 },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600' },
  cancelPickerBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4 },
  cancelPickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.gray },

  // Invite code
  inviteCodeCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    boxShadow: '0px 1px 4px rgba(0,0,0,0.04)',
    elevation: 1 },
  inviteCodeDesc: {
    fontSize: 13,
    color: AppColors.grayDark,
    textAlign: 'center',
    marginBottom: 12 },
  inviteCode: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    color: PRIMARY,
    marginBottom: 16 },
  inviteActions: {
    flexDirection: 'row',
    gap: 10 },
  inviteBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10 },
  inviteBtnText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '700' },
  inviteBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: PRIMARY },
  inviteBtnSecondaryText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '700' },

  // Leave button
  leaveBtn: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.danger,
    alignItems: 'center' },
  leaveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.danger } });
