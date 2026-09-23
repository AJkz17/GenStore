// src/components/ProductCard.tsx
import React from 'react';
import { Text, StyleSheet, Image, Pressable, View } from 'react-native';
import { Product, ProductReview } from '../api/api';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const reviewCount = product.reviews?.length ?? 0;
  const hasDiscount = product.discountPercentage > 0;

  return (
    <Pressable style={styles.cardContainer} onPress={onPress}>
      {hasDiscount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>-{Math.round(product.discountPercentage)}%</Text>
        </View>
      )}

      <Image source={{ uri: product.thumbnail }} style={styles.itemImage} />

      <Text style={styles.itemTitle} numberOfLines={1}>
        {product.title}
      </Text>

      <View style={styles.ratingRow}>
        <Text style={styles.ratingStar}>★</Text>
        <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
        {reviewCount > 0 && <Text style={styles.reviewCountText}>({reviewCount})</Text>}
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.itemPrice}>${product.price}</Text>
        {product.stock <= 5 && product.stock > 0 && (
          <Text style={styles.lowStockText}>Only {product.stock} left</Text>
        )}
        {product.stock === 0 && <Text style={styles.outOfStockText}>Out of stock</Text>}
      </View>
    </Pressable>
  );
}

interface ProductReviewsProps {
  reviews: ProductReview[];
}

export function ProductReviews({ reviews }: ProductReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <Text style={styles.emptyText}>No reviews yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>

      {reviews.map((review, index) => (
        <View key={`${review.reviewerEmail}-${index}`} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>{review.reviewerName}</Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Text key={i} style={i < review.rating ? styles.starFilled : styles.starEmpty}>
                </Text>
              ))}
            </View>
          </View>

          <Text style={styles.reviewDate}>
            {new Date(review.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>

          <Text style={styles.reviewComment}>{review.comment}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 3,
  },

  ratingStar: {
    fontSize: 12,
    color: '#f5a623',
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  reviewCountText: {
    fontSize: 11,
    color: '#8a99ad',
  },

  priceRow: {
    alignItems: 'center',
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2b8a3e',
    marginBottom: 2,
  },

  lowStockText: {
    fontSize: 10,
    color: '#e63946',
    fontWeight: '600',
  },

  outOfStockText: {
    fontSize: 10,
    color: '#8a99ad',
    fontWeight: '600',
  },

  discountBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e63946',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 5,
    elevation: 5,
  },

  discountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 13,
    color: '#8a99ad',
  },

  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },

  starFilled: {
    fontSize: 12,
    color: '#f5a623',
  },

  starEmpty: {
    fontSize: 12,
    color: '#e0e0e0',
  },

  reviewDate: {
    fontSize: 11,
    color: '#8a99ad',
    marginBottom: 6,
  },

  reviewComment: {
    fontSize: 13,
    color: '#4a5568',
    lineHeight: 18,
  },
});