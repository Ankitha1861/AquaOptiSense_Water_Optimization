// Run this script with Node.js to generate the ward mapping debug file
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load GeoJSON and ward data
const geojsonData = JSON.parse(readFileSync(join(__dirname, 'BBMP.geojson'), 'utf8'));
const wardData = JSON.parse(readFileSync(join(__dirname, 'ward-data.json'), 'utf8'));

// Normalize ward names for matching (copy of the function from React component)
const normalizeWardName = (name) => {
  return String(name || "").toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
};

// Levenshtein distance implementation
function levenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: an + 1 }, () => new Array(bn + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[i][0] = i;
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[an][bn];
}

function similarity(a, b) {
  const A = normalizeWardName(a);
  const B = normalizeWardName(b);
  if (!A && !B) return 0;
  const dist = levenshtein(A, B);
  return 1 - dist / Math.max(A.length, B.length, 1);
}

// Generate mapping debug info
const mappingDebug = geojsonData.features.map((feature, index) => {
  const featureName = feature.properties.KGISWardName;
  const featureNo = feature.properties.KGISWardNo;
  const normalizedFeatureName = normalizeWardName(featureName);

  // Try exact match first
  let matchMethod = 'none';
  let matchScore = 0;
  let matchedWard = null;

  // 1. Try exact match
  const exactMatch = wardData.find(w => normalizeWardName(w.name) === normalizedFeatureName);
  if (exactMatch) {
    matchMethod = 'exact';
    matchScore = 1;
    matchedWard = exactMatch;
  }

  // 2. Try contains match if no exact match
  if (!matchedWard) {
    const containsMatch = wardData.find(w => {
      const wn = normalizeWardName(w.name);
      return wn.includes(normalizedFeatureName) || normalizedFeatureName.includes(wn);
    });
    if (containsMatch) {
      matchMethod = 'contains';
      matchScore = 0.9; // High confidence for contains
      matchedWard = containsMatch;
    }
  }

  // 3. Try ward number/id match
  if (!matchedWard) {
    const idMatch = wardData.find(w => {
      const id = String(w.id || "").toLowerCase();
      const name = normalizeWardName(w.name);
      return id.includes(String(featureNo).toLowerCase()) || name.includes(String(featureNo));
    });
    if (idMatch) {
      matchMethod = 'id';
      matchScore = 0.95; // High confidence for ID match
      matchedWard = idMatch;
    }
  }

  // 4. Try fuzzy match if still no match
  if (!matchedWard) {
    let bestMatch = { ward: null, score: 0 };
    wardData.forEach(ward => {
      const score = similarity(featureName, ward.name);
      if (score > bestMatch.score && score >= 0.5) {
        bestMatch = { ward, score };
      }
    });
    if (bestMatch.ward) {
      matchMethod = 'fuzzy';
      matchScore = bestMatch.score;
      matchedWard = bestMatch.ward;
    }
  }

  return {
    featureIndex: index,
    KGISWardNo: featureNo,
    KGISWardName: featureName,
    matchedWardId: matchedWard?.id || null,
    matchedWardName: matchedWard?.name || null,
    matchMethod,
    matchScore,
    // Include centroid for mapping verification
    centroid: feature.geometry.coordinates[0].reduce((acc, coord) => {
      if (typeof coord[0] === 'number') {
        acc.x += coord[0];
        acc.y += coord[1];
        acc.count++;
      }
      return acc;
    }, { x: 0, y: 0, count: 0 }),
  };
});

// Calculate some statistics
const stats = {
  totalFeatures: mappingDebug.length,
  matchedFeatures: mappingDebug.filter(m => m.matchedWardId !== null).length,
  byMatchMethod: {
    exact: mappingDebug.filter(m => m.matchMethod === 'exact').length,
    contains: mappingDebug.filter(m => m.matchMethod === 'contains').length,
    id: mappingDebug.filter(m => m.matchMethod === 'id').length,
    fuzzy: mappingDebug.filter(m => m.matchMethod === 'fuzzy').length,
    none: mappingDebug.filter(m => m.matchMethod === 'none').length,
  },
  uniqueWardsMapped: new Set(mappingDebug.filter(m => m.matchedWardId).map(m => m.matchedWardId)).size,
  totalWardData: wardData.length,
};

// Save both mapping and stats
const output = {
  stats,
  mappings: mappingDebug
};

writeFileSync(
  join(__dirname, 'ward-mapping-debug.json'),
  JSON.stringify(output, null, 2)
);

console.log('Debug mapping file generated: ward-mapping-debug.json');
console.log('\nMatching Statistics:');
console.log(`Total GeoJSON features: ${stats.totalFeatures}`);
console.log(`Features matched to wards: ${stats.matchedFeatures}`);
console.log(`Unique wards mapped: ${stats.uniqueWardsMapped} of ${stats.totalWardData}`);
console.log('\nMatch methods:');
console.log(stats.byMatchMethod);