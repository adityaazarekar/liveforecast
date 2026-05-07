// Hardcoded famous landmark per top 100 city — used to build precise Unsplash queries
// so City Lore image shows the iconic landmark, not generic skyline.

export const FAMOUS_LANDMARKS: Record<string, string> = {
  // Europe
  "paris": "Eiffel Tower Paris",
  "london": "Big Ben London",
  "rome": "Colosseum Rome",
  "barcelona": "Sagrada Familia Barcelona",
  "madrid": "Plaza Mayor Madrid",
  "berlin": "Brandenburg Gate Berlin",
  "amsterdam": "Amsterdam canals tulips",
  "vienna": "Schonbrunn Palace Vienna",
  "prague": "Charles Bridge Prague",
  "athens": "Parthenon Acropolis Athens",
  "venice": "Venice Grand Canal gondola",
  "florence": "Duomo Florence cathedral",
  "milan": "Milan Duomo cathedral",
  "lisbon": "Belem Tower Lisbon",
  "dublin": "Trinity College Dublin",
  "edinburgh": "Edinburgh Castle Scotland",
  "moscow": "Saint Basil Cathedral Moscow",
  "saint petersburg": "Hermitage Saint Petersburg",
  "istanbul": "Hagia Sophia Istanbul",
  "budapest": "Hungarian Parliament Budapest",
  "stockholm": "Gamla Stan Stockholm",
  "copenhagen": "Nyhavn Copenhagen",
  "oslo": "Oslo Opera House",
  "helsinki": "Helsinki Cathedral",
  "reykjavik": "Hallgrimskirkja Reykjavik",
  "zurich": "Zurich lake mountains",
  "geneva": "Lake Geneva Jet d'Eau",
  "munich": "Marienplatz Munich",
  "hamburg": "Elbphilharmonie Hamburg",
  "brussels": "Grand Place Brussels",
  "warsaw": "Warsaw Old Town",
  "krakow": "Wawel Castle Krakow",
  "ottery st mary": "Ottery St Mary church Devon England",

  // Middle East / Asia
  "dubai": "Burj Khalifa Dubai skyline",
  "abu dhabi": "Sheikh Zayed Mosque Abu Dhabi",
  "doha": "Doha skyline Museum Islamic Art",
  "riyadh": "Kingdom Centre Riyadh",
  "jeddah": "Jeddah corniche fountain",
  "tel aviv": "Tel Aviv beach skyline",
  "jerusalem": "Western Wall Dome of Rock Jerusalem",
  "tehran": "Azadi Tower Tehran",
  "mumbai": "Gateway of India Mumbai",
  "delhi": "India Gate New Delhi",
  "new delhi": "India Gate New Delhi",
  "agra": "Taj Mahal Agra",
  "jaipur": "Hawa Mahal Jaipur",
  "bangalore": "Vidhana Soudha Bangalore",
  "kolkata": "Victoria Memorial Kolkata",
  "chennai": "Marina Beach Chennai",
  "hyderabad": "Charminar Hyderabad",
  "bangkok": "Wat Arun Bangkok temple",
  "singapore": "Marina Bay Sands Singapore",
  "kuala lumpur": "Petronas Towers Kuala Lumpur",
  "jakarta": "Monas Jakarta",
  "manila": "Manila Intramuros",
  "hanoi": "Hanoi old quarter temple",
  "ho chi minh city": "Ho Chi Minh City Notre Dame Saigon",
  "tokyo": "Tokyo Tower skyline",
  "kyoto": "Fushimi Inari Kyoto torii",
  "osaka": "Osaka Castle",
  "seoul": "Gyeongbokgung Palace Seoul",
  "beijing": "Forbidden City Beijing",
  "shanghai": "Shanghai Pudong skyline Oriental Pearl",
  "hong kong": "Hong Kong Victoria Harbour skyline",
  "taipei": "Taipei 101 tower",
  "kathmandu": "Boudhanath Stupa Kathmandu",

  // Africa
  "cairo": "Pyramids Giza Cairo",
  "cape town": "Table Mountain Cape Town",
  "johannesburg": "Johannesburg skyline",
  "marrakech": "Jemaa el-Fnaa Marrakech",
  "casablanca": "Hassan II Mosque Casablanca",
  "nairobi": "Nairobi skyline",
  "lagos": "Lagos Nigeria skyline",
  "addis ababa": "Addis Ababa Ethiopia",
  "zanzibar": "Stone Town Zanzibar",

  // Americas
  "new york": "Statue of Liberty Manhattan skyline",
  "los angeles": "Hollywood sign Los Angeles",
  "san francisco": "Golden Gate Bridge San Francisco",
  "chicago": "Chicago skyline Cloud Gate",
  "miami": "Miami beach art deco",
  "las vegas": "Las Vegas strip neon",
  "washington": "Washington Capitol Building",
  "boston": "Boston skyline Charles River",
  "seattle": "Space Needle Seattle",
  "toronto": "CN Tower Toronto",
  "vancouver": "Vancouver skyline mountains",
  "montreal": "Notre-Dame Basilica Montreal",
  "mexico city": "Angel of Independence Mexico City",
  "havana": "Havana Cuba colorful cars",
  "rio de janeiro": "Christ the Redeemer Rio de Janeiro",
  "sao paulo": "Sao Paulo skyline",
  "buenos aires": "Obelisco Buenos Aires",
  "lima": "Lima Peru plaza",
  "cusco": "Machu Picchu Cusco",
  "santiago": "Santiago Chile Andes skyline",
  "bogota": "Bogota Colombia mountains",
  "cartagena": "Cartagena Colombia colorful",

  // Oceania
  "sydney": "Sydney Opera House Harbour Bridge",
  "melbourne": "Melbourne skyline trams",
  "auckland": "Auckland Sky Tower harbour",
  "wellington": "Wellington New Zealand cable car",
  "queenstown": "Queenstown New Zealand lake mountains",
};

/**
 * Returns the most iconic landmark search query for a city.
 * Falls back to "<city> famous landmark architecture" for unknown cities.
 */
export function landmarkQueryFor(cityName: string, country?: string): string {
  const key = cityName.trim().toLowerCase();
  if (FAMOUS_LANDMARKS[key]) return FAMOUS_LANDMARKS[key];
  // graceful fallback: still better than "skyline"
  return country
    ? `${cityName} ${country} famous landmark monument`
    : `${cityName} famous landmark monument`;
}
