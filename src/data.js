export const createTypes = [
  {
    title: "Documentaries",
    code: "DOC",
    description: "15-30 minute stories about people building from zero."
  },
  {
    title: "Event Films",
    code: "EVT",
    description: "Aftermovies, reels, and highlight films for launches, nights, festivals, and community events."
  },
  {
    title: "Creator Stories",
    code: "CR",
    description: "Short films and features for creators, artists, performers, and makers."
  },
  {
    title: "Founder Stories",
    code: "FS",
    description: "Behind-the-scenes stories of startups, small businesses, and people building from scratch."
  },
  {
    title: "Shows",
    code: "SHW",
    description: "Original long-form and short-form formats for youth culture, business, and entertainment."
  },
  {
    title: "Culture Content",
    code: "CUL",
    description: "Street interviews, student stories, challenges, and real community moments."
  }
];

export const fallbackFeatured = [
  {
    title: "Built From Zero",
    type: "documentary",
    category: "Founder Stories",
    excerpt: "A raw series following people building their first serious thing with limited money, time, and proof.",
    thumbnail_image: "",
    status: "published",
    featured: true
  },
  {
    title: "Artist Diaries",
    type: "show",
    category: "Creator Stories",
    excerpt: "Short cinematic portraits of artists, performers, and makers documenting the messy middle.",
    thumbnail_image: "",
    status: "published",
    featured: true
  },
  {
    title: "Student Stories",
    type: "feature",
    category: "Culture",
    excerpt: "Campus life, side hustles, friendship, pressure, and the young people trying anyway.",
    thumbnail_image: "",
    status: "published",
    featured: true
  }
];

export const originalSeries = [
  "Built From Zero",
  "Artist Diaries",
  "Student Stories",
  "Just Try Challenges",
  "Marketplace Stories",
  "Behind The Business"
].map((title, index) => ({
  title,
  slug: title.toLowerCase().replaceAll(" ", "-"),
  category: ["Founder Stories", "Creator Culture", "Student Life", "Challenge Format", "Local Culture", "Business Stories"][index],
  description: [
    "Following founders and creators before the proof, polish, or big announcement.",
    "Creative process, identity, discipline, and performance told through intimate episodes.",
    "Campus pressure, side hustles, friendships, and the student years people actually live.",
    "Human challenges with energy, humour, stakes, and a strong social-first format.",
    "The people, stalls, makers, and trades behind local culture and commerce.",
    "Small teams, experiments, late nights, and the work nobody sees."
  ][index],
  status: ["In Production", "Coming Soon", "Coming Soon", "Coming Soon", "In Production", "Coming Soon"][index]
}));

export const fallbackEvents = [
  {
    title: "Event Film Packages",
    location: "UK and international",
    date: "Available now",
    description: "Cinematic coverage for launches, student nights, cultural events, creator meetups, and brand activations.",
    status: "published"
  },
  {
    title: "Just Try Live Sessions",
    location: "Coming soon",
    date: "TBA",
    description: "A filmed conversation and performance format for creators, founders, artists, and people building from zero.",
    status: "planned"
  }
];

export const audienceBlocks = [
  {
    title: "Launch films",
    description: "Make the first release, opening night, product drop, or student project feel like a moment."
  },
  {
    title: "Event coverage",
    description: "Turn the room, crowd, sound, interviews, and tiny details into content people want to share."
  },
  {
    title: "Original shows & documentaries",
    description: "Build a repeatable format around a person, community, business, artist, or campus story."
  }
];

export const eventServices = [
  "Promo reels",
  "Event filming",
  "Aftermovie",
  "Interviews",
  "Photo coverage",
  "Social campaign support"
];

export const collaborationPaths = [
  "Join the media team",
  "Collaborate with us",
  "Tell your story",
  "Book event coverage"
];
