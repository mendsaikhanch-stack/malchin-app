import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { marketApi, pricesApi } from '@/services/api';
import { AdBanner } from '@/components/ad-banner';

const tabs = ['Ханш', 'Түүхий эд', 'Зарууд', 'Миний зар'];

const itemTypeLabels: Record<string, string> = {
  livestock: 'Мах',
  live: 'Амьд мал',
  dairy: 'Сүү, цагаан идээ',
};

const materialLabels: Record<string, string> = {
  cashmere: 'Ноолуур',
  wool: 'Ноос',
  hide: 'Арьс шир',
  feed: 'Тэжээл',
};

const supplyLabel = (s: string) => {
  if (s === 'high') return { text: 'Их', color: AppColors.success };
  if (s === 'low') return { text: 'Бага', color: AppColors.danger };
  return { text: 'Хэвийн', color: AppColors.gray };
};

const demandLabel = (d: string) => {
  if (d === 'high') return { text: 'Өндөр', color: AppColors.danger };
  if (d === 'low') return { text: 'Бага', color: AppColors.success };
  return { text: 'Хэвийн', color: AppColors.gray };
};

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function pctChange(cur: number, prev: number) {
  if (!prev) return { text: '', color: AppColors.gray };
  const pct = ((cur - prev) / prev * 100).toFixed(1);
  if (cur > prev) return { text: `+${pct}%`, color: AppColors.success };
  if (cur < prev) return { text: `${pct}%`, color: AppColors.danger };
  return { text: '0%', color: AppColors.gray };
}

const animalTypes = [
  { key: 'sheep', label: 'Хонь', emoji: '\uD83D\uDC11' },
  { key: 'goat', label: 'Ямаа', emoji: '\uD83D\uDC10' },
  { key: 'cattle', label: 'Үхэр', emoji: '\uD83D\uDC02' },
  { key: 'horse', label: 'Адуу', emoji: '\uD83D\uDC0E' },
  { key: 'camel', label: 'Тэмээ', emoji: '\uD83D\uDC2A' },
];
const animalInfo = (t: string) => animalTypes.find(a => a.key === t) || { label: t, emoji: '\uD83D\uDC3E' };

