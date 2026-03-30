import React from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { spacing } from '../constants/theme';

const GAP = 4;
const NUM_COLUMNS = 3;
const screenWidth = Dimensions.get('window').width;
const tileSize = (screenWidth - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type Props = {
  assets: MediaLibrary.Asset[];
  onTap: (asset: MediaLibrary.Asset) => void;
};

export function PhotoGrid({ assets, onTap }: Props) {
  return (
    <FlatList
      data={assets}
      numColumns={NUM_COLUMNS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <Pressable onPress={() => onTap(item)} testID={`grid-photo-${item.id}`}>
          <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  thumbnail: {
    width: tileSize,
    height: tileSize,
  },
});
