// Continents → weather/biomes/resource modifiers
const GS_DATA = {
  continents: {
    "Европа": { weather: "умеренный/морской", biomes: ["широколиственные леса", "смешанные леса", "лесостепь"], mods:{ wood:1.1, stone:1.0, iron:1.1, food:1.2, gold:1.0, oil:0.5 } },
    "Азия": { weather: "континентальный/муссонный", biomes: ["тайга","степь","пустыня","джунгли","горные"], mods:{ wood:1.0, stone:1.1, iron:1.2, food:1.0, gold:1.1, oil:1.2 } },
    "Африка": { weather: "тропический/саванна/пустыня", biomes: ["саванна","джунгли","пустыня"], mods:{ wood:0.9, stone:1.0, iron:1.0, food:0.9, gold:1.3, oil:1.4 } },
    "Северная Америка": { weather: "умеренный/субарктический", biomes: ["хвойные леса","прерии","тундра","горы"], mods:{ wood:1.2, stone:1.1, iron:1.1, food:1.0, gold:1.1, oil:1.3 } },
    "Южная Америка": { weather: "тропический/умеренный", biomes: ["амазонские леса","саванна","Анды"], mods:{ wood:1.3, stone:1.0, iron:0.9, food:1.1, gold:1.2, oil:0.8 } },
    "Австралия": { weather: "засушливый/саванна", biomes: ["эвкалиптовые леса","полупустыни","саванна"], mods:{ wood:0.9, stone:1.0, iron:1.2, food:0.8, gold:1.0, oil:0.6 } },
    "Антарктида": { weather: "полярный", biomes: ["ледяная пустыня"], mods:{ wood:0.1, stone:1.5, iron:0.6, food:0.1, gold:0.5, oil:0.0 } }
  },
  baseYieldPerMinute: { wood:5, stone:4, iron:3, food:5, gold:2, oil:1 },
  buildingBonuses: { port:{oil: +1, gold:+1}, tower:{iron:+1}, fortress:{stone:+2} },
  training: { infantry: { cost:{ food:20, iron:10}, perClick:10 } }
};

// Very rough continent detection by lat/lng box (for demo)
function detectContinent(lat, lng){
  if(lat>35 && lat<72 && lng>-25 && lng<45) return "Европа";
  if(lat>5 && lat<80 && lng>45 && lng<180) return "Азия";
  if(lat>-35 && lat<35 && lng>-20 && lng<50) return "Африка";
  if(lat>7 && lat<83 && lng>-170 && lng<-25) return "Северная Америка";
  if(lat>-56 && lat<13 && lng>-82 && lng<-34) return "Южная Америка";
  if(lat>-45 && lat<-8 && lng>110 && lng<180) return "Австралия";
  if(lat<-60) return "Антарктида";
  return "Европа";
}
