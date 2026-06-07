// src/api/mockSchedule.js
// Mock data designed to replicate the UI screenshot and feature real 2026 schedules

// Hero Carousel Banner items
export const MOCK_CAROUSEL = [
  {
    id: 170161,
    title: "The Angel Next Door Spoils Me Rotten S2",
    nativeTitle: "Otonari no Tenshi-sama ni Itsu no Ma ni ka Dame Ningen ni Sarezutedan Ken 2nd Season",
    episode: 10,
    genres: ["Romance", "Comedy", "Slice of Life"],
    rating: "9.7/10",
    coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx170161-tP7n6bW1H7lT.png",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/153347-t0XJtD2sB2H6.jpg",
    countdownDays: 0,
    countdownHours: 2,
    countdownMinutes: 54
  },
  {
    id: 999999,
    title: "I Want to End This Love Game",
    nativeTitle: "Aishiteru Game wo Owarasetai",
    episode: 9,
    genres: ["Romance", "Comedy", "School"],
    rating: "9.5/10",
    coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx162804-M8bC3kF7e9bM.jpg",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/162804-M8bC3kF7e9bM.jpg",
    countdownDays: 4,
    countdownHours: 3,
    countdownMinutes: 25
  },
  {
    id: 151807,
    title: "Solo Leveling",
    nativeTitle: "Ore dake Level Up na Ken",
    episode: 12,
    genres: ["Action", "Fantasy", "Adventure"],
    rating: "9.8/10",
    coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-6cnuus5yLhXL.png",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-578d6b63f82025114cc1c64070a75d5b.jpg",
    countdownDays: 2,
    countdownHours: 4,
    countdownMinutes: 15
  }
];

// Airing Today horizontal banner items
export const MOCK_AIRING_TODAY = [
  {
    id: 170161,
    title: "The Angel Next Door Spoils Me Rotten S2",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx170161-tP7n6bW1H7lT.png",
    elapsed: "Airing in 2h",
    releaseTime: "10:30 PM JST"
  },
  {
    id: 21,
    title: "One Piece",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-6351u457t41O.png",
    elapsed: "23m ago",
    releaseTime: "12:50 PM JST"
  },
  {
    id: 999999,
    title: "I Want to End This Love Game",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx162804-M8bC3kF7e9bM.jpg",
    elapsed: "Airing in 4d",
    releaseTime: "11:00 PM JST"
  }
];

