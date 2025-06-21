// src/utils/seedPesticideData.js
const XLSX = require('xlsx');
const AppDataSource = require("../data-source");
const Pesticide = require("../entities/Pesticide");
const PesticideBrand = require("../entities/PesticideBrand");
const PesticideCrop = require("../entities/PesticideCrop");
const PesticideTarget = require("../entities/PesticideTarget");
const fs = require('fs');
const path = require('path');

/**
 * Parse Excel file and seed pesticide data into database
 */
async function seedPesticideData() {
  try {
    // Initialize the data source
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("Database connected successfully");

    const pesticideRepository = AppDataSource.getRepository(Pesticide);
    const brandRepository = AppDataSource.getRepository(PesticideBrand);
    const cropRepository = AppDataSource.getRepository(PesticideCrop);
    const targetRepository = AppDataSource.getRepository(PesticideTarget);

    // Read the Excel file - try multiple possible locations
    const possiblePaths = [
      path.join(__dirname, '../../pesticide data base.xlsx'),
      path.join(__dirname, '../../pesticide-data-base.xlsx'),
      path.join(process.cwd(), 'pesticide data base.xlsx'),
      path.join(process.cwd(), 'pesticide-data-base.xlsx')
    ];
    
    let excelPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        excelPath = testPath;
        break;
      }
    }
    
    if (!excelPath) {
      throw new Error(`Excel file not found. Tried locations:\n${possiblePaths.join('\n')}\n\nPlease place 'pesticide data base.xlsx' in the project root directory.`);
    }
    
    console.log(`Using Excel file at: ${excelPath}`);

    const workbook = XLSX.readFile(excelPath);
    console.log("Excel file loaded successfully");
    console.log("Available sheets:", workbook.SheetNames);

    let totalPesticidesCreated = 0;
    let totalBrandsCreated = 0;

    // Process each sheet (crop)
    for (const sheetName of workbook.SheetNames) {
      console.log(`\nProcessing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const cropType = normalizeCropName(sheetName);
      console.log(`Normalized crop type: ${cropType}`);
      
      // Parse pesticides from the sheet
      const pesticidesData = parsePesticidesFromSheet(jsonData, cropType);
      console.log(`Found ${pesticidesData.length} pesticides in ${sheetName} sheet`);
      
      // Create pesticides and brands
      for (const pesticideData of pesticidesData) {
        try {
          // Check if pesticide already exists
          let pesticide = await pesticideRepository.findOne({
            where: { 
              name: pesticideData.name,
              active_ingredient: pesticideData.active_ingredient 
            }
          });

          if (!pesticide) {
            // Create new pesticide
            pesticide = pesticideRepository.create({
              name: pesticideData.name,
              active_ingredient: pesticideData.active_ingredient,
              application_time: pesticideData.application_time,
              target_pests: pesticideData.target_pests,
              growth_stage: pesticideData.growth_stage,
              spectrum_of_control: pesticideData.spectrum_of_control,
              application_method: pesticideData.application_method,
              regions_commonly_used: pesticideData.regions_commonly_used,
              special_notes: pesticideData.special_notes
            });

            await pesticideRepository.save(pesticide);
            totalPesticidesCreated++;
            console.log(`Created pesticide: ${pesticide.name}`);
          }

          // Add crop association
          const existingCrop = await cropRepository.findOne({
            where: {
              pesticide_id: pesticide.id,
              crop_type: cropType
            }
          });

          if (!existingCrop) {
            const pesticideCrop = cropRepository.create({
              pesticide_id: pesticide.id,
              crop_type: cropType,
              is_primary_crop: true
            });
            await cropRepository.save(pesticideCrop);
          }

          // Create brands
          for (const brandData of pesticideData.brands) {
            const existingBrand = await brandRepository.findOne({
              where: {
                pesticide_id: pesticide.id,
                brand_name: brandData.brand_name
              }
            });

            if (!existingBrand) {
              const brand = brandRepository.create({
                pesticide_id: pesticide.id,
                brand_name: brandData.brand_name,
                concentration: brandData.concentration,
                application_rate: brandData.application_rate,
                dilution_rate: brandData.dilution_rate,
                safety_period_before_harvest: brandData.safety_period_before_harvest,
                manufacturer: brandData.manufacturer,
                contraindications: brandData.contraindications,
                is_available: true
              });

              await brandRepository.save(brand);
              totalBrandsCreated++;
            }
          }

          // Create pest targets
          if (pesticideData.target_pests_list) {
            for (const pest of pesticideData.target_pests_list) {
              const existingTarget = await targetRepository.findOne({
                where: {
                  pesticide_id: pesticide.id,
                  target_name: pest
                }
              });

              if (!existingTarget) {
                const target = targetRepository.create({
                  pesticide_id: pesticide.id,
                  target_type: 'pest',
                  target_name: pest,
                  severity_level: 'medium',
                  efficacy_rating: 7
                });
                await targetRepository.save(target);
              }
            }
          }

        } catch (error) {
          console.error(`Error processing pesticide ${pesticideData.name}:`, error.message);
        }
      }
    }

    console.log(`\n=== SEEDING COMPLETE ===`);
    console.log(`Total pesticides created: ${totalPesticidesCreated}`);
    console.log(`Total brands created: ${totalBrandsCreated}`);

    await AppDataSource.destroy();

  } catch (error) {
    console.error("Error seeding pesticide data:", error);
    throw error;
  }
}

/**
 * Parse pesticides data from a sheet
 */
function parsePesticidesFromSheet(jsonData, cropType) {
  const pesticides = [];
  let currentPesticide = null;
  let currentBrands = [];
  let headerRow = null;

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    if (!row || row.length === 0) continue;

    // Check if this is a pesticide name (single cell row)
    if (row.length === 1 && row[0] && typeof row[0] === 'string' && 
        !row[0].includes('/') && !row[0].includes('Parameter')) {
      
      // Save previous pesticide if exists
      if (currentPesticide && currentBrands.length > 0) {
        currentPesticide.brands = currentBrands;
        pesticides.push(currentPesticide);
      }

      // Start new pesticide
      currentPesticide = {
        name: row[0].trim(),
        brands: []
      };
      currentBrands = [];
      headerRow = null;
    }
    // Check if this is a header row
    else if (row[0] && row[0].includes('Parameter')) {
      headerRow = row;
      // Extract brand names from header
      const brandNames = row.slice(1).filter(name => name && name.trim());
      currentBrands = brandNames.map(name => ({
        brand_name: name.trim(),
        concentration: '',
        application_rate: '',
        dilution_rate: '',
        safety_period_before_harvest: '',
        manufacturer: '',
        contraindications: ''
      }));
    }
    // Process data rows
    else if (currentPesticide && headerRow && row[0]) {
      const parameter = row[0].trim();
      const values = row.slice(1);

      // Map parameters to pesticide/brand properties
      switch (parameter) {
        case 'Application Time':
          currentPesticide.application_time = values[0] || '';
          break;
        case 'Target Pests':
          currentPesticide.target_pests = values.join(', ');
          currentPesticide.target_pests_list = extractPestNames(values.join(', '));
          break;
        case 'Active Ingredients':
          currentPesticide.active_ingredient = values[0] || '';
          break;
        case 'Growth Stage':
          currentPesticide.growth_stage = values[0] || '';
          break;
        case 'Spectrum of Control':
          currentPesticide.spectrum_of_control = values[0] || '';
          break;
        case 'Application Method':
          currentPesticide.application_method = values[0] || '';
          break;
        case 'Regions Commonly Used':
          currentPesticide.regions_commonly_used = values[0] || '';
          break;
        case 'Concentration':
          values.forEach((val, idx) => {
            if (currentBrands[idx] && val) {
              currentBrands[idx].concentration = val.toString();
            }
          });
          break;
        case 'Application Rate':
          values.forEach((val, idx) => {
            if (currentBrands[idx] && val) {
              currentBrands[idx].application_rate = val.toString();
            }
          });
          break;
        case 'Dilution Rate':
          values.forEach((val, idx) => {
            if (currentBrands[idx] && val) {
              currentBrands[idx].dilution_rate = val.toString();
            }
          });
          break;
        case 'Safety Period Before Harvest':
          values.forEach((val, idx) => {
            if (currentBrands[idx] && val) {
              currentBrands[idx].safety_period_before_harvest = val.toString();
            }
          });
          break;
        case 'Manufacturer':
          values.forEach((val, idx) => {
            if (currentBrands[idx] && val) {
              currentBrands[idx].manufacturer = val.toString();
            }
          });
          break;
        case 'Contraindications':
          values.forEach((val, idx) => {
            if (currentBrands[idx] && val) {
              currentBrands[idx].contraindications = val.toString();
            }
          });
          break;
      }
    }
  }

  // Don't forget the last pesticide
  if (currentPesticide && currentBrands.length > 0) {
    currentPesticide.brands = currentBrands;
    pesticides.push(currentPesticide);
  }

  return pesticides;
}

/**
 * Extract individual pest names from a comma-separated string
 */
function extractPestNames(pestString) {
  if (!pestString) return [];
  
  return pestString
    .split(/[,;&]/)
    .map(pest => pest.trim())
    .filter(pest => pest.length > 0)
    .slice(0, 10); // Limit to top 10 pests
}

/**
 * Normalize crop names to match our standard format
 */
function normalizeCropName(sheetName) {
  const cropMapping = {
    'maize': 'maize',
    'rice': 'rice', 
    'cowpea': 'legumes',
    'tomatoes': 'tomato',
    'pepper': 'pepper'
  };
  
  return cropMapping[sheetName.toLowerCase()] || sheetName.toLowerCase();
}

// Run the function if this script is executed directly
if (require.main === module) {
  seedPesticideData()
    .then(() => {
      console.log("Pesticide data seeding completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Error seeding pesticide data:", error);
      process.exit(1);
    });
}

module.exports = seedPesticideData;