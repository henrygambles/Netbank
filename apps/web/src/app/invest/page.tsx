'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MapPin, ArrowRight, Users, TrendingUp, Sparkles } from 'lucide-react'

const CATEGORIES = ['All', 'Local business', 'Education', 'Wellbeing', 'Community'] as const
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
  gradient: string
  initials: string
}

const PEOPLE: Person[] = [
  {
    id: 'p1',
    name: 'Maria Santos',
    age: 34,
    location: 'Hackney, East London',
    category: 'Local business',
    title: "Maria's Bakes",
    story:
      'After losing her job as a retail manager, Maria taught herself to bake through YouTube tutorials late at night while her two kids slept. Her neighbours already queue down the street for her cardamom buns — she just needs a commercial oven to go legit.',
    goal: 800,
    raised: 536,
    backers: 47,
    tag: '🥐 Food & Drink',
    gradient: 'from-orange-400 to-rose-500',
    initials: 'MS',
  },
  {
    id: 'p2',
    name: 'James Okafor',
    age: 58,
    location: 'Moss Side, Manchester',
    category: 'Education',
    title: 'Free maths tutoring for all',
    story:
      'James taught secondary school maths for 30 years and watched bright kids fall behind simply because their families couldn\'t afford private tuition. He\'s retired now — and wants to give it all back, completely free, to whoever needs it.',
    goal: 500,
    raised: 215,
    backers: 28,
    tag: '📚 Education',
    gradient: 'from-blue-400 to-violet-500',
    initials: 'JO',
  },
  {
    id: 'p3',
    name: 'Priya Sharma',
    age: 26,
    location: 'Ladywood, Birmingham',
    category: 'Education',
    title: 'Three months from being a nurse',
    story:
      'Priya is in her final year of nursing training. Unpaid hospital placements mean four bus journeys a day — £18 a week she simply doesn\'t have. She\'s three months from qualifying. She\'s not asking to be carried, just bridged.',
    goal: 1200,
    raised: 336,
    backers: 19,
    tag: '💙 Healthcare',
    gradient: 'from-teal-400 to-cyan-500',
    initials: 'PS',
  },
  {
    id: 'p4',
    name: 'Bob McAllister',
    age: 52,
    location: 'Ayrshire, Scotland',
    category: 'Community',
    title: 'Going organic before it\'s too late',
    story:
      'Bob has farmed the same land his grandfather ploughed. Three years ago he decided to go fully organic — better for the soil, better for the community, better for his conscience. The certification costs have stalled him ever since. His neighbours rallied. Can you?',
    goal: 2500,
    raised: 375,
    backers: 11,
    tag: '🌿 Farming',
    gradient: 'from-green-400 to-emerald-500',
    initials: 'BM',
  },
  {
    id: 'p5',
    name: 'Amara Diallo',
    age: 19,
    location: 'Chapeltown, Leeds',
    category: 'Education',
    title: 'First in her family at university',
    story:
      'Amara is the first person in her family to go to university, studying computer science. For two years she\'s been borrowing laptops from the library, racing against closing time. She\'s £66 away from having her own. Eighty-nine percent there.',
    goal: 600,
    raised: 534,
    backers: 74,
    tag: '💻 Technology',
    gradient: 'from-violet-400 to-pink-500',
    initials: 'AD',
  },
  {
    id: 'p6',
    name: 'Denise & Paul Carroll',
    age: 61,
    location: 'Toxteth, Liverpool',
    category: 'Community',
    title: 'A warm space for the estate',
    story:
      'The old community hall on their estate has been empty for four years. Denise and Paul want to open it two evenings a week — warm, free, no agenda — just somewhere to go. The council sold them the lease for £1. They just need the heating fixed.',
    goal: 1800,
    raised: 1260,
    backers: 93,
    tag: '🏠 Community',
    gradient: 'from-amber-400 to-orange-500',
    initials: 'DC',
  },
]

