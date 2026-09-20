import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, PanResponder, Pressable, StyleSheet, Text, View} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Product, fetchProductsWithPagination } from '../api/api';

const LIMIT = 20; // 20 items per batch (1 page)

export default function HomeScreen() {
  const router = useRouter();

  // Product/ Loading indicator / Load more states
  const [products, setProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const isLoadingRef = useRef(false);

  // Scroll Bar Usestate
  const [scrollProgress, setScrollProgress] = useState(0);
  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);


  const flatListRef = useRef<FlatList>(null);
  const contentHeightRef = useRef(1);
  const visibleHeightRef = useRef(1);
  const scrollProgressRef = useRef(0);
  const dragStartScrollY = useRef(0);

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
          // Filter out any potential duplicates by ID, just to be safe
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

  useEffect(() => {
    // Initial fetch for the first page of products
    fetchProductsWithPagination(LIMIT, 0)
      .then((data) => setProducts(data.products || []))
      .catch((error) => console.error('Error fetching initial data:', error));
  }, []);

  // Scrollbar (dynamic based on item (the more item, the narrow the scroll bar))
  const thumbHeight = Math.max((visibleHeight / contentHeight) * visibleHeight, 20);
  const maxScroll = contentHeight - visibleHeight;
  const scrollOffset =
    maxScroll > 0 ? (scrollProgress / maxScroll) * (visibleHeight - thumbHeight) : 0;

  // Dragable scroll bar (Handle pressing, dragging)
  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (!panResponderRef.current) {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true, //Capture the touch evnet when user interact with scroll bar
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

  // header Container for title
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <Text style={styles.headerSecondary}>All Products</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#ffffff', '#e6f0fa', '#cce0ff']} style={styles.gradientContainer}>
      <View style={styles.mainContainer}>
        {/* Sticky app name */}
        <View style={styles.appTitleBar}>
          <Text style={styles.appTitle}>SearchUp</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={products}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.gridItemWrapper}>
              <Pressable
                style={styles.cardContainer}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.itemImage} />
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
              </Pressable>
            </View>
          )}
          onEndReached={loadMoreProducts}
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
          ListFooterComponent={
            loading ? (
              <ActivityIndicator size="large" color="#1a365d" style={styles.footerSpinner} />
            ) : null
          }
        />

        {/* Custom scrollbar ; rightside */}
        <View style={styles.scrollTrack}>
          <View
            {...panResponder.panHandlers}
            hitSlop={{ left: 10, right: 10, top: 4, bottom: 4 }}
            style={[
              styles.scrollThumb,
              { height: thumbHeight, transform: [{ translateY: scrollOffset }] },
            ]}
          />
        </View>
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
    paddingTop: 100,
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

  // ---- Product card ----
  cardContainer: {
    backgroundColor: '#ffffff',
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

  // ---- Custom scrollbar ----
  scrollTrack: {
    position: 'absolute',
    right: 4,
    top: 50,
    bottom: 40,
    width: 6,
    backgroundColor: 'rgba(26, 54, 93, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },

  scrollThumb: {
    width: '100%',
    backgroundColor: 'rgba(26, 54, 93, 0.5)',
    borderRadius: 3,
  },

});
