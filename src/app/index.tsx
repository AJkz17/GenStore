import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Product, fetchProductsWithPagination } from '../api/api';
import { ProductCard } from '@/components/ProductCard';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  
  // Loading & Pagination States
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Custom Scroll Bar States
  const [scrollProgress, setScrollProgress] = useState(0);
  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);

  const isLoadingRef = useRef(false);
  const LIMIT = 20; // 20 items per batch (1 Scroll)

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
          // Filter out any potential duplicates by ID just to be completely safe
          const existingIds = new Set(prev.map(p => p.id));
          const newUniqueProducts = data.products.filter(p => !existingIds.has(p.id));
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
    // Initial fetch for the first 20 products
    fetchProductsWithPagination(LIMIT, 0)
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((error) => console.error('Error fetching initial data:', error));
  }, []);

  // dynamic scrollbar thumb size
  const thumbHeight = Math.max(
    (visibleHeight / contentHeight) * visibleHeight,
    30
  );
  const maxScroll = contentHeight - visibleHeight;
  const scrollOffset = maxScroll > 0 ? (scrollProgress / maxScroll) * (visibleHeight - thumbHeight) : 0;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.stickyHeaderBar}>
        <Text style={styles.appTitle}>SearchUp</Text>
      </View>
      <Text style={styles.headerSecondary}>All Products</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#ffffff', '#e6f0fa', '#cce0ff']} style={styles.gradientContainer}>
      <View style={styles.mainContainer}>

        <FlatList
          data={products}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.gridItemWrapper}>
              <View style={styles.cardContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.itemImage} />
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
              </View>
            </View>
          )}
          onEndReached={loadMoreProducts} // Safely triggers pagination when scrolling down
          onEndReachedThreshold={0.5}
          onScroll={(event) => {
            setScrollProgress(event.nativeEvent.contentOffset.y);
          }}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onLayout={(event) => setVisibleHeight(event.nativeEvent.layout.height)}
          scrollEventThrottle={16}
          ListFooterComponent={
            loading ? <ActivityIndicator size="large" color="#1a365d" style={{ marginVertical: 20 }} /> : null
          }
        />

        {/* Custom Scroll Bar Track on the Right */}
        <View style={styles.scrollTrack}>
          <View 
            style={[
              styles.scrollThumb, 
              { height: thumbHeight, transform: [{ translateY: scrollOffset }] }
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
    backgroundColor: '#ffffff' 
  },

  mainContainer: { 
    flex: 1, 
    position: 'relative' 
  },

  scrollContent: { 
    padding: 16, 
    paddingTop: 20, 
    paddingBottom: 40 
  },

  columnWrapper: { 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },

  gridItemWrapper: { 
    width: '48%' 
  },

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
    marginVertical: 6 
  },

  itemTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#333', 
    textAlign: 'center', 
    marginBottom: 4 
  },

  itemPrice: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#2b8a3e', 
    marginBottom: 2 
  },

  stickyHeaderBar: {
    paddingHorizontal: 0,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 10,
  },

  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'left',
  },

  headerContainer: { 
    marginBottom: 8 
  },

  headerSecondary: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1a365d', 
    marginTop: 12, 
    marginBottom: 12 
  },

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