import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../lib/useColors'

const { width } = Dimensions.get('window')

const CATEGORIES = ['All', 'Business', 'Education', 'Community', 'Wellbeing'] as const
type Category = typeof CATEGORIES[number]

interface Person {
  id: string
  name: string
  age: number
  location: string
  category: Category
  title: string
  story: string
  goal: number
  raised: number
  backers: number
  tag: string
  colors: [string, string]
  initials: string
}

const PEOPLE: Person[] = [
  {
    id: 'p1',
    name: 'Maria Santos',
    age: 34,
    location: 'Hackney, East London',
    category: 'Business',
    title: "Maria's Bakes",
    story: 'After losing her job as a retail manager, Maria taught herself to bake through YouTube tutorials. Her neighbours already queue for her cardamom buns — she just needs a commercial oven to go legit.',
    goal: 800,
    raised: 536,
    backers: 47,
    tag: '🥐 Food & Drink',
    colors: ['#fb923c', '#f43f5e'],
    initials: 'MS',
  },
  {
    id: 'p2',
    name: 'James Okafor',
    age: 58,
    location: 'Moss Side, Manchester',
    category: 'Education',
    title: 'Free maths tutoring for all',
    story: 'James taught secondary school maths for 30 years and watched bright kids fall behind because their families couldn\'t afford tutoring. He\'s retired now — and wants to give it back, free of charge.',
    goal: 500,
    raised: 215,
    backers: 28,
    tag: '📚 Education',
    colors: ['#60a5fa', '#7c3aed'],
    initials: 'JO',
  },
  {
    id: 'p3',
    name: 'Priya Sharma',
    age: 26,
    location: 'Ladywood, Birmingham',
    category: 'Education',
    title: 'Three months from being a nurse',
    story: 'Priya is in her final year of nursing training. Unpaid hospital placements mean four bus journeys a day — £18 a week she simply doesn\'t have. She\'s three months from qualifying.',
    goal: 1200,
    raised: 336,
    backers: 19,
    tag: '💙 Healthcare',
    colors: ['#2dd4bf', '#06b6d4'],
    initials: 'PS',
  },
  {
    id: 'p4',
    name: 'Bob McAllister',
    age: 52,
    location: 'Ayrshire, Scotland',
    category: 'Community',
    title: 'Going organic before it\'s too late',
    story: 'Bob has farmed the same land his grandfather ploughed. Three years ago he decided to go fully organic. The certification costs have stalled him ever since. His neighbours rallied. Can you?',
    goal: 2500,
    raised: 375,
    backers: 11,
    tag: '🌿 Farming',
    colors: ['#4ade80', '#10b981'],
    initials: 'BM',
  },
  {
    id: 'p5',
    name: 'Amara Diallo',
    age: 19,
    location: 'Chapeltown, Leeds',
    category: 'Education',
    title: 'First in her family at university',
    story: 'Amara is the first in her family to go to university, studying computer science. For two years she\'s borrowed laptops from the library. She\'s £66 away from having her own.',
    goal: 600,
    raised: 534,
    backers: 74,
    tag: '💻 Technology',
    colors: ['#a78bfa', '#ec4899'],
    initials: 'AD',
  },
  {
    id: 'p6',
    name: 'Denise & Paul Carroll',
    age: 61,
    location: 'Toxteth, Liverpool',
    category: 'Community',
    title: 'A warm space for the estate',
    story: 'The old community hall has been empty for four years. Denise and Paul want to open it two evenings a week — warm, free, no agenda. The council sold them the lease for £1. They just need the heating fixed.',
    goal: 1800,
    raised: 1260,
    backers: 93,
    tag: '🏠 Community',
    colors: ['#fbbf24', '#f97316'],
    initials: 'DC',
  },
]

