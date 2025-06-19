// src/utils/seedHerbicideData.js
const AppDataSource = require("../data-source");
const Herbicide = require("../entities/Herbicide");
const HerbicideBrand = require("../entities/HerbicideBrand");
const HerbicideCrop = require("../entities/HerbicideCrop");

/**
 * Seed herbicide data from Excel analysis into database
 */
const seedHerbicideData = async () => {
  try {
    console.log("Starting herbicide data seeding...");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const herbicideRepository = AppDataSource.getRepository(Herbicide);
    const brandRepository = AppDataSource.getRepository(HerbicideBrand);
    const cropRepository = AppDataSource.getRepository(HerbicideCrop);

    // Clear existing data
    console.log("Clearing existing herbicide data...");
    await cropRepository.delete({});
    await brandRepository.delete({});
    await herbicideRepository.delete({});

    // Herbicide data structure from Excel analysis
    const herbicideData = [
      // GLYPHOSATE
      {
        herbicide: {
          name: "glyphosate",
          active_ingredient: "Glyphosate",
          application_time: "Pre-planting, pre-emergence, pre-harvest",
          target_weeds: "Annual/perennial broadleaf, grasses, shrubs",
          growth_stage: "Land preparation stage",
          mode_of_action: "Non-selective systemic",
          spectrum: "Non-selective; broad-spectrum",
          application_method: "Foliar spray"
        },
        crops: ["maize", "rice", "cassava", "legumes"],
        brands: [
          {
            brand_name: "Sunphosate",
            concentration: "360 g/L",
            application_rate: "2-4L/ha",
            dilution_rate: "200-400L/ha",
            safety_period: "14 days",
            manufacturer: "Zhejiang Wynca Chemical Group Co., Ltd.",
            contraindications: "Avoid application if rain is expected within 4–6 hours; do not apply on desirable vegetation and 12 to 24 hours entry level after application."
          },
          {
            brand_name: "Force Up",
            concentration: "480 g/L",
            application_rate: "2-4L/ha",
            dilution_rate: "200-400L/ha",
            safety_period: "21 days",
            manufacturer: "Jubaili Agrotech",
            contraindications: "Do not spray in windy conditions; avoid drift onto desirable vegetation; 12 to 24 hours entry level after application."
          },
          {
            brand_name: "Clearweed",
            concentration: "360 g/L",
            application_rate: "3-4L/ha",
            dilution_rate: "200-400L/ha",
            safety_period: "14 days",
            manufacturer: "Harvestfield Industries Limited"
          },
          {
            brand_name: "Touchdown",
            concentration: "500 g/L",
            application_rate: "1.5-3 L/ha",
            dilution_rate: "200L/ha",
            safety_period: "14 days",
            manufacturer: "Syngenta"
          }
        ]
      },
      // ATRAZINE
      {
        herbicide: {
          name: "atrazine",
          active_ingredient: "Atrazine",
          application_time: "Pre-emergence or early post-emergence",
          target_weeds: "Annual broadleaf weeds and some grassy weeds",
          growth_stage: "Soil treatment before crop emergence or within 2-3 weeks after crop emergence",
          mode_of_action: "Selective systemic",
          spectrum: "Selective control of broadleaf weeds and some grasses",
          application_method: "Apply as a uniform spray to the soil surface or foliage (for early post-emergence)"
        },
        crops: ["maize", "cassava"],
        brands: [
          {
            brand_name: "Sun-Atrazine",
            concentration: "80% WP (Wettable Powder)",
            application_rate: "1.5-2.0 kg/ha",
            dilution_rate: "200-300L/ha",
            safety_period: "60 days",
            manufacturer: "Zhejiang Wynca Chemical Group Co., Ltd.",
            contraindications: "Do not apply on crops other than labeled ones; avoid application on waterlogged soils; avoid mixing with incompatible chemicals"
          },
          {
            brand_name: "AtraForce",
            concentration: "80% WP",
            application_rate: "1.5-2.0 kg/ha",
            dilution_rate: "200-300L/ha",
            safety_period: "60 days",
            manufacturer: "Jubaili Agrotech"
          }
        ]
      },
      // S-METOLACHLOR
      {
        herbicide: {
          name: "s_metolachlor",
          active_ingredient: "S-metolachlor",
          application_time: "Pre-emergence or early post-emergence; apply before or shortly after weed emergence",
          target_weeds: "Annual grasses and some broadleaf weeds",
          growth_stage: "Apply before crop emergence or within 7 days after planting; early post-emergence for weeds",
          mode_of_action: "Selective - systemic",
          spectrum: "Effective against a broad spectrum of annual grasses and broadleaf weeds; not effective against perennial weeds",
          application_method: "Apply as a uniform spray to the soil surface or foliage (for early post-emergence)"
        },
        crops: ["maize"],
        brands: [
          {
            brand_name: "XTRAVEST",
            concentration: "370g/L atrazine and 290g/L metolachlor",
            application_rate: "4-5 L/ha",
            dilution_rate: "200-300L/ha",
            safety_period: "60+ days",
            manufacturer: "Harvestfield Industries Limited",
            contraindications: "Avoid application on crops under stress; not recommended for sandy soils with low organic matter"
          },
          {
            brand_name: "Dual Gold 960 EC",
            concentration: "960 g/L",
            application_rate: "1.5-2.0 L/ha",
            dilution_rate: "200-300L/ha",
            safety_period: "60+ days"
          }
        ]
      },
      // NICOSULFURON
      {
        herbicide: {
          name: "nicosulfuron",
          active_ingredient: "Nicosulfuron",
          application_time: "Post-emergence",
          target_weeds: "Annual grasses, broad-leaved weeds and perennials",
          growth_stage: "Maize: 2–8 leaf stage or Weeds 2–6 true leaves",
          mode_of_action: "Selective systemic post-emergence herbicide",
          spectrum: "Effective against a broad spectrum of annual grasses, broadleaf weeds and perennial weeds",
          application_method: "Foliar"
        },
        crops: ["maize"],
        brands: [
          {
            brand_name: "Guardforce",
            concentration: "40 g/L",
            application_rate: "1-1.5 L/ha",
            dilution_rate: "200L/ha",
            safety_period: "60 days",
            manufacturer: "Jubaili Agrotec",
            contraindications: "Avoid application under windy conditions; when rain is expected within 2 hours; on maize plants under stress"
          },
          {
            brand_name: "Striker",
            concentration: "40 g/L",
            application_rate: "1-1.5 L/ha",
            dilution_rate: "200L/ha",
            safety_period: "60 days"
          }
        ]
      },
      // 2,4-D
      {
        herbicide: {
          name: "2_4_d",
          active_ingredient: "2,4-Dichlorophenoxyacetic acid (2,4-D)",
          application_time: "Post-emergence (after crop and weeds have emerged)",
          target_weeds: "Broadleaf weeds",
          growth_stage: "Best used at 3–5 leaf stage of the crop; do not apply after flowering begins",
          mode_of_action: "Selective systemic",
          spectrum: "Selective for broadleaf weeds; does not control grasses",
          application_method: "Foliar"
        },
        crops: ["maize", "rice"],
        brands: [
          {
            brand_name: "Aminoforce",
            concentration: "720 g/L",
            application_rate: "1-3 L/ha",
            dilution_rate: "200-400L/ha",
            safety_period: "30-45 days",
            manufacturer: "Jubaili Agrotec",
            contraindications: "Avoid use in high temperatures (>30°C)"
          },
          {
            brand_name: "Sun-2.4D Amine",
            concentration: "720 g/L",
            application_rate: "1-3 L/ha",
            dilution_rate: "200-400L/ha",
            safety_period: "30-45 days"
          }
        ]
      },
      // PENDIMETHALIN
      {
        herbicide: {
          name: "pendimethalin",
          active_ingredient: "Pendimethalin",
          application_time: "Pre-emergence",
          target_weeds: "Annual grasses and some broadleaf weeds",
          growth_stage: "Apply before crop and weed emergence",
          mode_of_action: "Selective pre-emergence",
          spectrum: "Effective against annual grasses and some broadleaf weeds",
          application_method: "Soil application"
        },
        crops: ["rice", "legumes"],
        brands: [
          {
            brand_name: "Stomp",
            concentration: "330 g/L",
            application_rate: "3-4 L/ha",
            dilution_rate: "200-300L/ha",
            safety_period: "60 days"
          },
          {
            brand_name: "Herbadox",
            concentration: "400 g/L",
            application_rate: "2.5-3.5 L/ha",
            dilution_rate: "250-350L/ha",
            safety_period: "60 days"
          }
        ]
      },
      // OXADIAZON (Rice)
      {
        herbicide: {
          name: "oxadiazon",
          active_ingredient: "Oxadiazon",
          application_time: "Pre-emergence",
          target_weeds: "Annual grasses and some broadleaf weeds",
          growth_stage: "Apply before rice emergence",
          mode_of_action: "Selective pre-emergence",
          spectrum: "Effective against annual grasses and some broadleaf weeds",
          application_method: "Soil application"
        },
        crops: ["rice"],
        brands: [
          {
            brand_name: "Ronstar",
            concentration: "250 g/L",
            application_rate: "2-3 L/ha",
            dilution_rate: "300-400L/ha",
            safety_period: "90 days"
          }
        ]
      },
      // PROPANIL (Rice)
      {
        herbicide: {
          name: "propanil",
          active_ingredient: "Propanil",
          application_time: "Post-emergence",
          target_weeds: "Annual grasses and some broadleaf weeds",
          growth_stage: "Rice 2-3 leaf stage, weeds 1-3 leaf stage",
          mode_of_action: "Selective post-emergence",
          spectrum: "Effective against annual grasses and broadleaf weeds",
          application_method: "Foliar spray"
        },
        crops: ["rice"],
        brands: [
          {
            brand_name: "Stam F-34",
            concentration: "360 g/L",
            application_rate: "4-6 L/ha",
            dilution_rate: "200-300L/ha",
            safety_period: "60 days"
          }
        ]
      },
      // IMAZETHAPYR (Legumes)
      {
        herbicide: {
          name: "imazethapyr",
          active_ingredient: "Imazethapyr",
          application_time: "Pre-emergence or early post-emergence",
          target_weeds: "Annual and perennial broadleaf weeds and some grasses",
          growth_stage: "Before crop emergence or when crop has 1-2 trifoliate leaves",
          mode_of_action: "Selective systemic",
          spectrum: "Broad spectrum control of broadleaf weeds and some grasses",
          application_method: "Soil or foliar application"
        },
        crops: ["legumes"],
        brands: [
          {
            brand_name: "Pursuit",
            concentration: "100 g/L",
            application_rate: "1-1.5 L/ha",
            dilution_rate: "200-300L/ha",
            safety_period: "75 days"
          }
        ]
      },
      // BENTAZONE (Legumes)
      {
        herbicide: {
          name: "bentazone",
          active_ingredient: "Bentazone",
          application_time: "Post-emergence",
          target_weeds: "Annual broadleaf weeds",
          growth_stage: "When crop has 2-4 trifoliate leaves and weeds are 2-6 leaves",
          mode_of_action: "Selective post-emergence",
          spectrum: "Selective control of broadleaf weeds",
          application_method: "Foliar spray"
        },
        crops: ["legumes"],
        brands: [
          {
            brand_name: "Basagran",
            concentration: "480 g/L",
            application_rate: "2-3 L/ha",
            dilution_rate: "200-300L/ha",
            safety_period: "60 days"
          }
        ]
      }
    ];

    // Insert herbicides and related data
    for (const data of herbicideData) {
      console.log(`Inserting herbicide: ${data.herbicide.name}`);

      // Create herbicide
      const herbicide = herbicideRepository.create(data.herbicide);
      const savedHerbicide = await herbicideRepository.save(herbicide);

      // Create crop associations
      for (const cropType of data.crops) {
        const cropAssociation = cropRepository.create({
          herbicide_id: savedHerbicide.id,
          crop_type: cropType,
          is_primary_crop: true
        });
        await cropRepository.save(cropAssociation);
      }

      // Create brands
      for (const brandData of data.brands) {
        const brand = brandRepository.create({
          herbicide_id: savedHerbicide.id,
          ...brandData
        });
        await brandRepository.save(brand);
      }
    }

    console.log("Herbicide data seeding completed successfully!");
    console.log(`Inserted ${herbicideData.length} herbicides with their brands and crop associations`);

  } catch (error) {
    console.error("Error seeding herbicide data:", error);
    throw error;
  }
};

// Script to run seeder standalone
if (require.main === module) {
  seedHerbicideData()
    .then(() => {
      console.log("Seeding completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = seedHerbicideData;