import {
  User,
  ShortNote,
  Conversation,
  Message,
  UserStory,
  Collection,
  SavedItem,
  PersonalNote,
} from '../types';

export const CURRENT_USER: User = {
  id: 'current_user',
  username: 'alex.unfeed',
  fullName: 'Alex Rivers',
  avatarUrl: 'https://picsum.photos/seed/unfeed_seed_1/800/800',
  isOnline: true,
};

export const INITIAL_USER_NOTE: ShortNote = {
  id: 'note_me',
  userId: 'current_user',
  text: 'Quiet mode on. Deep work 🌿',
  createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  expiresAt: new Date(Date.now() + 3600000 * 22).toISOString(),
};

export const MOCK_CONTACTS: User[] = [
  {
    id: 'u1',
    username: 'elena.rostova',
    fullName: 'Elena Rostova',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_2/800/800',
    isOnline: true,
    isVerified: true,
  },
  {
    id: 'u2',
    username: 'marcus.chen',
    fullName: 'Marcus Chen',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_3/800/800',
    isOnline: true,
  },
  {
    id: 'u3',
    username: 'sophia_v',
    fullName: 'Sophia Vance',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_4/800/800',
    isOnline: false,
    lastSeen: '18m ago',
    isVerified: true,
  },
  {
    id: 'u4',
    username: 'liam_design',
    fullName: 'Liam Miller',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_5/800/800',
    isOnline: true,
  },
  {
    id: 'u5',
    username: 'maya.patel',
    fullName: 'Maya Patel',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_6/800/800',
    isOnline: false,
    lastSeen: '1h ago',
  },
  {
    id: 'u6',
    username: 'oliver_k',
    fullName: 'Oliver Klein',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_7/800/800',
    isOnline: true,
  },
  {
    id: 'u7',
    username: 'chloe.morin',
    fullName: 'Chloé Morin',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_8/800/800',
    isOnline: false,
    lastSeen: '3h ago',
  },
  {
    id: 'u8',
    username: 'david.kim',
    fullName: 'David Kim',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_9/800/800',
    isOnline: true,
  },
  {
    id: 'u9',
    username: 'emma_w',
    fullName: 'Emma Watson',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_10/800/800',
    isOnline: false,
    lastSeen: '5h ago',
  },
  {
    id: 'u10',
    username: 'lucas_art',
    fullName: 'Lucas Silva',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_11/800/800',
    isOnline: false,
    lastSeen: 'Yesterday',
  },
  {
    id: 'u11',
    username: 'zara_nomad',
    fullName: 'Zara Al-Mansoor',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_12/800/800',
    isOnline: true,
  },
  {
    id: 'u12',
    username: 'sam_sound',
    fullName: 'Samir Roy',
    avatarUrl: 'https://picsum.photos/seed/unfeed_seed_13/800/800',
    isOnline: false,
    lastSeen: '2d ago',
  },
];

