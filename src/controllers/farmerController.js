const AppDataSource = require("../data-source");
const Farmer = require("../entities/Farmer");
const FarmerAffiliation = require("../entities/FarmerAffiliation");

const getFarmers = async (req, res) => {
    try {
      const farmerRepository = AppDataSource.getRepository(Farmer);
      const farmerAffiliationRepository = AppDataSource.getRepository(FarmerAffiliation);
      const { farmer_id } = req.query;
  
      if (farmer_id) {
        // Get the basic farmer data
        const farmer = await farmerRepository.findOne({ where: { farmer_id: farmer_id } });
        if (!farmer) {
          return res.status(404).json({ message: "Farmer not found" });
        }
        
        // Get the affiliation data
        const affiliation = await farmerAffiliationRepository.findOne({ 
          where: { farmer_id: farmer.farmer_id } 
        });
        
        // Combine farmer data with affiliation data
        const farmerWithAffiliation = {
          ...farmer,
          ward: farmer.city, 
          city: undefined,  
          member_of_cooperative: affiliation ? affiliation.member_of_cooperative : null,
          cooperative_name: affiliation ? affiliation.name : null,
          cooperative_activities: affiliation ? affiliation.activities : null
        };
        
        return res.json(farmerWithAffiliation);
      }
    
      // Get all farmers
      const farmers = await farmerRepository.find();
      
      // Get all affiliations
      const affiliations = await farmerAffiliationRepository.find();
      
      // Create a map of farmer_id to affiliation for quick lookup
      const affiliationMap = {};
      affiliations.forEach(affiliation => {
        affiliationMap[affiliation.farmer_id] = affiliation;
      });

      // Combine farmer data with affiliation data
      const farmersWithAffiliations = farmers.map(farmer => {
        const affiliation = affiliationMap[farmer.farmer_id]; 
        return {
          ...farmer,
          ward: farmer.city, 
          city: undefined,  
          member_of_cooperative: affiliation ? affiliation.member_of_cooperative : null,
          cooperative_name: affiliation ? affiliation.name : null,
          cooperative_activities: affiliation ? affiliation.activities : null
        };
      });
      
      res.json(farmersWithAffiliations);
    } catch (error) {
      console.error("Error fetching farmers:", error);
      res.status(500).json({ message: "Error fetching farmers", error: error.message });
    }
};

const createFarmer = async (req, res) => {
  try {
    const farmerRepository = AppDataSource.getRepository(Farmer);

    // Construct the image URLs
    const farmerPictureUrl = req.files && req.files["farmer_picture"]
      ? `/images/${req.files["farmer_picture"][0].filename}`
      : null;
    const idDocumentPictureUrl = req.files && req.files["id_document_picture"]
      ? `/images/${req.files["id_document_picture"][0].filename}`
      : null;

    const farmerData = {
      ...req.body,
      farmer_picture: farmerPictureUrl,
      id_document_picture: idDocumentPictureUrl,
    };

    const farmer = farmerRepository.create(farmerData);
    await farmerRepository.save(farmer);
    res.status(201).json(farmer);
  } catch (error) {
    console.error("Error creating farmer:", error);
    res.status(500).json({ message: "Error creating farmer", error: error.message });
  }
};

const updateFarmer = async (req, res) => {
  try {
    const farmerRepository = AppDataSource.getRepository(Farmer);
    const farmer = await farmerRepository.findOne({ where: { id: req.params.id }});
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    // Update image URLs if new files are uploaded
    if (req.files && req.files["farmer_picture"]) {
      farmer.farmer_picture = `/images/${req.files["farmer_picture"][0].filename}`;
    }
    if (req.files && req.files["id_document_picture"]) {
      farmer.id_document_picture = `/images/${req.files["id_document_picture"][0].filename}`;
    }

    farmerRepository.merge(farmer, req.body);
    await farmerRepository.save(farmer);
    res.json(farmer);
  } catch (error) {
    console.error("Error updating farmer:", error);
    res.status(500).json({ message: "Error updating farmer", error: error.message });
  }
};

const deleteFarmer = async (req, res) => {
  try {
    const farmerRepository = AppDataSource.getRepository(Farmer);
    const result = await farmerRepository.delete(req.params.id);
    if (!result.affected) return res.status(404).json({ message: "Farmer not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting farmer:", error);
    res.status(500).json({ message: "Error deleting farmer", error: error.message });
  }
};

module.exports = { getFarmers, createFarmer, updateFarmer, deleteFarmer };