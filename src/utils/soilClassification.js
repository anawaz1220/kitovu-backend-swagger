const classifyNutrientStatus = (elementName, quantity) => {
  const classifications = {
    "nitrogen_total": [
      { min: 0, max: 11, status: "Very Low" },
      { min: 11, max: 26, status: "Low" },
      { min: 26, max: 41, status: "Medium" },
      { min: 41, max: Infinity, status: "High" }
    ],
    "phosphorous_extractable": [
      { min: 0, max: 15, status: "Very Low" },
      { min: 15, max: 31, status: "Low" },
      { min: 31, max: 51, status: "Medium" },
      { min: 51, max: Infinity, status: "High" }
    ],
    "potassium_extractable": [
      { min: 0, max: 41, status: "Very Low" },
      { min: 41, max: 81, status: "Low" },
      { min: 81, max: 121, status: "Medium" },
      { min: 121, max: Infinity, status: "High" }
    ],
    "magnesium_extractable": [
      { min: 0, max: 11, status: "Very Low" },
      { min: 11, max: 31, status: "Low" },
      { min: 31, max: 51, status: "Medium" },
      { min: 51, max: Infinity, status: "High" }
    ],
    "calcium_extractable": [
      { min: 0, max: 51, status: "Low" },
      { min: 51, max: 151, status: "Medium" },
      { min: 151, max: Infinity, status: "High" }
    ],
    "sulphur_extractable": [
      { min: 0, max: 6, status: "Low" },
      { min: 6, max: 16, status: "Medium" },
      { min: 16, max: Infinity, status: "High" }
    ],
    "iron_extractable": [
      { min: 0, max: 16, status: "Very Low" },
      { min: 16, max: 51, status: "Low" },
      { min: 51, max: 251, status: "Medium" },
      { min: 251, max: Infinity, status: "High" }
    ]
  };

  const ranges = classifications[elementName];
  if (!ranges) return { status: "Unknown", name: elementName.split("_")[0] };

  for (const range of ranges) {
    if (quantity >= range.min && quantity < range.max) {
      return {
        status: range.status,
        name: elementName.split("_")[0]
      };
    }
  }

  return { status: "High", name: elementName.split("_")[0] };
};

module.exports = { classifyNutrientStatus };