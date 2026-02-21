export type RewardMode = 'venue' | 'punishment' | 'combo'

export type VegasVenue = {
  id: string
  name: string
  area: string
  vibe: string
  mapsUrl: string
}

export const VEGAS_VENUES: VegasVenue[] = [
  {
    id: 'cosmo-chandelier',
    name: 'The Chandelier @ The Cosmopolitan',
    area: 'The Strip',
    vibe: 'cocktails',
    mapsUrl: 'https://maps.google.com/?q=The+Chandelier+Las+Vegas',
  },
  {
    id: 'secret-pizza',
    name: 'Secret Pizza',
    area: 'The Strip',
    vibe: 'late-night bite',
    mapsUrl: 'https://maps.google.com/?q=Secret+Pizza+Las+Vegas',
  },
  {
    id: 'fremont-east',
    name: 'Fremont East District',
    area: 'Downtown',
    vibe: 'bar crawl',
    mapsUrl: 'https://maps.google.com/?q=Fremont+East+Las+Vegas',
  },
  {
    id: 'lotus-siam',
    name: 'Lotus of Siam',
    area: 'Off-Strip',
    vibe: 'foodie',
    mapsUrl: 'https://maps.google.com/?q=Lotus+of+Siam+Las+Vegas',
  },
  {
    id: 'peppermill',
    name: 'Peppermill Restaurant',
    area: 'The Strip',
    vibe: 'retro diner',
    mapsUrl: 'https://maps.google.com/?q=Peppermill+Las+Vegas',
  },
  {
    id: 'bellagio-fountains',
    name: 'Bellagio Fountains',
    area: 'The Strip',
    vibe: 'classic vegas',
    mapsUrl: 'https://maps.google.com/?q=Bellagio+Fountains',
  },
  {
    id: 'area15',
    name: 'AREA15',
    area: 'Off-Strip',
    vibe: 'immersive',
    mapsUrl: 'https://maps.google.com/?q=AREA15+Las+Vegas',
  },
  {
    id: 'red-rock',
    name: 'Red Rock Canyon',
    area: 'West Vegas',
    vibe: 'nature reset',
    mapsUrl: 'https://maps.google.com/?q=Red+Rock+Canyon+Las+Vegas',
  },
  {
    id: 'herbs-rye',
    name: "Herbs & Rye",
    area: 'Off-Strip',
    vibe: 'steakhouse',
    mapsUrl: 'https://maps.google.com/?q=Herbs+and+Rye+Las+Vegas',
  },
  {
    id: 'esthers-kitchen',
    name: "Esther's Kitchen",
    area: 'Arts District',
    vibe: 'italian',
    mapsUrl: 'https://maps.google.com/?q=Esthers+Kitchen+Las+Vegas',
  },
  {
    id: 'best-friend',
    name: 'Best Friend by Roy Choi',
    area: 'The Strip',
    vibe: 'korean fusion',
    mapsUrl: 'https://maps.google.com/?q=Best+Friend+Las+Vegas',
  },
  {
    id: 'eataly-park-mgm',
    name: 'Eataly @ Park MGM',
    area: 'The Strip',
    vibe: 'food hall',
    mapsUrl: 'https://maps.google.com/?q=Eataly+Park+MGM+Las+Vegas',
  },
  {
    id: 'eggslut-cosmo',
    name: 'Eggslut @ The Cosmopolitan',
    area: 'The Strip',
    vibe: 'brunch',
    mapsUrl: 'https://maps.google.com/?q=Eggslut+Las+Vegas',
  },
  {
    id: 'tacos-el-gordo',
    name: 'Tacos El Gordo',
    area: 'The Strip',
    vibe: 'street tacos',
    mapsUrl: 'https://maps.google.com/?q=Tacos+El+Gordo+Las+Vegas',
  },
  {
    id: 'mon-ami-gabi',
    name: 'Mon Ami Gabi',
    area: 'The Strip',
    vibe: 'patio dining',
    mapsUrl: 'https://maps.google.com/?q=Mon+Ami+Gabi+Las+Vegas',
  },
  {
    id: 'din-tai-fung',
    name: 'Din Tai Fung',
    area: 'The Strip',
    vibe: 'dumplings',
    mapsUrl: 'https://maps.google.com/?q=Din+Tai+Fung+Las+Vegas',
  },
  {
    id: 'carson-kitchen',
    name: 'Carson Kitchen',
    area: 'Downtown',
    vibe: 'new american',
    mapsUrl: 'https://maps.google.com/?q=Carson+Kitchen+Las+Vegas',
  },
  {
    id: 'fuku-burger',
    name: 'FukuBurger',
    area: 'Chinatown',
    vibe: 'asian burgers',
    mapsUrl: 'https://maps.google.com/?q=FukuBurger+Las+Vegas',
  },
  {
    id: 'icebar-linq',
    name: 'Minus5 Icebar @ LINQ',
    area: 'The Strip',
    vibe: 'novelty bar',
    mapsUrl: 'https://maps.google.com/?q=Minus5+Icebar+LINQ+Las+Vegas',
  },
  {
    id: 'golden-tiki',
    name: 'The Golden Tiki',
    area: 'Chinatown',
    vibe: 'tiki bar',
    mapsUrl: 'https://maps.google.com/?q=The+Golden+Tiki+Las+Vegas',
  },
]

export const PUNISHMENT_CARDS: string[] = [
  'Buy everyone boba after this round.',
  'Loser has to sing one verse on camera.',
  'No phone for the next 10 minutes.',
  'Do 15 squats right now.',
  'Winner picks your next IG story caption.',
  "You have to carry everyone's water bottles.",
]
