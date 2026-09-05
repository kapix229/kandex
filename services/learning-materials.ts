// Service to find learning materials based on event description
export interface LearningMaterial {
  id: string;
  title: string;
  source: "youtube" | "khan-academy" | "wikipedia" | "coursera" | "udemy" | "github";
  url: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration?: string;
  rating?: number;
}

export interface ExtractedTopic {
  keywords: string[];
  mainTopic: string;
  subtopics: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

// AI-based topic extraction and material recommendation
export function extractTopicsFromDescription(
  title: string,
  description?: string,
  subject?: string
): ExtractedTopic {
  const fullText = `${title} ${description || ""} ${subject || ""}`.toLowerCase();

  // Keyword mapping for different subjects
  const topicKeywords: Record<string, { keywords: string[]; difficulty: string }> = {
    // Matematyka
    matematyka: {
      keywords: ["funkcje", "całki", "pochodne", "równania", "geometria", "trygonometria", "algebra"],
      difficulty: "intermediate",
    },
    historia: {
      keywords: ["epoka", "wojna", "imperium", "rewolucja", "królestwo", "państwo"],
      difficulty: "beginner",
    },
    polski: {
      keywords: ["literatura", "poezja", "proza", "dramat", "analiza", "esej", "interpretacja"],
      difficulty: "intermediate",
    },
    angielski: {
      keywords: ["grammar", "vocabulary", "speaking", "listening", "writing", "reading"],
      difficulty: "beginner",
    },
    biologia: {
      keywords: ["komórka", "organizm", "ewolucja", "genetyka", "ekologia", "mikrobiologia"],
      difficulty: "intermediate",
    },
    chemia: {
      keywords: ["reaktywność", "mol", "kwas", "zasada", "elektroliza", "pierwiastek"],
      difficulty: "advanced",
    },
    fizyka: {
      keywords: ["siła", "energia", "ruch", "światło", "termodynamika", "elektromagnetyzm"],
      difficulty: "intermediate",
    },
  };

  // Extract main topic from subject and title
  const mainTopic = Object.keys(topicKeywords).find(
    (key) => fullText.includes(key)
  ) || "general";

  const topicData = topicKeywords[mainTopic] || {
    keywords: ["learning"],
    difficulty: "intermediate",
  };

  // Extract specific keywords
  const keywords = topicData.keywords.filter((kw) => fullText.includes(kw));

  return {
    keywords: keywords.length > 0 ? keywords : topicData.keywords.slice(0, 3),
    mainTopic,
    subtopics: extractSubtopics(fullText),
    difficulty: topicData.difficulty as "beginner" | "intermediate" | "advanced",
  };
}

function extractSubtopics(text: string): string[] {
  const subtopicPatterns: Record<string, string[]> = {
    funkcje: ["funkcje liniowe", "funkcje kwadratowe", "funkcje wykładnicze"],
    równania: ["równania liniowe", "równania kwadratowe", "systemy równań"],
    geometria: ["planimetria", "stereometria", "wektory"],
    literatura: ["twórczość", "analiza tekstu", "interpretacja"],
    historia: ["średniowiecze", "okres nowożytny", "czasy współczesne"],
  };

  const foundSubtopics: string[] = [];
  for (const [key, subtopics] of Object.entries(subtopicPatterns)) {
    if (text.includes(key)) {
      foundSubtopics.push(...subtopics);
    }
  }

  return [...new Set(foundSubtopics)].slice(0, 3);
}

// Mock learning materials database - w przyszłości integracja z API
export function recommendMaterials(topic: ExtractedTopic): LearningMaterial[] {
  const materials: Record<string, LearningMaterial[]> = {
    "funkcje-liniowe": [
      {
        id: "yt-1",
        title: "Funkcje Liniowe - Kurs Od Podstaw",
        source: "youtube",
        url: "https://www.youtube.com/results?search_query=funkcje+liniowe",
        description: "Kompletny kurs funkcji liniowych z przykładami",
        difficulty: "beginner",
        duration: "45 min",
        rating: 4.8,
      },
      {
        id: "khan-1",
        title: "Khan Academy - Linear Functions",
        source: "khan-academy",
        url: "https://www.khanacademy.org/math/algebra",
        description: "Interaktywny kurs z ćwiczeniami",
        difficulty: "beginner",
        rating: 4.9,
      },
    ],
    pochodne: [
      {
        id: "yt-2",
        title: "Pochodne - Kurs Zaawansowany",
        source: "youtube",
        url: "https://www.youtube.com/results?search_query=pochodne+matematyka",
        description: "Pochodne od podstaw do zaawansowanych zagadnień",
        difficulty: "intermediate",
        duration: "2 godz",
        rating: 4.7,
      },
    ],
    literatura: [
      {
        id: "wiki-1",
        title: "Literatura Polska - Wikipedia",
        source: "wikipedia",
        url: "https://pl.wikipedia.org/wiki/Literatura_polska",
        description: "Encyklopedyczne informacje o literaturze",
        difficulty: "intermediate",
        rating: 4.5,
      },
    ],
  };

  const allMaterials: LearningMaterial[] = [];

  // Find materials based on extracted keywords
  for (const keyword of topic.keywords) {
    if (materials[keyword]) {
      allMaterials.push(...materials[keyword]);
    }
  }

  // If no specific materials found, return general resources
  if (allMaterials.length === 0) {
    return [
      {
        id: "general-1",
        title: `${topic.mainTopic.charAt(0).toUpperCase() + topic.mainTopic.slice(1)} - Zasoby Edukacyjne`,
        source: "wikipedia",
        url: `https://pl.wikipedia.org/wiki/${topic.mainTopic}`,
        description: "Przegląd ogólny tematu",
        difficulty: topic.difficulty,
        rating: 4.5,
      },
      {
        id: "general-2",
        title: `Kurs ${topic.mainTopic} - YouTube`,
        source: "youtube",
        url: `https://www.youtube.com/results?search_query=${topic.keywords[0] || topic.mainTopic}`,
        description: "Wiele tutoriali dostępnych",
        difficulty: topic.difficulty,
        rating: 4.3,
      },
    ];
  }

  return allMaterials.slice(0, 5);
}
