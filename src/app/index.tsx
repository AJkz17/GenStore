import React, { useEffect, useRef, useState } from 'react';
import { Animated, ActivityIndicator, FlatList, Image, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { searchProducts, Product, fetchProductsWithPagination } from '../api/api';
import { debouncedValue } from '@/hooks/debounceValue';
import { Category, fetchCategories, fetchProductsByCategory } from '../api/api';

const LIMIT = 20;

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  const [products, setProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);

  const flatListRef = useRef<FlatList>(null);
  const contentHeightRef = useRef(1);
  const visibleHeightRef = useRef(1);
  const scrollProgressRef = useRef(0);
  const dragStartScrollY = useRef(0);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = debouncedValue(searchQuery.trim(), 400);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const isSearchMode = debouncedQuery.length > 0;

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryResults, setCategoryResults] = useState<Product[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const isCategoryMode = selectedCategory !== null;

  const visibleCategories = categories.slice(0, 3);
  const remainingCategories = categories.slice(3);
  const activeData = isSearchMode ? searchResults : isCategoryMode ? categoryResults : products;
  const isFilteredMode = isSearchMode || isCategoryMode;
  // Scrollbar (dynamic based on item (the more item, the narrow the scroll bar))
  const thumbHeight = Math.max((visibleHeight / contentHeight) * visibleHeight, 20);
  const [titleBarHeight, setTitleBarHeight] = useState(100);
  const maxScroll = contentHeight - visibleHeight;
  const scrollOffset = maxScroll > 0 ? (scrollProgress / maxScroll) * (visibleHeight - thumbHeight) : 0;
  const canScroll = contentHeight > visibleHeight;

  const handleSelectCategory = (slug: string) => {
    setSearchQuery('');
    setSelectedCategory((prev) => (prev === slug ? null : slug));
  };

  const handleSelectCategoryFromDropdown = (slug: string) => {
    handleSelectCategory(slug);
    setShowCategoryDropdown(false);
  };

  const handleChangeSearch = (text: string) => {
    setSelectedCategory(null);
    setSearchQuery(text);
  };

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((error) => console.error('Error fetching categories:', error));
  }, []);

  useEffect(() => {
    scrollProgressRef.current = 0;
    contentHeightRef.current = 1;
    visibleHeightRef.current = 1;
    setScrollProgress(0);
    setContentHeight(1);
    setVisibleHeight(1);
  }, [isSearchMode, isCategoryMode, selectedCategory]);

  useEffect(() => {
    if (!isCategoryMode) {
      setCategoryResults([]);
      return;
    }

    setIsCategoryLoading(true);
    fetchProductsByCategory(selectedCategory)
      .then((data) => setCategoryResults(data.products || []))
      .catch((error) => console.error('Error fetching category products:', error))
      .finally(() => setIsCategoryLoading(false));
  }, [selectedCategory]);

  useEffect(() => {
    if (!isSearchMode) {
      setSearchResults([]);
      return;
    }

    const requestId = ++searchRequestIdRef.current;
      setIsSearching(true);

      searchProducts(debouncedQuery)
        .then((data) => {
          if (requestId === searchRequestIdRef.current) {
            setSearchResults(data.products || []);
          }
        })
        .catch((error) => console.error('Search error:', error))
        .finally(() => {
          if (requestId === searchRequestIdRef.current) {
            setIsSearching(false);
          }
        });
    }, [debouncedQuery, isSearchMode]);

  useEffect(() => {
    // Initial fetch for the first page of products
    setLoading(true);
    fetchProductsWithPagination(LIMIT, 0)
      .then((data) => setProducts(data.products || []))
      .catch((error) => console.error('Error fetching initial data:', error))
      .finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
  setRefreshing(true);
  const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
  try {
    const fetchPromise = isSearchMode
      ? searchProducts(debouncedQuery).then((data) => setSearchResults(data.products || []))
      : isCategoryMode
      ? fetchProductsByCategory(selectedCategory).then((data) => setCategoryResults(data.products || []))
      : fetchProductsWithPagination(LIMIT, 0).then((data) => {
          setProducts(data.products || []);
          setHasMore(true);
        });

    await Promise.all([fetchPromise, minDelay]);
  } catch (error) {
    console.error('Error refreshing:', error);
  } finally {
    setRefreshing(false);
  }
};

  const loadMoreProducts = async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const currentSkip = products.length;
      const data = await fetchProductsWithPagination(LIMIT, currentSkip);

      if (!data.products || data.products.length === 0) {
        setHasMore(false);
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newUniqueProducts = data.products.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newUniqueProducts];
        });

        if (data.products.length < LIMIT) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };

  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (!panResponderRef.current) {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        dragStartScrollY.current = scrollProgressRef.current;
      },

      onPanResponderMove: (_, gestureState) => {
        const contentH = contentHeightRef.current;
        const visibleH = visibleHeightRef.current;
        const thumbH = Math.max((visibleH / contentH) * visibleH, 20);
        const maxScrollVal = contentH - visibleH;
        const trackHeight = visibleH - thumbH;

        if (maxScrollVal <= 0 || trackHeight <= 0) return;

        const scrollDelta = (gestureState.dy / trackHeight) * maxScrollVal;
        const newOffset = Math.min(
          Math.max(dragStartScrollY.current + scrollDelta, 0),
          maxScrollVal
        );

        flatListRef.current?.scrollToOffset({ offset: newOffset, animated: false });
        scrollProgressRef.current = newOffset;
        setScrollProgress(newOffset);
      },
    });
  }
  const panResponder = panResponderRef.current;

  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <Text style={styles.headerSecondary}>
        {isCategoryMode ? categories.find((c) => c.slug === selectedCategory)?.name : 'All Products'}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={['#ffffff', '#e6f0fa', '#cce0ff']} style={styles.gradientContainer}>
      <View style={styles.mainContainer}>
        {/* Sticky app name */}
        <View style={styles.appTitleBar} onLayout={(event) => setTitleBarHeight(event.nativeEvent.layout.height)}>
          <Text style={styles.appTitle}>GenStore</Text>

          {/* Search bar */}
          <View style={styles.searchInputWrapper}>
            <TextInput
              value={searchQuery}
              onChangeText={handleChangeSearch}
              placeholder="Search products..."
              placeholderTextColor="#8a99ad"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.categoryRow}>
            {visibleCategories.map((item) => {
              const isActive = selectedCategory === item.slug;
              return (
                <Pressable
                  key={item.slug}
                  onPress={() => handleSelectCategory(item.slug)}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}

            {remainingCategories.length > 0 && (
              <Pressable
                onPress={() => setShowCategoryDropdown(true)}
                style={[
                  styles.categoryChip,
                  remainingCategories.some((c) => c.slug === selectedCategory) && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    remainingCategories.some((c) => c.slug === selectedCategory) && styles.categoryChipTextActive,
                  ]}
                >
                  More ▾
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <Modal
          visible={showCategoryDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryDropdown(false)}
        >
          <Pressable style={styles.dropdownOverlay} onPress={() => setShowCategoryDropdown(false)}>
            <View style={[styles.dropdownMenu, { top: titleBarHeight + 8 }]}>
              <ScrollView showsVerticalScrollIndicator={true} bounces={false}>
                {remainingCategories.map((item) => {
                  const isActive = selectedCategory === item.slug;
                  return (
                    <Pressable
                      key={item.slug}
                      onPress={() => handleSelectCategoryFromDropdown(item.slug)}
                      style={styles.dropdownItem}
                    >
                      <Text style={[styles.dropdownItemText, isActive && styles.dropdownItemTextActive]}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        <FlatList
          key={isSearchMode ? 'search' : isCategoryMode ? `category-${selectedCategory}` : 'all'}
          ref={flatListRef}
          data={activeData}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={[styles.scrollContent, { paddingTop: titleBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.gridItemWrapper}>
              <Pressable
                style={styles.cardContainer}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{index + 1}</Text>
                </View>

                <Image source={{ uri: item.thumbnail }} style={styles.itemImage} />
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
              </Pressable>
            </View>
          )}
          onEndReached={isFilteredMode ? undefined : loadMoreProducts}
          onEndReachedThreshold={0.5}
          onScroll={(event) => {
            const y = event.nativeEvent.contentOffset.y;
            scrollProgressRef.current = y;
            setScrollProgress(y);
          }}
          onContentSizeChange={(_, height) => {
            contentHeightRef.current = height;
            setContentHeight(height);
          }}
          onLayout={(event) => {
            const h = event.nativeEvent.layout.height;
            visibleHeightRef.current = h;
            setVisibleHeight(h);
          }}
          scrollEventThrottle={16}
          ListEmptyComponent={
            isFilteredMode && !isSearching && !isCategoryLoading ? (
              <Text style={styles.emptyText}>
                {isSearchMode ? `No results for "${debouncedQuery}"` : 'No products in this category'}
              </Text>
            ) : null
          }
          ListFooterComponent={
            (loading || isSearching || isCategoryLoading) ? (
              <ActivityIndicator size="large" color="#1a365d" style={styles.footerSpinner} />
            ) : null
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
        />

        {refreshing && (
          <View
            pointerEvents="none"
            style={[styles.refreshIndicatorContainer, { top: titleBarHeight + 12 }]}
          >
            <ActivityIndicator size="small" color="#1a365d" />
          </View>
        )}
         
         {/* Custom scrollbar ; rightside — hide while searching, since results aren't paginated */}
        {!isFilteredMode && canScroll && (
          <View style={[styles.scrollTrack, { top: titleBarHeight + 8 }]}>
            <View
              {...panResponder.panHandlers}
              hitSlop={{ left: 10, right: 10, top: 4, bottom: 4 }}
              style={[
                styles.scrollThumb,
                { height: thumbHeight, transform: [{ translateY: scrollOffset }] },
              ]}
            />
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  mainContainer: {
    flex: 1,
    position: 'relative',
  },

  appTitleBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },

  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'left',
    paddingTop: 20,
  },

  listHeaderContainer: {
    marginBottom: 8,
  },

  headerSecondary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginTop: 12,
    marginBottom: 12,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  gridItemWrapper: {
    width: '48%',
  },

  footerSpinner: {
    marginVertical: 20,
  },

  cardContainer: {
    backgroundColor: '#ffffff',
    position: 'relative',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  itemImage: {
    width: '100%',
    height: 90,
    resizeMode: 'contain',
    marginVertical: 6,
  },

  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2b8a3e',
    marginBottom: 2,
  },

  scrollTrack: {
    position: 'absolute',
    right: 6,
    bottom: 40,
    width: 8,
    backgroundColor: 'rgba(26, 54, 93, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },

  scrollThumb: {
    width: '100%',
    backgroundColor: 'rgba(26, 54, 93, 0.5)',
    borderRadius: 3,
  },

  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a365d',
  },

  clearButton: {
    paddingLeft: 8,
  },

  clearButtonText: {
    fontSize: 16,
    color: '#8a99ad',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#6b7c93',
  },

  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#787276',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    zIndex: 5,
    elevation: 5,
  },

  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f4f8',
  },

  categoryChipActive: {
    backgroundColor: '#1a365d',
  },

  categoryChipText: {
    fontSize: 13,
    color: '#1a365d',
    fontWeight: '500',
  },

  categoryChipTextActive: {
    color: '#fafafa',
  },

  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },

  dropdownMenu: {
    position: 'absolute',
    right: 16,
    left: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 300,
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  dropdownItemText: {
    fontSize: 15,
    color: '#1a365d',
  },

  dropdownItemTextActive: {
    fontWeight: 'bold',
    color: '#2b8a3e',
  },

  refreshBanner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#1a365d',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 20,
    elevation: 5,
  },

  refreshBannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  refreshIndicatorContainer: {
  position: 'absolute',
  alignSelf: 'center',
  zIndex: 20,
},
});