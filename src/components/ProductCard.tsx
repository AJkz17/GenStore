import React from 'react';
import { Text, StyleSheet, Image, Pressable } from 'react-native';
import { Product } from '../api/api';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable style={styles.cardContainer} onPress={onPress}>
      <Image source={{ uri: product.thumbnail }} style={styles.itemImage} />
      <Text style={styles.itemTitle} numberOfLines={1}>{product.title}</Text>
      <Text style={styles.itemPrice}>${product.price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
    
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
});