export default function MarketScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ханш
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [prices, setPrices] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState('');

  // Түүхий эд
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');

  // Зарууд
  const [listings, setListings] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('sheep');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');
  const [sortBy, setSortBy] = useState('');

  const userId = 1;

  const loadPrices = async () => {
    try {
      const [regRes, priceRes] = await Promise.allSettled([
        pricesApi.getRegions(),
        pricesApi.getMarketPrices(selectedRegion || undefined, selectedType || undefined),
      ]);
      if (regRes.status === 'fulfilled') setRegions(regRes.value || []);
      if (priceRes.status === 'fulfilled') setPrices(priceRes.value || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  const loadRawMaterials = async () => {
    try {
      const data = await pricesApi.getRawMaterials(selectedMaterial || undefined);
      setRawMaterials(data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  const loadListings = async () => {
    try {
      const params: any = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterAnimal) params.animal_type = filterAnimal;
      if (sortBy) params.sort = sortBy;
      const data = await marketApi.getAll(params);
      setListings(data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  const loadMyListings = async () => {
    try {
      const data = await marketApi.getByUser(userId);
      setMyListings(data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  const loadData = () => {
    setLoading(true);
    if (activeTab === 0) loadPrices();
    else if (activeTab === 1) loadRawMaterials();
    else if (activeTab === 2) loadListings();
    else loadMyListings();
  };

  useEffect(() => { loadData(); }, [activeTab, selectedRegion, selectedType, selectedMaterial, filterAnimal, sortBy]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const resetForm = () => {
    setTitle(''); setDescription(''); setQuantity(''); setPrice('');
    setLocation(''); setPhone(''); setImageUrl(''); setSelectedAnimal('sheep');
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Алдаа', 'Гарчиг оруулна уу'); return; }
    try {
      const payload = { user_id: userId, title: title.trim(), description: description.trim(), animal_type: selectedAnimal, quantity: parseInt(quantity) || 0, price: parseInt(price) || 0, location: location.trim(), phone: phone.trim(), image_url: imageUrl.trim() || undefined };
      if (editingId) {
        await marketApi.update(editingId, payload);
      } else {
        await marketApi.create(payload);
      }
      setShowModal(false); resetForm();
      loadListings(); if (activeTab === 3) loadMyListings();
    } catch { Alert.alert('Алдаа', editingId ? 'Зар засахад алдаа гарлаа' : 'За�� нэмэхэд алдаа гарлаа'); }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setSelectedAnimal(item.animal_type || 'sheep');
    setQuantity(String(item.quantity || ''));
    setPrice(String(item.price || ''));
    setLocation(item.location || '');
    setPhone(item.phone || '');
    setImageUrl(item.image_url || '');
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Устгах', 'Энэ зарыг устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try { await marketApi.delete(id); loadListings(); loadMyListings(); }
        catch { Alert.alert('Алдаа', 'Устгахад алдаа гарлаа'); }
      }},
    ]);
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    Alert.alert('Статус', newStatus === 'sold' ? 'Зарагдсан гэж тэмдэглэх үү?' : 'Идэвхтэй болгох уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Тийм', onPress: async () => {
        try { await marketApi.updateStatus(id, newStatus); loadMyListings(); }
        catch { Alert.alert('Алдаа'); }
      }},
    ]);
  };

  const handleSearch = () => { setLoading(true); loadListings(); };

  // Group prices by market
  const groupedPrices: Record<string, any[]> = {};
  prices.forEach((p: any) => {
    const key = `${p.market_name} (${p.location})`;
    if (!groupedPrices[key]) groupedPrices[key] = [];
    groupedPrices[key].push(p);
  });

  // Group raw materials by type
  const groupedRaw: Record<string, any[]> = {};
  rawMaterials.forEach((r: any) => {
    const key = r.material_type;
    if (!groupedRaw[key]) groupedRaw[key] = [];
    groupedRaw[key].push(r);
  });

  const renderPrices = () => (
    <>
      {/* Region filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.chip, !selectedRegion && styles.chipActive]} onPress={() => setSelectedRegion('')}>
          <Text style={[styles.chipText, !selectedRegion && styles.chipTextActive]}>Бүгд</Text>
        </TouchableOpacity>
        {regions.map((r: any) => (
          <TouchableOpacity key={r.aimag} style={[styles.chip, selectedRegion === r.aimag && styles.chipActive]} onPress={() => setSelectedRegion(r.aimag)}>
            <Text style={[styles.chipText, selectedRegion === r.aimag && styles.chipTextActive]}>{r.aimag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll2} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.chipSmall, !selectedType && styles.chipSmallActive]} onPress={() => setSelectedType('')}>
          <Text style={[styles.chipSmallText, !selectedType && styles.chipSmallTextActive]}>Бүгд</Text>
        </TouchableOpacity>
        {Object.entries(itemTypeLabels).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.chipSmall, selectedType === key && styles.chipSmallActive]} onPress={() => setSelectedType(key)}>
            <Text style={[styles.chipSmallText, selectedType === key && styles.chipSmallTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Price table by market */}
      {Object.entries(groupedPrices).map(([marketKey, items]) => (
        <View key={marketKey} style={styles.marketCard}>
          <Text style={styles.marketName}>{'\uD83C\uDFEA'} {marketKey}</Text>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2.5 }]}>Бараа</Text>
            <Text style={[styles.th, { flex: 1.3 }]}>Бөөний</Text>
            <Text style={[styles.th, { flex: 1.3 }]}>Жижиг</Text>
            <Text style={[styles.th, { flex: 1 }]}>Өөрчлөлт</Text>
          </View>
          {items.map((item: any, i: number) => {
            const change = pctChange(item.retail_price, item.prev_price);
            const sup = supplyLabel(item.supply);
            const dem = demandLabel(item.demand);
            return (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <View style={{ flex: 2.5 }}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <View style={styles.sdRow}>
                    <Text style={styles.sdLabel}>Н:<Text style={[styles.sdValue, { color: sup.color }]}>{sup.text}</Text></Text>
                    <Text style={styles.sdLabel}> Э:<Text style={[styles.sdValue, { color: dem.color }]}>{dem.text}</Text></Text>
                  </View>
                </View>
                <Text style={[styles.td, { flex: 1.3 }]}>{'\u20AE'}{fmt(item.wholesale_price)}</Text>
                <Text style={[styles.td, { flex: 1.3, fontWeight: '700' }]}>{'\u20AE'}{fmt(item.retail_price)}</Text>
                <Text style={[styles.td, { flex: 1, color: change.color, fontWeight: '700' }]}>{change.text}</Text>
              </View>
            );
          })}
        </View>
      ))}
      {prices.length === 0 && <Text style={styles.emptyText}>Ханшийн мэдээлэл олдсонгүй</Text>}
    </>
  );

  const renderRawMaterials = () => (
    <>
      {/* Material type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.chip, !selectedMaterial && styles.chipActive]} onPress={() => setSelectedMaterial('')}>
          <Text style={[styles.chipText, !selectedMaterial && styles.chipTextActive]}>Бүгд</Text>
        </TouchableOpacity>
        {Object.entries(materialLabels).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.chip, selectedMaterial === key && styles.chipActive]} onPress={() => setSelectedMaterial(key)}>
            <Text style={[styles.chipText, selectedMaterial === key && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {Object.entries(groupedRaw).map(([typeKey, items]) => (
        <View key={typeKey} style={styles.marketCard}>
          <Text style={styles.marketName}>{materialLabels[typeKey] || typeKey}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2.5 }]}>Нэр / Зэрэг</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Үнэ</Text>
            <Text style={[styles.th, { flex: 0.8 }]}>Өөрч.</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Худалдан авагч</Text>
          </View>
          {items.map((item: any, i: number) => {
            const change = pctChange(item.price, item.prev_price);
            const sup = supplyLabel(item.supply);
            const dem = demandLabel(item.demand);
            return (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <View style={{ flex: 2.5 }}>
                  <Text style={styles.itemName}>{item.material_name}</Text>
                  <Text style={styles.gradeText}>{item.grade} · {item.unit}</Text>
                  <View style={styles.sdRow}>
                    <Text style={styles.sdLabel}>Н:<Text style={[styles.sdValue, { color: sup.color }]}>{sup.text}</Text></Text>
                    <Text style={styles.sdLabel}> Э:<Text style={[styles.sdValue, { color: dem.color }]}>{dem.text}</Text></Text>
                  </View>
                </View>
                <Text style={[styles.td, { flex: 1.2, fontWeight: '700' }]}>{'\u20AE'}{fmt(item.price)}</Text>
                <Text style={[styles.td, { flex: 0.8, color: change.color, fontWeight: '700' }]}>{change.text}</Text>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.buyerText}>{item.buyer || '-'}</Text>
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
      {rawMaterials.length === 0 && <Text style={styles.emptyText}>Түүхий эдийн мэдээлэл олдсонгүй</Text>}
    </>
  );

  const handleCallListing = (phoneNum: string) => {
    const url = `tel:${phoneNum}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Утасны дугаар', phoneNum);
      }
    });
  };

  const renderListingCard = (item: any, showActions = false) => {
    const animal = animalInfo(item.animal_type);
    const isSold = item.status === 'sold';
    return (
      <View key={item.id} style={[styles.listingCard, isSold && { opacity: 0.6 }]}>
        {isSold && (
          <View style={styles.soldBadge}><Text style={styles.soldBadgeText}>ЗАРАГДСАН</Text></View>
        )}
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.listingImage} resizeMode="cover" />
        ) : null}
        <View style={styles.listingHeader}>
          <Text style={{ fontSize: 32, marginRight: 12 }}>{animal.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.listingTitle}>{item.title}</Text>
            <Text style={styles.listingMeta}>{animal.label} · {item.quantity} толгой</Text>
          </View>
          <View style={styles.priceBadge}><Text style={styles.priceText}>₮{fmt(item.price)}</Text></View>
        </View>
        {item.description ? <Text style={styles.listingDesc}>{item.description}</Text> : null}
        <View style={styles.listingContactRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerText}>📍 {item.location || '-'}</Text>
            <Text style={styles.footerText}>{item.created_at?.split(' ')[0]}</Text>
          </View>
          {item.phone ? (
            <TouchableOpacity style={styles.listingCallBtn} onPress={() => handleCallListing(item.phone)}>
              <Text style={styles.listingCallBtnText}>📞 Утасдах</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {item.phone ? <Text style={styles.listingPhone}>📱 {item.phone}</Text> : null}
        {showActions && (
          <View style={styles.listingActions}>
            <TouchableOpacity style={styles.actionBtnEdit} onPress={() => handleEdit(item)}>
              <Text style={styles.actionBtnEditText}>✏️ Засах</Text>
            </TouchableOpacity>
            {item.status === 'active' ? (
              <TouchableOpacity style={styles.actionBtnSold} onPress={() => handleStatusChange(item.id, 'sold')}>
                <Text style={styles.actionBtnSoldText}>✅ Зарагдсан</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionBtnSold} onPress={() => handleStatusChange(item.id, 'active')}>
                <Text style={styles.actionBtnSoldText}>🔄 Идэвхжүүлэх</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtnDel} onPress={() => handleDelete(item.id)}>
              <Text style={styles.actionBtnDelText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderListings = () => (
    <>
      {/* Хайлт */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Хайх... (жнь: хонь, үхэр)"
          placeholderTextColor={AppColors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Шүүлтүүр */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.chip, !filterAnimal && styles.chipActive]} onPress={() => setFilterAnimal('')}>
          <Text style={[styles.chipText, !filterAnimal && styles.chipTextActive]}>Бүгд</Text>
        </TouchableOpacity>
        {animalTypes.map((a) => (
          <TouchableOpacity key={a.key} style={[styles.chip, filterAnimal === a.key && styles.chipActive]} onPress={() => setFilterAnimal(filterAnimal === a.key ? '' : a.key)}>
            <Text style={[styles.chipText, filterAnimal === a.key && styles.chipTextActive]}>{a.emoji} {a.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Эрэмбэлэх */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll2} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.chipSmall, !sortBy && styles.chipSmallActive]} onPress={() => setSortBy('')}>
          <Text style={[styles.chipSmallText, !sortBy && styles.chipSmallTextActive]}>Шинэ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chipSmall, sortBy === 'price_asc' && styles.chipSmallActive]} onPress={() => setSortBy('price_asc')}>
          <Text style={[styles.chipSmallText, sortBy === 'price_asc' && styles.chipSmallTextActive]}>Үнэ ↑</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chipSmall, sortBy === 'price_desc' && styles.chipSmallActive]} onPress={() => setSortBy('price_desc')}>
          <Text style={[styles.chipSmallText, sortBy === 'price_desc' && styles.chipSmallTextActive]}>Үнэ ↓</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.addListingBtn} onPress={() => { resetForm(); setShowModal(true); }}>
        <Text style={styles.addListingText}>+ Зар нэмэх</Text>
      </TouchableOpacity>
      {listings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40 }}>📦</Text>
          <Text style={styles.emptyTitle}>Зар байхгүй</Text>
        </View>
      ) : (
        listings.map((item: any) => renderListingCard(item))
      )}
    </>
  );

  const renderMyListings = () => (
    <>
      <TouchableOpacity style={styles.addListingBtn} onPress={() => { resetForm(); setShowModal(true); }}>
        <Text style={styles.addListingText}>+ Шинэ зар нэмэх</Text>
      </TouchableOpacity>
      {myListings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40 }}>📋</Text>
          <Text style={styles.emptyTitle}>Танд зар байхгүй</Text>
          <Text style={styles.emptySubtext}>Мал, бүтээгдэхүүнээ зарахын тулд зар нэмнэ ү��</Text>
        </View>
      ) : (
        myListings.map((item: any) => renderListingCard(item, true))
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab bar */}
      <View style={styles.header}>
        <Text style={styles.title}>{'\uD83C\uDFEA'} Зах зээл</Text>
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 0 && renderPrices()}
            {activeTab === 1 && renderRawMaterials()}
            {activeTab === 2 && renderListings()}
            {activeTab === 3 && renderMyListings()}
          </>
        )}
        <AdBanner placement="market" />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Зар нэмэх Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? 'Зар засах' : 'Зар нэмэх'}</Text>
              <Text style={styles.label}>Малын төрөл</Text>
              <View style={styles.typeSelector}>
                {animalTypes.map((a) => (
                  <TouchableOpacity key={a.key} style={[styles.typeBtn, selectedAnimal === a.key && styles.typeBtnActive]} onPress={() => setSelectedAnimal(a.key)}>
                    <Text style={{ fontSize: 20 }}>{a.emoji}</Text>
                    <Text style={[styles.typeBtnLabel, selectedAnimal === a.key && { color: AppColors.primary, fontWeight: '600' }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Гарчиг</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Жнь: 50 хонь зарна" placeholderTextColor={AppColors.gray} />
              <Text style={styles.label}>Тайлбар</Text>
              <TextInput style={[styles.input, { height: 60 }]} value={description} onChangeText={setDescription} placeholder="Нэмэлт мэдээлэл..." placeholderTextColor={AppColors.gray} multiline />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Text style={styles.label}>Тоо</Text><TextInput style={styles.input} keyboardType="numeric" value={quantity} onChangeText={setQuantity} placeholder="50" placeholderTextColor={AppColors.gray} /></View>
                <View style={{ flex: 1 }}><Text style={styles.label}>Үнэ (₮)</Text><TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} placeholder="200000" placeholderTextColor={AppColors.gray} /></View>
              </View>
              <Text style={styles.label}>Байршил</Text>
              <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Төв аймаг, Зуунмод" placeholderTextColor={AppColors.gray} />
              <Text style={styles.label}>Утасны дугаар</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="99112233" placeholderTextColor={AppColors.gray} />
              <Text style={styles.label}>Зургийн холбоос (заавал биш)</Text>
              <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor={AppColors.gray} autoCapitalize="none" keyboardType="url" />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); resetForm(); }}><Text style={styles.cancelBtnText}>Болих</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}><Text style={styles.saveBtnText}>{editingId ? 'Хадгалах' : 'Нийтлэх'}</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: AppColors.black },
  // Tabs
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, backgroundColor: '#EEEEEE', borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: AppColors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: AppColors.primary, fontWeight: '700' },
  // Filters
  filterScroll: { marginTop: 12 },
  filterScroll2: { marginTop: 6 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: AppColors.white, borderWidth: 1.5, borderColor: AppColors.grayMedium },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  chipTextActive: { color: AppColors.white },
  chipSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.grayMedium },
  chipSmallActive: { backgroundColor: AppColors.accent, borderColor: AppColors.accent },
  chipSmallText: { fontSize: 11, fontWeight: '600', color: AppColors.grayDark },
  chipSmallTextActive: { color: AppColors.white },
  // Market price card
  marketCard: { backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  marketName: { fontSize: 15, fontWeight: '800', color: AppColors.black, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: AppColors.grayMedium, paddingBottom: 6, marginBottom: 4 },
  th: { fontSize: 10, fontWeight: '700', color: AppColors.gray, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  itemName: { fontSize: 13, fontWeight: '600', color: AppColors.black },
  td: { fontSize: 12, color: AppColors.black },
  sdRow: { flexDirection: 'row', marginTop: 2 },
  sdLabel: { fontSize: 9, color: AppColors.gray },
  sdValue: { fontSize: 9, fontWeight: '700' },
  gradeText: { fontSize: 10, color: AppColors.gray, marginTop: 1 },
  buyerText: { fontSize: 11, fontWeight: '600', color: AppColors.black },
  locationText: { fontSize: 9, color: AppColors.gray },
  emptyText: { fontSize: 14, color: AppColors.gray, fontStyle: 'italic', textAlign: 'center', paddingVertical: 40 },
  // Listings
  addListingBtn: { backgroundColor: AppColors.primary, marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, alignItems: 'center' },
  addListingText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: 50, marginHorizontal: 16, backgroundColor: AppColors.white, borderRadius: 16, marginTop: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: AppColors.grayDark, marginTop: 8 },
  listingCard: { backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  listingHeader: { flexDirection: 'row', alignItems: 'center' },
  listingTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  listingMeta: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  priceBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  priceText: { fontSize: 13, fontWeight: '800', color: AppColors.primaryDark },
  listingDesc: { fontSize: 12, color: AppColors.grayDark, marginTop: 8 },
  listingImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 10 },
  listingContactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  listingCallBtn: { backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#C8E6C9' },
  listingCallBtnText: { fontSize: 13, fontWeight: '700', color: AppColors.primaryDark },
  listingPhone: { fontSize: 12, color: AppColors.gray, marginTop: 6 },
  footerText: { fontSize: 11, color: AppColors.gray },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: AppColors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginBottom: 6, marginTop: 12 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  typeBtnActive: { borderColor: AppColors.primary, backgroundColor: '#E8F5E9' },
  typeBtnLabel: { fontSize: 10, color: AppColors.grayDark, marginTop: 2 },
  input: { borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, fontSize: 15, color: AppColors.black, backgroundColor: '#FAFAFA' },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: AppColors.grayDark },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: AppColors.primary, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: AppColors.white },
  // Search
  searchRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  searchInput: { flex: 1, borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, fontSize: 14, color: AppColors.black, backgroundColor: '#FAFAFA' },
  searchBtn: { backgroundColor: AppColors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { fontSize: 18 },
  // Listing actions
  listingActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  actionBtnEdit: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E3F2FD', alignItems: 'center' },
  actionBtnEditText: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  actionBtnSold: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center' },
  actionBtnSoldText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  actionBtnDel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#FFEBEE', alignItems: 'center' },
  actionBtnDelText: { fontSize: 16 },
  // Sold badge
  soldBadge: { position: 'absolute', top: 10, right: 10, zIndex: 1, backgroundColor: '#E65100', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  soldBadgeText: { fontSize: 10, fontWeight: '800', color: AppColors.white },
  // Empty subtext
  emptySubtext: { fontSize: 13, color: AppColors.gray, marginTop: 4, textAlign: 'center' },
});
