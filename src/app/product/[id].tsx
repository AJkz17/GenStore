import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Product, getProductById } from '../../api/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {

    console.log("Successfully clicked product with ID:", id);

    if (id) {
      setLoading(true);
      getProductById(id as string)
        .then((data) => {
          setProduct(data);
        })
        .catch((err) => {
          console.error('Failed to fetch product details:', err);
          setError('Failed to load product details.');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Product not found.'}</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#ffffff', '#e6f0fa', '#cce0ff']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: product.thumbnail }} style={styles.image} />

        <View style={styles.detailsContainer}>
          <Text style={styles.category}>{product.category?.toUpperCase()}</Text>
          <Text style={styles.title}>{product.title}</Text> 

          <Text style={styles.price}>${product.price}</Text>
          
          <Text style={styles.sectionHeader}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.sectionHeader}>Additional Information</Text>
          <Text style={styles.infoText}>Stock Available: {product.stock}</Text>
          <Text style={styles.infoText}>Rating: {product.rating} ⭐</Text>
          <Text style={styles.infoText}>Brand: {product.brand || 'N/A'}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#ffffff' 
  },
  scrollContent: { 
    padding: 16, 
    paddingTop: 40, 
    paddingBottom: 40 
  },
  detailsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // --- Image Styles ---
  image: { 
    width: '100%', 
    height: 220, 
    resizeMode: 'contain', 
    marginBottom: 20 
  },

  // --- Typography & Text Styles ---
  category: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#0275d8', 
    marginBottom: 6 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1a365d', 
    marginBottom: 8 
  },
  price: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2b8a3e', 
    marginBottom: 16 
  },
  sectionHeader: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1a365d', 
    marginTop: 14, 
    marginBottom: 6 
  },
  description: { 
    fontSize: 14, 
    color: '#4b5563', 
    lineHeight: 20 
  },
  infoText: { 
    fontSize: 13, 
    color: '#4b5563', 
    marginBottom: 4 
  },
  errorText: { 
    fontSize: 16, 
    color: '#d9534f', 
    fontWeight: 'bold' 
  },
});