// Grid Schedule by day of the week
export const MOCK_SCHEDULE = {
  Friday: [
    {
      id: 170161,
      title: "The Angel Next Door Spoils Me Rotten Season 2",
      nativeTitle: "Otonari no Tenshi-sama ni Itsu no Ma ni ka Dame Ningen ni Sarezutedan Ken 2nd Season",
      genres: ["Romance", "Comedy", "Slice of Life"],
      studio: "Felix Film",
      rating: "9.7/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx170161-tP7n6bW1H7lT.png",
      prediction: {
        previous: "Ep 9 (May 29)",
        predicted: "Ep 10 (June 05)",
        confidence: 98
      }
    },
    {
      id: 153518,
      title: "Chainsaw Man Season 2",
      nativeTitle: "Chainsaw Man: Reze-hen",
      genres: ["Action", "Dark Fantasy", "Gore"],
      studio: "MAPPA",
      rating: "9.7/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx110277-24US526U756U.jpg",
      prediction: {
        previous: "Movie (TBA)",
        predicted: "Ep 1 (Dec 2026)",
        confidence: 70
      }
    }
  ],
  Saturday: [
    {
      id: 154587,
      title: "Frieren: Beyond Journey's End",
      nativeTitle: "Sousou no Frieren",
      genres: ["Adventure", "Drama", "Fantasy"],
      studio: "Madhouse",
      rating: "9.9/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n6bZ7zScxr11.png",
      prediction: {
        previous: "Ep 28 (Mar 22)",
        predicted: "Season 2 (TBA)",
        confidence: 80
      }
    }
  ],
  Sunday: [
    {
      id: 21,
      title: "One Piece",
      nativeTitle: "ONE PIECE",
      genres: ["Action", "Adventure", "Comedy", "Drama"],
      studio: "Toei Animation",
      rating: "9.6/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-6351u457t41O.png",
      prediction: {
        previous: "Ep 1105 (May 19)",
        predicted: "Ep 1106 (May 26)",
        confidence: 99
      }
    }
  ],
  Monday: [
    {
      id: 101922,
      title: "Demon Slayer: Kimetsu no Yaiba",
      nativeTitle: "Demon Slayer: Yaiba",
      genres: ["Action", "Fantasy", "Animas", "Saima"],
      studio: "Anime",
      rating: "9.8/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTm937NP.jpg",
      prediction: {
        previous: "Ep 10 (May 14)",
        predicted: "Ep 11 (May 21)",
        confidence: 95
      }
    },
    {
      id: 151807,
      title: "Solo Leveling (DUB)",
      nativeTitle: "Ore dake Level Up na Ken",
      genres: ["Action", "Fantasy", "Adventure"],
      studio: "A-1 Pictures",
      rating: "9.6/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-6cnuus5yLhXL.png",
      prediction: {
        previous: "Ep 10 (May 14)",
        predicted: "Ep 11 (May 21)",
        confidence: 85
      }
    }
  ],
  Tuesday: [
    {
      id: 999999,
      title: "I Want to End This Love Game",
      nativeTitle: "Aishiteru Game wo Owarasetai",
      genres: ["Romance", "Comedy", "School"],
      studio: "Felix Film",
      rating: "9.5/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx162804-M8bC3kF7e9bM.jpg",
      prediction: {
        previous: "Ep 8 (June 02)",
        predicted: "Ep 9 (June 09)",
        confidence: 96
      }
    },
    {
      id: 171018,
      title: "Kaiju No. 8",
      nativeTitle: "Kaijuu 8-gou",
      genres: ["Action", "Sci-Fi", "Military"],
      studio: "Production I.G",
      rating: "9.1/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153288-nSdfSDAvXf6h.jpg",
      prediction: {
        previous: "Ep 7 (May 25)",
        predicted: "Ep 8 (June 01)",
        confidence: 99
      }
    }
  ],
  Wednesday: [
    {
      id: 163078,
      title: "Mushoku Tensei Season 2 Part 2",
      nativeTitle: "Mushoku Tensei II: Isekai Ittara Honki Dasu",
      genres: ["Adventure", "Fantasy", "Drama"],
      studio: "Studio Bind",
      rating: "9.4/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163078-H20Z23xSyr9z.png",
      prediction: {
        previous: "Ep 20 (May 26)",
        predicted: "Ep 21 (June 02)",
        confidence: 92
      }
    }
  ],
  Thursday: [
    {
      id: 162804,
      title: "Wind Breaker",
      nativeTitle: "WIND BREAKER",
      genres: ["Action", "Delinquent", "School"],
      studio: "CloverWorks",
      rating: "8.7/10",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx162804-M8bC3kF7e9bM.jpg",
      prediction: {
        previous: "Ep 9 (May 30)",
        predicted: "Ep 10 (June 06)",
        confidence: 96
      }
    }
  ]
};

// Activity Feed list
export const MOCK_ACTIVITIES = [
  {
    id: 1,
    animeTitle: "The Angel Next Door S2",
    episode: 10,
    text: "Episode 10 of The Angel Next Door S2 released",
    time: "21 minutes ago",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx170161-tP7n6bW1H7lT.png"
  },
  {
    id: 2,
    animeTitle: "Solo Leveling",
    episode: 12,
    text: "Episode 12 !. Released 12",
    time: "33 minutes ago",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-6cnuus5yLhXL.png"
  },
  {
    id: 3,
    animeTitle: "I Want to End This Love Game",
    episode: 9,
    text: "I Want to End This Love Game added to library",
    time: "1 hour ago",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx162804-M8bC3kF7e9bM.jpg"
  },
  {
    id: 4,
    animeTitle: "Spy x Family",
    episode: 13,
    text: "Spy x Family has adted 13 episode",
    time: "3 hours ago",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-QDdfV7zscxr1.jpg"
  }
];

// Stats Widgets
export const MOCK_STATS = {
  currentlyAiring: 142,
  releasingToday: 8,
  animeFollowed: 25
};