export const MOCK_SHORT_NOTES: Record<string, ShortNote> = {
  u1: {
    id: 'sn_1',
    userId: 'u1',
    text: 'Coffee & studio sketches ☕️🎨',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 21).toISOString(),
  },
  u2: {
    id: 'sn_2',
    userId: 'u2',
    text: 'Tokyo night walk 🌧️🍜',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 19).toISOString(),
  },
  u3: {
    id: 'sn_3',
    userId: 'u3',
    text: 'Studio late night session 🎧',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 16).toISOString(),
  },
  u4: {
    id: 'sn_4',
    userId: 'u4',
    text: 'Shipping v2 today! 🚀',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 22).toISOString(),
  },
  u5: {
    id: 'sn_5',
    userId: 'u5',
    text: 'Hiking Yosemite trails 🏔️',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 18).toISOString(),
  },
  u6: {
    id: 'sn_6',
    userId: 'u6',
    text: 'Reading Atomic Habits 📖',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 23).toISOString(),
  },
  u7: {
    id: 'sn_7',
    userId: 'u7',
    text: 'Croissant quest in Marais 🥐',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 20).toISOString(),
  },
  u8: {
    id: 'sn_8',
    userId: 'u8',
    text: 'Zero inbox achieved 🎯',
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 17).toISOString(),
  },
};

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participant: MOCK_CONTACTS[0], // Elena
    unreadCount: 1,
    isMuted: false,
    updatedAt: '2m ago',
    lastMessage: {
      id: 'm1_4',
      conversationId: 'c1',
      senderId: 'u1',
      text: 'Have you seen this minimal workspace setup? Loved the lighting.',
      createdAt: '2m ago',
      isSeen: false,
      mediaType: 'shared_post',
      sharedPost: {
        id: 'sp_1',
        authorUsername: 'minimalist.desks',
        authorAvatar: 'https://picsum.photos/seed/unfeed_seed_14/800/800',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_15/800/800',
        caption: 'Nordic Oak desk paired with warm brass tones and diffused natural daylight.',
        timestamp: '4h ago',
        isSaved: false,
      },
    },
  },
  {
    id: 'c2',
    participant: MOCK_CONTACTS[1], // Marcus
    unreadCount: 0,
    isMuted: false,
    updatedAt: '24m ago',
    lastMessage: {
      id: 'm2_3',
      conversationId: 'c2',
      senderId: 'current_user',
      text: 'Sounds great! Let me know when you land.',
      createdAt: '24m ago',
      isSeen: true,
      reactions: { '👍': ['u2'] },
    },
  },
  {
    id: 'c3',
    participant: MOCK_CONTACTS[2], // Sophia
    unreadCount: 2,
    isMuted: false,
    updatedAt: '1h ago',
    lastMessage: {
      id: 'm3_2',
      conversationId: 'c3',
      senderId: 'u3',
      text: 'Sent you the audio sample from the mixing desk.',
      mediaType: 'voice',
      voiceDuration: 18,
      createdAt: '1h ago',
      isSeen: false,
    },
  },
  {
    id: 'c4',
    participant: MOCK_CONTACTS[3], // Liam
    unreadCount: 0,
    isMuted: false,
    updatedAt: '3h ago',
    lastMessage: {
      id: 'm4_2',
      conversationId: 'c4',
      senderId: 'u4',
      text: 'Check out the prototype render here:',
      mediaType: 'image',
      mediaUrl: 'https://picsum.photos/seed/unfeed_seed_16/800/800',
      createdAt: '3h ago',
      isSeen: true,
      reactions: { '🔥': ['current_user'] },
    },
  },
  {
    id: 'c5',
    participant: MOCK_CONTACTS[4], // Maya
    unreadCount: 0,
    isMuted: true,
    updatedAt: '5h ago',
    lastMessage: {
      id: 'm5_1',
      conversationId: 'c5',
      senderId: 'u5',
      text: 'The view from Glacier Point was unreal!',
      createdAt: '5h ago',
      isSeen: true,
    },
  },
  {
    id: 'c6',
    participant: MOCK_CONTACTS[5], // Oliver
    unreadCount: 0,
    isMuted: false,
    updatedAt: 'Yesterday',
    lastMessage: {
      id: 'm6_1',
      conversationId: 'c6',
      senderId: 'current_user',
      text: 'Thanks for the book recommendation, starting it tonight.',
      createdAt: 'Yesterday',
      isSeen: true,
    },
  },
  {
    id: 'c7',
    participant: MOCK_CONTACTS[6], // Chloé
    unreadCount: 0,
    isMuted: false,
    updatedAt: 'Yesterday',
    lastMessage: {
      id: 'm7_1',
      conversationId: 'c7',
      senderId: 'u7',
      text: 'Found the best bakery near Saint-Germain! 🥐',
      createdAt: 'Yesterday',
      isSeen: true,
      reactions: { '❤️': ['current_user'] },
    },
  },
  {
    id: 'c8',
    participant: MOCK_CONTACTS[7], // David
    unreadCount: 0,
    isMuted: false,
    updatedAt: '2d ago',
    lastMessage: {
      id: 'm8_1',
      conversationId: 'c8',
      senderId: 'u8',
      text: 'All tests are passing now, ready for merge.',
      createdAt: '2d ago',
      isSeen: true,
    },
  },
];

