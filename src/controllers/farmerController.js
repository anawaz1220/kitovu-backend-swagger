// Update to farmerController.js
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
        cooperative_activities: affiliation ? affiliation.activities : null,
        // New affiliation fields
        marketing_channel: affiliation ? affiliation.marketing_channel : null,
        offtaker_name: affiliation ? affiliation.offtaker_name : null
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
        cooperative_activities: affiliation ? affiliation.activities : null,
        // New affiliation fields
        marketing_channel: affiliation ? affiliation.marketing_channel : null,
        offtaker_name: affiliation ? affiliation.offtaker_name : null
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

    // Handle boolean fields
    const farmerData = {
      ...req.body,
      farmer_picture: farmerPictureUrl,
      id_document_picture: idDocumentPictureUrl,
      // Convert string boolean values to actual booleans
      agricultural_training: req.body.agricultural_training === 'true',
      certificate_issued: req.body.certificate_issued === 'true',
      received_financing: req.body.received_financing === 'true',
      // Convert numeric fields from string
      finance_amount: req.body.finance_amount ? parseFloat(req.body.finance_amount) : null,
      interest_rate: req.body.interest_rate ? parseFloat(req.body.interest_rate) : null,
      financing_duration_years: req.body.financing_duration_years ? parseInt(req.body.financing_duration_years) : null,
      financing_duration_months: req.body.financing_duration_months ? parseInt(req.body.financing_duration_months) : null,
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

    // Handle boolean and numeric fields
    const updateData = { ...req.body };
    
    // Convert boolean fields
    if (updateData.agricultural_training !== undefined) {
      updateData.agricultural_training = updateData.agricultural_training === 'true';
    }
    if (updateData.certificate_issued !== undefined) {
      updateData.certificate_issued = updateData.certificate_issued === 'true';
    }
    if (updateData.received_financing !== undefined) {
      updateData.received_financing = updateData.received_financing === 'true';
    }
    
    // Convert numeric fields
    if (updateData.finance_amount !== undefined) {
      updateData.finance_amount = updateData.finance_amount ? parseFloat(updateData.finance_amount) : null;
    }
    if (updateData.interest_rate !== undefined) {
      updateData.interest_rate = updateData.interest_rate ? parseFloat(updateData.interest_rate) : null;
    }
    if (updateData.financing_duration_years !== undefined) {
      updateData.financing_duration_years = updateData.financing_duration_years ? parseInt(updateData.financing_duration_years) : null;
    }
    if (updateData.financing_duration_months !== undefined) {
      updateData.financing_duration_months = updateData.financing_duration_months ? parseInt(updateData.financing_duration_months) : null;
    }

    farmerRepository.merge(farmer, updateData);
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