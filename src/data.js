export const createTypes = [
  "Documentaries",
  "Shows",
  "Event Films",
  "Creator Stories",
  "Founder Stories",
  "Culture Content",
  "Blogs & Features"
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
  description: [
    "Founder and creator journeys from the earliest stage.",
    "Creative process, identity, discipline, and performance.",
    "Youth culture and real stories from student life.",
    "Human challenges with energy, humour, and stakes.",
    "The people, stalls, makers, and trades behind local commerce.",
    "Small teams, experiments, and the work nobody sees."
  ][index],
  status: "planned"
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