export const MOCK_MESSAGES_BY_CHAT: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1_1',
      conversationId: 'c1',
      senderId: 'u1',
      text: 'Hey Alex! Are you still working on the distraction-free client?',
      createdAt: '10:14 AM',
      isSeen: true,
    },
    {
      id: 'm1_2',
      conversationId: 'c1',
      senderId: 'current_user',
      text: 'Yes! Just finishing up the messaging flow and offline-first store.',
      createdAt: '10:18 AM',
      isSeen: true,
      reactions: { '👏': ['u1'] },
    },
    {
      id: 'm1_3',
      conversationId: 'c1',
      senderId: 'u1',
      text: 'That is awesome. I really need something without the explore rabbit hole.',
      createdAt: '10:20 AM',
      isSeen: true,
    },
    {
      id: 'm1_4',
      conversationId: 'c1',
      senderId: 'u1',
      text: 'Have you seen this minimal workspace setup? Loved the lighting.',
      createdAt: '10:22 AM',
      isSeen: false,
      mediaType: 'shared_post',
      sharedPost: {
        id: 'sp_1',
        authorUsername: 'minimalist.desks',
        authorAvatar: 'https://picsum.photos/seed/unfeed_seed_17/800/800',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_18/800/800',
        caption: 'Nordic Oak desk paired with warm brass tones and diffused natural daylight.',
        timestamp: '4h ago',
        isSaved: false,
      },
    },
  ],
  c2: [
    {
      id: 'm2_1',
      conversationId: 'c2',
      senderId: 'u2',
      text: 'Heading to Shibuya tomorrow, any cafe recs?',
      createdAt: 'Yesterday',
      isSeen: true,
    },
    {
      id: 'm2_2',
      conversationId: 'c2',
      senderId: 'current_user',
      text: 'Check out Fuglen Tokyo in Tomigaya, unbelievable filter brew.',
      createdAt: 'Yesterday',
      isSeen: true,
      reactions: { '🔥': ['u2'] },
    },
    {
      id: 'm2_3',
      conversationId: 'c2',
      senderId: 'current_user',
      text: 'Sounds great! Let me know when you land.',
      createdAt: '24m ago',
      isSeen: true,
      reactions: { '👍': ['u2'] },
    },
  ],
  c3: [
    {
      id: 'm3_1',
      conversationId: 'c3',
      senderId: 'u3',
      text: 'Hey Alex, working on the ambient soundscape.',
      createdAt: '1h ago',
      isSeen: true,
    },
    {
      id: 'm3_2',
      conversationId: 'c3',
      senderId: 'u3',
      text: 'Sent you the audio sample from the mixing desk.',
      mediaType: 'voice',
      voiceDuration: 18,
      createdAt: '1h ago',
      isSeen: false,
    },
  ],
};

