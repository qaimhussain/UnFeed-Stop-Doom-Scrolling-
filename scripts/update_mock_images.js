const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/mockData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Unsplash URLs with deterministic picsum.photos URLs with fixed seeds
let counter = 1;
content = content.replace(/https:\/\/images\.unsplash\.com\/[^\s'"`]+/g, (match) => {
  const seed = 'unfeed_seed_' + counter++;
  // Determine if vertical (story) or square (avatar/post)
  if (match.includes('w=800') || match.includes('q=80')) {
    return `https://picsum.photos/seed/${seed}/800/800`;
  }
  return `https://picsum.photos/seed/${seed}/400/400`;
});

// Update MOCK_PERSONAL_NOTES with block-based model
const updatedPersonalNotes = `export const MOCK_PERSONAL_NOTES: PersonalNote[] = [
  {
    id: 'note_1',
    title: 'Design Principles for Focused Living',
    content: '• Attention is your scarcest resource — **protect it fiercely**.\\n• If a software tool creates a reflex rather than answering a need, question it.\\n• Direct connection beats broadcast entertainment.\\n• Clean white space creates psychological calm.\\n• No infinite scrolling — everything should have an intentional end state.',
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
    content: '[x] Sony A7IV + 35mm f/1.4 prime lens\\n[x] Spare battery & 128GB SD card\\n[ ] Circular polarizing filter\\n[x] Lens cleaning cloth\\n[ ] Canvas tote for market finds\\n\\nRoute: Tomigaya alleys -> Yoyogi park periphery -> Daikanyama T-Site.',
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
    content: '• "Digital Minimalism" by Cal Newport — solitude deprivation is real.\\n• "Four Thousand Weeks" by Oliver Burkeman — embracing limitation.\\n• "The Design of Everyday Things" — affordances and visibility.\\n• "Essentialism" by Greg McKeown — the disciplined pursuit of less.',
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
    content: 'Instagram began as a creative space for friends and photographers. Over a decade, algorithmic feeds and short-form video transformed it into a dopamine slot machine.\\n\\nUnfeed keeps the original promise: talking with friends, seeing what they posted today, saving visual ideas, and writing down thoughts.',
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
    content: '• 07:00 — No phone for first 45 minutes.\\n• 07:15 — 10-minute quiet stretching & hydration.\\n• 07:30 — Filter coffee brew ritual.\\n• 07:45 — Single most important task written by hand.',
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
];`;

content = content.replace(/export const MOCK_PERSONAL_NOTES: PersonalNote\[\] = \[[\s\S]*?\];/, updatedPersonalNotes);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated mockData.ts with fixed-seed picsum.photos URLs and block-based notes!');
