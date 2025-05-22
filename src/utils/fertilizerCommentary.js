const FR_COMMENTARY = {
  "nitrogen": "Slow growth and uniform yellowing of older leaves are usually the first symptoms of nitrogen (N) deficiency. Nitrogen-deficient plants produce smaller than normal fruit, leaves, and shoots and these can develop later than normal. Planting of cover crops and legumes like cowpea, soybean and Bambara will help increase Nitrogen where it's extremely low.",
  "phosphorous": "Phosphorus deficiency tends to inhibit or prevent shoot growth. Leaves turn dark, dull, blue-green, and may become pale in severe deficiency. Reddish, reddish-violet, or violet color develops from increased anthocyanin synthesis. Symptoms appear first on older parts of the plant. Recycling of on-farm organic materials such as composts, green manures and animal manures will increase phosphorus where low or extremely low",
  "potassium": "Potassium deficiency causes leaves to turn yellow and then brown at the tips and margins and between veins. Older leaves are affected first and can entirely discolor, crinkle, curl, roll along edges, or die and drop prematurely. Rich compost and well-rotted manure are two great options to boost soil with low or extremely low potassium.",
  "magnesium": "Magnesium is the central core of the chlorophyll molecule in plant tissue. Thus, if Mg is deficient, the shortage of chlorophyll results in poor and stunted plant growth. Epsom salts and lime will increase Magnesium in soil with low quantity.",
  "calcium": "Calcium deficiency symptoms appear initially as localized tissue necrosis leading to stunted plant growth, necrotic leaf margins on young leaves or curling of the leaves, and eventual death of terminal buds and root tips. Generally, the new growth and rapidly growing tissues of the plant are affected first. Eggshells in your compost will improve calcium where low or extremely low.",
  "sulphur": "Sulphur deficiency symptoms appear initially as localized tissue necrosis leading to stunted plant growth, necrotic leaf margins on young leaves or curling of the leaves, and eventual death of terminal buds and root tips. Generally, the new growth and rapidly growing tissues of the plant are affected first. Amending soil with compost will increase sulphur in soil.",
  "iron": "The primary symptom of iron deficiency is interveinal chlorosis, the development of a yellow leaf with a network of dark green veins. In severe cases, the entire leaf turns yellow or white and the outer edges may scorch and turn brown as the plant cells die. Leaving plant remains like vegetables in soil after harvesting will boost iron in soil."
};

const getCommentaryForDeficiency = (elementName, status) => {
  if (status === "Very Low" || status === "Low") {
    return FR_COMMENTARY[elementName] || `Consider addressing ${elementName} deficiency through appropriate fertilization.`;
  }
  return null;
};

module.exports = { FR_COMMENTARY, getCommentaryForDeficiency };