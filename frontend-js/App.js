import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';

// 模拟小红书帖子数据
const initialPosts = [
  {
    id: '1',
    title: '夏日清凉穿搭',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
    likes: 128,
  },
  {
    id: '2',
    title: '京都咖啡日记',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
    likes: 245,
  },
  {
    id: '3',
    title: '午后阳光与书',
    image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7',
    likes: 86,
  },
  {
    id: '4',
    title: '我的绿植角落🌿',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6',
    likes: 172,
  },
  {
    id: '5',
    title: '旅行日记：海边傍晚',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    likes: 301,
  },
];

export default function App() {
  const [posts, setPosts] = useState(initialPosts);

  const handleLike = (id) => {
    setPosts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      )
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => handleLike(item.id)}
      >
        <Text style={styles.likeText}>❤️ {item.likes}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>小红书</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2} // 两列瀑布流布局
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e60012', // 小红书红
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
    elevation: 3, // Android 阴影
    shadowColor: '#000', // iOS 阴影
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: '100%',
    height: 180,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    padding: 8,
  },
  likeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  likeText: {
    fontSize: 14,
    color: '#e60012',
  },
});
