import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Product, getAllProducts } from '@/api/api';

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all products on initial mount
  useEffect(() => {
    setLoading(true);
    getAllProducts()
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((error) => console.error('Error fetching products:', error))
      .finally(() => setLoading(false));
  }, []);

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
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1a365d" />
          </View>
        )}

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
              {/* Basic View displaying Image, Title, and Price */}
              <View style={styles.cardContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.itemImage} />
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // --- Layout & Container Styles ---
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

  // --- Card & Product Basic Info Styles ---
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

  // --- Header & Sticky Bar Styles ---
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

  // --- Loading Overlay Styles ---
  loadingOverlay: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});