const STATS = [
  { value: '£127,450', label: 'invested so far', icon: TrendingUp },
  { value: '843', label: 'people supported', icon: Users },
  { value: '12', label: 'communities reached', icon: MapPin },
  { value: '94%', label: 'projects completed', icon: Sparkles },
]

function ProgressBar({ pct, gradient }: { pct: number; gradient: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

function PersonCard({ person }: { person: Person }) {
  const pct = Math.round((person.raised / person.goal) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300"
    >
      {/* Colour strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${person.gradient}`} />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${person.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {person.initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
              {person.name}, {person.age}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              {person.location}
            </div>
          </div>
          <span className="ml-auto text-xs bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full whitespace-nowrap">
            {person.tag}
          </span>
        </div>

        {/* Title + story */}
        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2 leading-snug">
          {person.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1 mb-5">
          {person.story}
        </p>

        {/* Progress */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-900 dark:text-white">
              £{person.raised.toLocaleString()} raised
            </span>
            <span className="text-gray-400">
              of £{person.goal.toLocaleString()} · {pct}%
            </span>
          </div>
          <ProgressBar pct={pct} gradient={person.gradient} />
          <div className="text-xs text-gray-400">{person.backers} backers</div>
        </div>

        {/* CTA */}
        <button className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${person.gradient} flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
          <Heart className="w-4 h-4" />
          Support {person.name.split(' ')[0]}
        </button>
      </div>
    </motion.div>
  )
}

export default function InvestPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All')

  const filtered = activeCategory === 'All'
    ? PEOPLE
    : PEOPLE.filter(p => p.category === activeCategory)

  const totalRaised = PEOPLE.reduce((s, p) => s + p.raised, 0)
  const totalGoal = PEOPLE.reduce((s, p) => s + p.goal, 0)

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-coral-500/20 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 py-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 rounded-full px-4 py-1.5 text-xs font-medium mb-6 border border-white/10">
              <Heart className="w-3 h-3 text-coral-400" />
              Community investing · People over portfolios
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-none tracking-tight mb-4">
              Love thy<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-400 to-rose-300">neighbour.</span>
            </h1>
            <p className="text-white/60 text-lg max-w-xl leading-relaxed mb-10">
              Every person below is real. Every story is true. Instead of your money sitting in a fund managed by someone in a glass tower, it goes directly to someone in your community who needs it — and you earn it back with interest.
            </p>

            {/* Overall progress */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex justify-between text-sm text-white/50 mb-2">
                <span>Community progress this month</span>
                <span className="text-white/80 font-semibold">
                  £{totalRaised.toLocaleString()} of £{totalGoal.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-coral-500 to-rose-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((totalRaised / totalGoal) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <div className="text-xs text-white/40 mt-1.5">
                {Math.round((totalRaised / totalGoal) * 100)}% funded · {PEOPLE.reduce((s, p) => s + p.backers, 0)} backers
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-gray-100 dark:border-white/5 bg-white dark:bg-navy-950">
        <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-coral-500" />
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-lg leading-none">{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Category filter */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-coral-500 text-white shadow-sm'
                  : 'bg-white dark:bg-navy-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-coral-300 dark:hover:border-coral-500/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map((person, i) => (
              <motion.div
                key={person.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.06 }}
              >
                <PersonCard person={person} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 rounded-2xl bg-gradient-to-br from-coral-50 to-rose-50 dark:from-coral-500/10 dark:to-rose-500/5 border border-coral-100 dark:border-coral-500/20 p-8 text-center"
        >
          <Heart className="w-8 h-8 text-coral-500 mx-auto mb-3" />
          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">Know someone who could use support?</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-5">
            Anyone can nominate a neighbour, local business or community project. We review every application within 48 hours.
          </p>
          <button className="inline-flex items-center gap-2 btn-coral px-6 py-3 text-sm font-semibold">
            Nominate someone <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
