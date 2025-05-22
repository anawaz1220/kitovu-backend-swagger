const dosage_template = {
  "nitrogen_total": {
    'Very Low': 140,
    'Low': 135,
    'Medium': 120,
    'High': 0
  },
  "phosphorous_extractable": {
    'Very Low': 50,
    'Low': 45,
    'Medium': 30,
    'High': 0
  },
  "potassium_extractable": {
    'Very Low': 50,
    'Low': 45,
    'Medium': 38,
    'High': 0
  },
  "magnesium_extractable": {
    'Very Low': 15,
    'Low': 13,
    'Medium': 10,
    'High': 0
  },
  "calcium_extractable": {
    'Very Low': 76,
    'Low': 72,
    'Medium': 63,
    'High': 0,
  },
  "sulphur_extractable": {
    'Very Low': 40,
    'Low': 35,
    'Medium': 30,
    'High': 0
  },
  "iron_extractable": {
    'Very Low': 1.7,
    'Low': 1.1,
    'Medium': 1,
    'High': 0
  }
};

const FR_DATA = {
  maize: dosage_template,
  rice: dosage_template,
  sorghum: dosage_template,
  wheat: dosage_template,
  millet: dosage_template,
  oats: dosage_template,
  barley: dosage_template,
  rye: dosage_template,
  cassava: dosage_template,
};

// Commercial fertilizer products mapping
const COMMERCIAL_FERTILIZERS = {
  nitrogen: [
    { name: "Urea", composition: { N: 46, P: 0, K: 0 } },
    { name: "Ammonium Sulfate", composition: { N: 21, P: 0, K: 0, S: 24 } }
  ],
  phosphorus: [
    { name: "Single Super Phosphate", composition: { N: 0, P: 18, K: 0, S: 12 } },
    { name: "Triple Super Phosphate", composition: { N: 0, P: 46, K: 0 } }
  ],
  potassium: [
    { name: "Muriate of Potash", composition: { N: 0, P: 0, K: 60 } }
  ],
  compound: [
    { name: "NPK 15-15-15", composition: { N: 15, P: 15, K: 15 } },
    { name: "NPK 20-10-10", composition: { N: 20, P: 10, K: 10 } },
    { name: "NPK 12-12-17", composition: { N: 12, P: 12, K: 17 } }
  ]
};

module.exports = { FR_DATA, COMMERCIAL_FERTILIZERS };