export const MOCK_STORIES: UserStory[] = [
  {
    id: 's1',
    user: MOCK_CONTACTS[0], // Elena
    isSeen: false,
    lastUpdated: '1h ago',
    slides: [
      {
        id: 's1_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_19/800/800',
        timestamp: '2h ago',
        duration: 5,
        caption: 'Morning ceramic glazes fresh from the kiln ✨',
      },
      {
        id: 's1_2',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_20/800/800',
        timestamp: '1h ago',
        duration: 5,
        caption: 'Coffee break in the studio courtyard ☕️',
      },
    ],
  },
  {
    id: 's2',
    user: MOCK_CONTACTS[1], // Marcus
    isSeen: false,
    lastUpdated: '3h ago',
    slides: [
      {
        id: 's2_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_21/800/800',
        timestamp: '3h ago',
        duration: 5,
        caption: 'Neon reflections in Shinjuku alleys 🌧️',
      },
    ],
  },
  {
    id: 's3',
    user: MOCK_CONTACTS[2], // Sophia
    isSeen: false,
    lastUpdated: '4h ago',
    slides: [
      {
        id: 's3_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_22/800/800',
        timestamp: '4h ago',
        duration: 5,
        caption: 'Analog synthesizer experiments today 🎹',
      },
      {
        id: 's3_2',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_23/800/800',
        timestamp: '2h ago',
        duration: 5,
        caption: 'Reel-to-reel tape saturation warmth',
      },
    ],
  },
  {
    id: 's4',
    user: MOCK_CONTACTS[3], // Liam
    isSeen: false,
    lastUpdated: '5h ago',
    slides: [
      {
        id: 's4_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_24/800/800',
        timestamp: '5h ago',
        duration: 5,
        caption: 'Grid alignment and typography exploration',
      },
    ],
  },
  {
    id: 's5',
    user: MOCK_CONTACTS[4], // Maya
    isSeen: false,
    lastUpdated: '6h ago',
    slides: [
      {
        id: 's5_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_25/800/800',
        timestamp: '6h ago',
        duration: 5,
        caption: 'Sunrise over Cathedral Rocks 🌄',
      },
    ],
  },
  {
    id: 's6',
    user: MOCK_CONTACTS[5], // Oliver
    isSeen: true,
    lastUpdated: '8h ago',
    slides: [
      {
        id: 's6_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_26/800/800',
        timestamp: '8h ago',
        duration: 5,
        caption: 'Sunday reading quiet hour 📚',
      },
    ],
  },
  {
    id: 's7',
    user: MOCK_CONTACTS[6], // Chloe
    isSeen: true,
    lastUpdated: '10h ago',
    slides: [
      {
        id: 's7_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_27/800/800',
        timestamp: '10h ago',
        duration: 5,
        caption: 'Flaky sourdough croissants in Paris 🥐',
      },
    ],
  },
  {
    id: 's8',
    user: MOCK_CONTACTS[7], // David
    isSeen: true,
    lastUpdated: '12h ago',
    slides: [
      {
        id: 's8_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_28/800/800',
        timestamp: '12h ago',
        duration: 5,
        caption: 'Clean terminal theme setup 💻',
      },
    ],
  },
  {
    id: 's9',
    user: MOCK_CONTACTS[8], // Emma
    isSeen: true,
    lastUpdated: '14h ago',
    slides: [
      {
        id: 's9_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_29/800/800',
        timestamp: '14h ago',
        duration: 5,
        caption: 'Matcha whisking ceremony 🍵',
      },
    ],
  },
  {
    id: 's10',
    user: MOCK_CONTACTS[9], // Lucas
    isSeen: true,
    lastUpdated: '16h ago',
    slides: [
      {
        id: 's10_1',
        mediaUrl: 'https://picsum.photos/seed/unfeed_seed_30/800/800',
        timestamp: '16h ago',
        duration: 5,
        caption: 'Oil on canvas texture detail 🎨',
      },
    ],
  },
];

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'col_all',
    name: 'All Posts',
    coverImageUrl: 'https://picsum.photos/seed/unfeed_seed_31/800/800',
    itemCount: 20,
    createdAt: '2026-01-15',
  },
  {
    id: 'col_1',
    name: 'Design & Architecture',
    coverImageUrl: 'https://picsum.photos/seed/unfeed_seed_32/800/800',
    itemCount: 7,
    createdAt: '2026-01-20',
  },
  {
    id: 'col_2',
    name: 'Travel Destinations',
    coverImageUrl: 'https://picsum.photos/seed/unfeed_seed_33/800/800',
    itemCount: 7,
    createdAt: '2026-02-01',
  },
  {
    id: 'col_3',
    name: 'Culinary & Coffee',
    coverImageUrl: 'https://picsum.photos/seed/unfeed_seed_34/800/800',
    itemCount: 6,
    createdAt: '2026-02-14',
  },
];

