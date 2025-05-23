// Update to farmerAffiliationController.js
const AppDataSource = require("../data-source");
const FarmerAffiliation = require("../entities/FarmerAffiliation");
const Farmer = require("../entities/Farmer");

const getDistinctCooperativeNames = async (req, res) => {
  const farmerAffiliationRepository = AppDataSource.getRepository(FarmerAffiliation);

  try {
    const names = await farmerAffiliationRepository
      .createQueryBuilder("farmer_affiliation")
      .select("DISTINCT(farmer_affiliation.name)", "name")
      .where("farmer_affiliation.member_of_cooperative = :isMember", {
        isMember: true,
      })
      .getRawMany();

    res.json(names);
  } catch (error) {
    console.error("Error fetching distinct cooperative names:", error);
    res.status(500).json({ message: "Error fetching distinct cooperative names.", error: error.message });
  }
};

const updateFarmerAffiliation = async (req, res) => {
  const farmerAffiliationRepository = AppDataSource.getRepository(FarmerAffiliation);
  const { farmer_id, member_of_cooperative, name, activities, marketing_channel, offtaker_name } = req.body;
  const created_by = req.user.username || req.user.email;
  const farmerRepository = AppDataSource.getRepository(Farmer);

  try {
    const farmer = await farmerRepository.findOne({ where: { farmer_id: farmer_id } });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer does not exist." });
    }
      
    // Check if the farmer affiliation already exists
    let farmerAffiliation = await farmerAffiliationRepository.findOne({
      where: { farmer_id },
    });

    if (!farmerAffiliation) {
      // If it doesn't exist, create a new affiliation
      farmerAffiliation = farmerAffiliationRepository.create({
        farmer_id,
        member_of_cooperative,
        name,
        activities,
        created_by,
        // New fields
        marketing_channel,
        offtaker_name,
      });
    } else {
      // If it exists, update the affiliation
      farmerAffiliation.member_of_cooperative = member_of_cooperative;
      farmerAffiliation.name = name;
      farmerAffiliation.activities = activities;
      farmerAffiliation.created_by = created_by;
      // New fields
      farmerAffiliation.marketing_channel = marketing_channel;
      farmerAffiliation.offtaker_name = offtaker_name;
    }

    // Save the affiliation
    await farmerAffiliationRepository.save(farmerAffiliation);

    res.status(200).json(farmerAffiliation); // Return the updated or created affiliation
  } catch (error) {
    console.error("Error updating farmer affiliation:", error);
    res.status(500).json({ message: "Error updating farmer affiliation.", error: error.message });
  }
};

module.exports = { getDistinctCooperativeNames, updateFarmerAffiliation };