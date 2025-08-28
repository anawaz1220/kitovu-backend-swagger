const AppDataSource = require("../data-source");
const Farmer = require("../entities/Farmer");
const Farm = require("../entities/Farm");

// Helper function to format state names for display
const formatStateName = (stateName) => {
  if (!stateName) return stateName;
  return stateName.charAt(0).toUpperCase() + stateName.slice(1).toLowerCase();
};

// Helper function to format LGA names for display
const formatLGAName = (lgaValue) => {
  if (!lgaValue) return lgaValue;
  
  // LGA mapping for better display names
  const lgaDisplayNames = {
    'aba_north': 'Aba North',
    'aba_south': 'Aba South',
    'arochukwu': 'Arochukwu',
    'bende': 'Bende',
    'ikwuano': 'Ikwuano',
    'isiala_ngwa_north': 'Isiala-Ngwa North',
    'isiala_ngwa_south': 'Isiala-Ngwa South',
    'isuikwato': 'Isuikwato',
    'obi_nwa': 'Obi Nwa',
    'ohafia': 'Ohafia',
    'umu_neochi': 'Umu-Neochi',
    'osisioma': 'Osisioma',
    'ngwa': 'Ngwa',
    'ugwunagbo': 'Ugwunagbo',
    'ukwa_east': 'Ukwa East',
    'ukwa_west': 'Ukwa West',
    'umuahia_north': 'Umuahia North',
    'umuahia_south': 'Umuahia South'
  };

  return lgaDisplayNames[lgaValue] || lgaValue;
};

// Helper function to format city/ward names for display
const formatCityName = (cityName) => {
  if (!cityName) return cityName;
  
  // Simple title case formatting
  return cityName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to format crop names for display
const formatCropName = (cropName) => {
  if (!cropName) return cropName;
  
  // Simple title case formatting
  return cropName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Get unique states from farmer records
const getStates = async (req, res) => {
  const farmerRepository = AppDataSource.getRepository(Farmer);
  
  try {
    const states = await farmerRepository
      .createQueryBuilder("farmer")
      .select("DISTINCT LOWER(farmer.state)", "state")
      .where("farmer.state IS NOT NULL")
      .andWhere("farmer.state != ''")
      .orderBy("LOWER(farmer.state)", "ASC")
      .getRawMany();

    const formattedStates = states.map(item => ({
      value: item.state,
      label: formatStateName(item.state)
    }));

    res.status(200).json(formattedStates);
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({ 
      message: "Error fetching states", 
      error: error.message 
    });
  }
};

// Get unique LGAs from farmer records
const getLGAs = async (req, res) => {
  const farmerRepository = AppDataSource.getRepository(Farmer);
  const { state } = req.query;
  
  try {
    let query = farmerRepository
      .createQueryBuilder("farmer")
      .select([
        "DISTINCT farmer.lga AS lga",
        "LOWER(farmer.state) AS state"
      ])
      .where("farmer.lga IS NOT NULL")
      .andWhere("farmer.lga != ''");

    // Filter by state if provided
    if (state) {
      query = query.andWhere("LOWER(farmer.state) = LOWER(:state)", { state });
    }

    const lgas = await query
      .orderBy("farmer.lga", "ASC")
      .getRawMany();

    const formattedLGAs = lgas.map(item => ({
      value: item.lga,
      label: formatLGAName(item.lga),
      state: item.state
    }));

    res.status(200).json(formattedLGAs);
  } catch (error) {
    console.error("Error fetching LGAs:", error);
    res.status(500).json({ 
      message: "Error fetching LGAs", 
      error: error.message 
    });
  }
};

// Get unique cities/wards from farmer records
const getCities = async (req, res) => {
  const farmerRepository = AppDataSource.getRepository(Farmer);
  const { state, lga } = req.query;
  
  try {
    let query = farmerRepository
      .createQueryBuilder("farmer")
      .select([
        "DISTINCT farmer.city AS city",
        "LOWER(farmer.state) AS state",
        "farmer.lga AS lga"
      ])
      .where("farmer.city IS NOT NULL")
      .andWhere("farmer.city != ''");

    // Filter by state if provided
    if (state) {
      query = query.andWhere("LOWER(farmer.state) = LOWER(:state)", { state });
    }

    // Filter by LGA if provided
    if (lga) {
      query = query.andWhere("farmer.lga = :lga", { lga });
    }

    const cities = await query
      .orderBy("farmer.city", "ASC")
      .getRawMany();

    const formattedCities = cities.map(item => ({
      value: item.city,
      label: formatCityName(item.city),
      state: item.state,
      lga: item.lga
    }));

    res.status(200).json(formattedCities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ 
      message: "Error fetching cities", 
      error: error.message 
    });
  }
};

// Get unique crops from farm records
const getCrops = async (req, res) => {
  const farmRepository = AppDataSource.getRepository(Farm);
  
  try {
    const crops = await farmRepository
      .createQueryBuilder("farm")
      .select("DISTINCT LOWER(farm.crop_type)", "crop_type")
      .where("farm.crop_type IS NOT NULL")
      .andWhere("farm.crop_type != ''")
      .orderBy("LOWER(farm.crop_type)", "ASC")
      .getRawMany();

    const formattedCrops = crops.map(item => ({
      value: item.crop_type,
      label: formatCropName(item.crop_type)
    }));

    res.status(200).json(formattedCrops);
  } catch (error) {
    console.error("Error fetching crops:", error);
    res.status(500).json({ 
      message: "Error fetching crops", 
      error: error.message 
    });
  }
};

module.exports = {
  getStates,
  getLGAs,
  getCities,
  getCrops
};