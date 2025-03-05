const { getRepository } = require("typeorm");
const Farmer = require("../entities/Farmer");

const getFarmers = async (req, res) => {
    const farmerRepository = getRepository(Farmer);
    const { farmer_id } = req.query;
  
    if (farmer_id) {
      const farmer = await farmerRepository.findOne({ where: { farmer_id: farmer_id } });
      if (!farmer) {
        return res.status(404).json({ message: "Farmer not found" });
      }
      return res.json(farmer);
    }
  
    const farmers = await farmerRepository.find();
    res.json(farmers);
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