export const MOCK_SAVED_ITEMS: SavedItem[] = [
  // Design & Architecture (col_1)
  {
    id: 'save_1',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_35/800/800',
    caption: 'Brutalist concrete architecture blending into Kyoto forest.',
    authorUsername: 'arch.digest',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_36/800/800',
    collectionIds: ['col_all', 'col_1'],
    createdAt: '2d ago',
  },
  {
    id: 'save_2',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_37/800/800',
    caption: 'Minimalist living room with natural linen textures and oak.',
    authorUsername: 'nordic.interiors',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_38/800/800',
    collectionIds: ['col_all', 'col_1'],
    createdAt: '3d ago',
  },
  {
    id: 'save_3',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_39/800/800',
    caption: 'Geometric shadow play on white stucco walls.',
    authorUsername: 'studio.form',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_40/800/800',
    collectionIds: ['col_all', 'col_1'],
    createdAt: '4d ago',
  },
  {
    id: 'save_4',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_41/800/800',
    caption: 'Curved wooden staircase and recessed lighting study.',
    authorUsername: 'design.space',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_42/800/800',
    collectionIds: ['col_all', 'col_1'],
    createdAt: '5d ago',
  },
  {
    id: 'save_5',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_43/800/800',
    caption: 'Contemporary villa overlooking the Mediterranean cliffs.',
    authorUsername: 'dwell.daily',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_44/800/800',
    collectionIds: ['col_all', 'col_1'],
    createdAt: '6d ago',
  },
  {
    id: 'save_6',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_45/800/800',
    caption: 'Clean line ceramics with unglazed matte finish.',
    authorUsername: 'clay.craft',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_46/800/800',
    collectionIds: ['col_all', 'col_1'],
    createdAt: '1w ago',
  },
  {
    id: 'save_7',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_47/800/800',
    caption: 'Ergonomic workspace design for uninterrupted focus.',
    authorUsername: 'focus.labs',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_48/800/800',
    collectionIds: ['col_all', 'col_1'],
    createdAt: '1w ago',
  },

  // Travel Destinations (col_2)
  {
    id: 'save_8',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_49/800/800',
    caption: 'Quiet stone paths behind the bamboo grove in Arashiyama, Kyoto.',
    authorUsername: 'japan.wanders',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_50/800/800',
    collectionIds: ['col_all', 'col_2'],
    createdAt: '2d ago',
  },
  {
    id: 'save_9',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_51/800/800',
    caption: 'Reflections across Lake McDonald in early autumn morning light.',
    authorUsername: 'wilderness.co',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_52/800/800',
    collectionIds: ['col_all', 'col_2'],
    createdAt: '3d ago',
  },
  {
    id: 'save_10',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_53/800/800',
    caption: 'Solo drive through the red rock canyons of Utah.',
    authorUsername: 'nomad.notes',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_54/800/800',
    collectionIds: ['col_all', 'col_2'],
    createdAt: '4d ago',
  },
  {
    id: 'save_11',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_55/800/800',
    caption: 'Wooden boat cruising along the emerald waters of Lake Como.',
    authorUsername: 'italia.voyage',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_56/800/800',
    collectionIds: ['col_all', 'col_2'],
    createdAt: '5d ago',
  },
  {
    id: 'save_12',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_57/800/800',
    caption: 'Sunset on the quiet southern coast of Portugal.',
    authorUsername: 'algarve.sun',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_58/800/800',
    collectionIds: ['col_all', 'col_2'],
    createdAt: '6d ago',
  },
  {
    id: 'save_13',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_59/800/800',
    caption: 'Cinque Terre colorful cliffside houses at dusk.',
    authorUsername: 'coastal.diary',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_60/800/800',
    collectionIds: ['col_all', 'col_2'],
    createdAt: '1w ago',
  },
  {
    id: 'save_14',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_61/800/800',
    caption: 'Santorini whitewashed alleys in midday Mediterranean sun.',
    authorUsername: 'aegean.blue',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_62/800/800',
    collectionIds: ['col_all', 'col_2'],
    createdAt: '1w ago',
  },

  // Culinary & Coffee (col_3)
  {
    id: 'save_15',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_63/800/800',
    caption: 'Slow hand-drip Ethiopian single origin coffee.',
    authorUsername: 'roast.craft',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_64/800/800',
    collectionIds: ['col_all', 'col_3'],
    createdAt: '2d ago',
  },
  {
    id: 'save_16',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_65/800/800',
    caption: 'Wood-fired handmade gnocchi with sage browned butter.',
    authorUsername: 'cucina.povera',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_66/800/800',
    collectionIds: ['col_all', 'col_3'],
    createdAt: '3d ago',
  },
  {
    id: 'save_17',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_67/800/800',
    caption: 'Neapolitan style sourdough pizza with fresh mozzarella and basil.',
    authorUsername: 'dough.alchemy',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_68/800/800',
    collectionIds: ['col_all', 'col_3'],
    createdAt: '4d ago',
  },
  {
    id: 'save_18',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_69/800/800',
    caption: 'Seasonal heirloom tomato salad with whipped feta.',
    authorUsername: 'fresh.table',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_70/800/800',
    collectionIds: ['col_all', 'col_3'],
    createdAt: '5d ago',
  },
  {
    id: 'save_19',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_71/800/800',
    caption: 'Cortado with silky textured oat microfoam in ribbed glass.',
    authorUsername: 'specialty.barista',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_72/800/800',
    collectionIds: ['col_all', 'col_3'],
    createdAt: '6d ago',
  },
  {
    id: 'save_20',
    mediaUrl: 'https://picsum.photos/seed/unfeed_seed_73/800/800',
    caption: 'Japanese soufflé pancakes with hokkaido cream and seasonal berries.',
    authorUsername: 'sweet.treats',
    authorAvatar: 'https://picsum.photos/seed/unfeed_seed_74/800/800',
    collectionIds: ['col_all', 'col_3'],
    createdAt: '1w ago',
  },
];

