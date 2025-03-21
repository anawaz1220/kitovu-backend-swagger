const { getRepository } = require("typeorm");
const Farmer = require("../entities/Farmer");
const FarmerAffiliation = require("../entities/FarmerAffiliation");

const getFarmers = async (req, res) => {
  const farmerRepository = getRepository(Farmer);
  const farmerAffiliationRepository = getRepository(FarmerAffiliation);
  const { farmer_id } = req.query;

  try {
    if (farmer_id) {
      // Get the basic farmer data
      const farmer = await farmerRepository.findOne({ where: { farmer_id: farmer_id } });
      if (!farmer) {
        return res.status(404).json({ message: "Farmer not found" });
      }
      
      // Get the affiliation data using the farmer_id field (not the primary key)
      const affiliation = await farmerAffiliationRepository.findOne({ 
        where: { farmer_id: farmer.farmer_id }
      });
      
      // Combine farmer data with affiliation data
      const farmerWithAffiliation = {
        ...farmer,
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
      // Look up affiliation using the farmer_id field (not the primary key)
      const affiliation = affiliationMap[farmer.farmer_id];
      
      return {
        ...farmer,
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
  const farmerRepository = getRepository(Farmer);

  // Construct the image URLs
  const farmerPictureUrl = req.files["farmer_picture"]
    ? `/images/${req.files["farmer_picture"][0].filename}`
    : null;
  const idDocumentPictureUrl = req.files["id_document_picture"]
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
};

const updateFarmer = async (req, res) => {
  const farmerRepository = getRepository(Farmer);
  const farmer = await farmerRepository.findOne(req.params.id);
  if (!farmer) return res.status(404).json({ message: "Farmer not found" });

  // Update image URLs if new files are uploaded
  if (req.files["farmer_picture"]) {
    farmer.farmer_picture = `/images/${req.files["farmer_picture"][0].filename}`;
  }
  if (req.files["id_document_picture"]) {
    farmer.id_document_picture = `/images/${req.files["id_document_picture"][0].filename}`;
  }

  farmerRepository.merge(farmer, req.body);
  await farmerRepository.save(farmer);
  res.json(farmer);
};

const deleteFarmer = async (req, res) => {
  const farmerRepository = getRepository(Farmer);
  const result = await farmerRepository.delete(req.params.id);
  if (!result.affected) return res.status(404).json({ message: "Farmer not found" });
  res.status(204).send();
};

module.exports = { getFarmers, createFarmer, updateFarmer, deleteFarmer };