export function InvestScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [activeCategory, setActiveCategory] = useState<Category>('All')

  const filtered = activeCategory === 'All'
    ? PEOPLE
    : PEOPLE.filter(p => p.category === activeCategory)

  const totalRaised = PEOPLE.reduce((s, p) => s + p.raised, 0)
  const totalGoal = PEOPLE.reduce((s, p) => s + p.goal, 0)
  const overallPct = Math.round((totalRaised / totalGoal) * 100)

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>♥ Community investing</Text>
        </View>
        <Text style={styles.headline}>Love thy{'\n'}<Text style={styles.headlineCoral}>neighbour.</Text></Text>
        <Text style={styles.subtext}>
          Your money goes directly to someone in your community who needs it — and you earn it back with interest.
        </Text>

        {/* Overall progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Community progress this month</Text>
            <Text style={styles.progressAmount}>
              £{totalRaised.toLocaleString()} of £{totalGoal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${overallPct}%` as any }]} />
          </View>
          <Text style={styles.progressSub}>
            {overallPct}% funded · {PEOPLE.reduce((s, p) => s + p.backers, 0)} backers
          </Text>
        </View>
      </LinearGradient>

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {[
          { value: '£127k', label: 'invested' },
          { value: '843', label: 'people helped' },
          { value: '12', label: 'communities' },
          { value: '94%', label: 'completed' },
        ].map(s => (
          <View key={s.label} style={styles.stat}>
            <Text style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[
              styles.categoryBtn,
              { borderColor: c.border, backgroundColor: c.surface },
              activeCategory === cat && styles.categoryBtnActive,
            ]}
          >
            <Text style={[
              styles.categoryText,
              { color: c.textSub },
              activeCategory === cat && styles.categoryTextActive,
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Person cards */}
      <View style={[styles.cards, { paddingBottom: insets.bottom + 24 }]}>
        {filtered.map((person, i) => {
          const pct = Math.round((person.raised / person.goal) * 100)
          return (
            <Animated.View
              key={person.id}
              entering={FadeInDown.delay(i * 60).springify()}
              style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              {/* Colour top stripe */}
              <LinearGradient colors={person.colors} style={styles.cardStripe} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

              <View style={styles.cardBody}>
                {/* Person header */}
                <View style={styles.cardHeader}>
                  <LinearGradient colors={person.colors} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={styles.avatarText}>{person.initials}</Text>
                  </LinearGradient>
                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, { color: c.text }]}>{person.name}, {person.age}</Text>
                    <Text style={[styles.personLocation, { color: c.textTertiary }]}>📍 {person.location}</Text>
                  </View>
                  <View style={[styles.tagBadge, { backgroundColor: c.bg }]}>
                    <Text style={[styles.tagText, { color: c.textSub }]}>{person.tag}</Text>
                  </View>
                </View>

                {/* Title + story */}
                <Text style={[styles.cardTitle, { color: c.text }]}>{person.title}</Text>
                <Text style={[styles.cardStory, { color: c.textSub }]} numberOfLines={4}>{person.story}</Text>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressRowHeader}>
                    <Text style={[styles.raisedText, { color: c.text }]}>£{person.raised.toLocaleString()} raised</Text>
                    <Text style={[styles.goalText, { color: c.textTertiary }]}>of £{person.goal.toLocaleString()} · {pct}%</Text>
                  </View>
                  <View style={[styles.cardProgressTrack, { backgroundColor: c.bg }]}>
                    <LinearGradient
                      colors={person.colors}
                      style={[styles.cardProgressFill, { width: `${pct}%` as any }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <Text style={[styles.backersText, { color: c.textTertiary }]}>{person.backers} backers</Text>
                </View>

                {/* CTA */}
                <LinearGradient
                  colors={person.colors}
                  style={styles.supportBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <TouchableOpacity style={styles.supportBtnInner} activeOpacity={0.85}>
                    <Text style={styles.supportBtnText}>♥  Support {person.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </Animated.View>
          )
        })}

        {/* Nominate CTA */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.nominateCard, { backgroundColor: `${c.surface}`, borderColor: '#ff346530' }]}>
          <Text style={styles.nominateEmoji}>💌</Text>
          <Text style={[styles.nominateTitle, { color: c.text }]}>Know someone who could use support?</Text>
          <Text style={[styles.nominateSub, { color: c.textSub }]}>
            Anyone can nominate a neighbour, local business or community project. We review every application within 48 hours.
          </Text>
          <TouchableOpacity style={styles.nominateBtn} activeOpacity={0.8}>
            <Text style={styles.nominateBtnText}>Nominate someone →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 16,
  },
  badgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  headline: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1, lineHeight: 44, marginBottom: 10 },
  headlineCoral: { color: '#ff7088' },
  subtext: { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  progressAmount: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#ff3465' },
  progressSub: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 6 },
  statsRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 2 },
  categoriesScroll: { flexGrow: 0 },
  categories: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  categoryBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1,
  },
  categoryBtnActive: { backgroundColor: '#ff3465', borderColor: '#ff3465' },
  categoryText: { fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  cards: { paddingHorizontal: 16, gap: 14 },
  card: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
  },
  cardStripe: { height: 4 },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  personInfo: { flex: 1 },
  personName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  personLocation: { fontSize: 11, marginTop: 2 },
  tagBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 10, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 6 },
  cardStory: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  progressSection: { marginBottom: 14 },
  progressRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  raisedText: { fontSize: 14, fontWeight: '700' },
  goalText: { fontSize: 12 },
  cardProgressTrack: { height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  cardProgressFill: { height: 5, borderRadius: 3 },
  backersText: { fontSize: 11 },
  supportBtn: { borderRadius: 14, overflow: 'hidden' },
  supportBtnInner: { paddingVertical: 13, alignItems: 'center' },
  supportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  nominateCard: {
    borderRadius: 20, borderWidth: 1, padding: 24,
    alignItems: 'center', marginTop: 4,
  },
  nominateEmoji: { fontSize: 32, marginBottom: 10 },
  nominateTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  nominateSub: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  nominateBtn: {
    backgroundColor: '#ff3465', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  nominateBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