export const MOCK_PERSONAL_NOTES: PersonalNote[] = [
  {
    id: 'note_1',
    title: 'Design Principles for Focused Living',
    content: '• Attention is your scarcest resource — **protect it fiercely**.\n• If a software tool creates a reflex rather than answering a need, question it.\n• Direct connection beats broadcast entertainment.\n• Clean white space creates psychological calm.\n• No infinite scrolling — everything should have an intentional end state.',
    blocks: [
      { id: 'b1_1', type: 'paragraph', text: 'Core personal manifesto for **digital wellbeing** and intentional work.' },
      { id: 'b1_2', type: 'bullet', text: 'Attention is your scarcest resource — **protect it fiercely**.' },
      { id: 'b1_3', type: 'bullet', text: 'If a software tool creates a reflex rather than answering a need, question it.' },
      { id: 'b1_4', type: 'bullet', text: 'Direct connection beats broadcast entertainment.' },
      { id: 'b1_5', type: 'bullet', text: 'Clean white space creates psychological calm.' },
      { id: 'b1_6', type: 'bullet', text: 'No infinite scrolling — **everything should have an intentional end state**.' }
    ],
    isPinned: true,
    createdAt: '2026-02-10',
    updatedAt: '2h ago',
  },
  {
    id: 'note_2',
    title: 'Weekend Photography Walk Checklist',
    content: '[x] Sony A7IV + 35mm f/1.4 prime lens\n[x] Spare battery & 128GB SD card\n[ ] Circular polarizing filter\n[x] Lens cleaning cloth\n[ ] Canvas tote for market finds\n\nRoute: Tomigaya alleys -> Yoyogi park periphery -> Daikanyama T-Site.',
    blocks: [
      { id: 'b2_1', type: 'paragraph', text: 'Gear to pack for Saturday morning light in **Shibuya & Daikanyama**.' },
      { id: 'b2_2', type: 'checklist', text: 'Sony A7IV + 35mm f/1.4 prime lens', checked: true },
      { id: 'b2_3', type: 'checklist', text: 'Spare battery & **128GB SD card**', checked: true },
      { id: 'b2_4', type: 'checklist', text: 'Circular polarizing filter', checked: false },
      { id: 'b2_5', type: 'checklist', text: 'Lens cleaning microfiber cloth', checked: true },
      { id: 'b2_6', type: 'checklist', text: 'Canvas tote for market finds', checked: false },
      { id: 'b2_7', type: 'paragraph', text: 'Route: **Tomigaya alleys** -> Yoyogi park periphery -> Daikanyama T-Site.' }
    ],
    isPinned: true,
    createdAt: '2026-02-18',
    updatedAt: 'Yesterday',
  },
  {
    id: 'note_3',
    title: 'Reading List & Epiphanies',
    content: '• "Digital Minimalism" by Cal Newport — solitude deprivation is real.\n• "Four Thousand Weeks" by Oliver Burkeman — embracing limitation.\n• "The Design of Everyday Things" — affordances and visibility.\n• "Essentialism" by Greg McKeown — the disciplined pursuit of less.',
    blocks: [
      { id: 'b3_1', type: 'bullet', text: '**Digital Minimalism** by Cal Newport — solitude deprivation is real.' },
      { id: 'b3_2', type: 'bullet', text: '**Four Thousand Weeks** by Oliver Burkeman — embracing our finite time.' },
      { id: 'b3_3', type: 'bullet', text: '**The Design of Everyday Things** — affordances and visibility.' },
      { id: 'b3_4', type: 'bullet', text: '**Essentialism** by Greg McKeown — the disciplined pursuit of less.' }
    ],
    isPinned: false,
    createdAt: '2026-01-28',
    updatedAt: '3d ago',
  },
  {
    id: 'note_4',
    title: 'Interface Philosophy: Why Unfeed',
    content: 'Instagram began as a creative space for friends and photographers. Over a decade, algorithmic feeds and short-form video transformed it into a dopamine slot machine.\n\nUnfeed keeps the original promise: talking with friends, seeing what they posted today, saving visual ideas, and writing down thoughts.',
    blocks: [
      { id: 'b4_1', type: 'paragraph', text: 'Instagram began as a creative space for friends and photographers. Over a decade, algorithmic feeds and short-form video transformed it into a **dopamine slot machine**.' },
      { id: 'b4_2', type: 'paragraph', text: 'Unfeed keeps the original promise: **talking with friends**, seeing what they posted today, saving visual ideas, and writing down thoughts.' }
    ],
    isPinned: false,
    createdAt: '2026-01-12',
    updatedAt: '5d ago',
  },
  {
    id: 'note_5',
    title: 'Morning Ritual & Mindfulness',
    content: '• 07:00 — No phone for first 45 minutes.\n• 07:15 — 10-minute quiet stretching & hydration.\n• 07:30 — Filter coffee brew ritual.\n• 07:45 — Single most important task written by hand.',
    blocks: [
      { id: 'b5_1', type: 'checklist', text: '07:00 — **No phone for first 45 minutes**', checked: true },
      { id: 'b5_2', type: 'checklist', text: '07:15 — 10-minute quiet stretching & hydration', checked: true },
      { id: 'b5_3', type: 'checklist', text: '07:30 — Filter coffee brew ritual', checked: false },
      { id: 'b5_4', type: 'checklist', text: '07:45 — Single most important task **written by hand**', checked: false }
    ],
    isPinned: false,
    createdAt: '2026-01-05',
    updatedAt: '1w ago',
  },
];
