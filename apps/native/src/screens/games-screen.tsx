import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { RFValue } from 'react-native-responsive-fontsize'

const GamesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Games</Text>
      <Text style={styles.subtitle}>Shake is available on the web for now.</Text>

      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <Text style={styles.cardTitle}>Shake</Text>
        <Text style={styles.cardSubtitle}>Open /shake in the web app.</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: RFValue(22),
    fontFamily: 'SemiBold',
  },
  subtitle: {
    marginTop: 8,
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#344054',
  },
  card: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: RFValue(16),
    fontFamily: 'SemiBold',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: RFValue(12),
    fontFamily: 'Regular',
    color: '#667085',
  },
})

export default GamesScreen
