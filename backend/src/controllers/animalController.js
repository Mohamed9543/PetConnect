const asyncHandler = require("express-async-handler");
const Animal = require("../models/Animal");
const { uploadImages } = require("../utils/uploadToCloudinary");
const { distanceKm, fuzzCoordinates } = require("../utils/geo");

function toPublicAnimal(animalDoc) {
  const animal = animalDoc.toObject ? animalDoc.toObject() : { ...animalDoc };
  if (animal.location?.latitude && animal.location?.longitude) {
    animal.location = { ...animal.location, ...fuzzCoordinates(animal.location.latitude, animal.location.longitude) };
  }
  return animal;
}

const getAnimals = asyncHandler(async (req, res) => {
  const { type, gender, ageCategory, breed, city, status, lat, lng, radiusKm } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (gender) filter.gender = gender;
  if (ageCategory) filter.ageCategory = ageCategory;
  if (breed) filter.breed = { $regex: breed, $options: "i" };
  if (city) filter["location.city"] = { $regex: `^${city}$`, $options: "i" };
  filter.status = status || "available";

  let animals = await Animal.find(filter)
    .populate("owner", "firstName lastName avatar rating role verified")
    .sort({ createdAt: -1 });

  if (lat && lng && radiusKm) {
    const originLat = Number(lat);
    const originLng = Number(lng);
    const radius = Number(radiusKm);
    animals = animals.filter((animal) => {
      if (!animal.location?.latitude || !animal.location?.longitude) return false;
      return distanceKm(originLat, originLng, animal.location.latitude, animal.location.longitude) <= radius;
    });
  }

  res.json(animals.map(toPublicAnimal));
});

const getMyAnimals = asyncHandler(async (req, res) => {
  const animals = await Animal.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(animals);
});

const getAnimalById = asyncHandler(async (req, res) => {
  const animal = await Animal.findById(req.params.id).populate(
    "owner",
    "firstName lastName avatar rating phone role verified organizationName"
  );
  if (!animal) {
    res.status(404);
    throw new Error("Animal introuvable");
  }
  res.json(toPublicAnimal(animal));
});

const createAnimal = asyncHandler(async (req, res) => {
  const { name, type, breed, gender, age, ageCategory, color, description, vaccinated, latitude, longitude, city } = req.body;

  const images = await uploadImages(req.files, "petconnect/animals");

  const animal = await Animal.create({
    name,
    type,
    breed,
    gender,
    age,
    ageCategory,
    color,
    description,
    vaccinated: vaccinated === "true" || vaccinated === true,
    images,
    location: { latitude, longitude, city },
    owner: req.user._id,
  });

  res.status(201).json(animal);
});

const updateAnimal = asyncHandler(async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) {
    res.status(404);
    throw new Error("Animal introuvable");
  }
  if (animal.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Action non autorisée");
  }

  const fields = ["name", "type", "breed", "gender", "age", "ageCategory", "color", "description", "vaccinated", "status"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) animal[field] = req.body[field];
  });

  if (req.body.latitude) animal.location.latitude = req.body.latitude;
  if (req.body.longitude) animal.location.longitude = req.body.longitude;
  if (req.body.city) animal.location.city = req.body.city;

  if (req.files && req.files.length > 0) {
    const newImages = await uploadImages(req.files, "petconnect/animals");
    animal.images = [...animal.images, ...newImages];
  }

  await animal.save();
  res.json(animal);
});

const removeAnimalImage = asyncHandler(async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) {
    res.status(404);
    throw new Error("Animal introuvable");
  }
  if (animal.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Action non autorisée");
  }
  animal.images = animal.images.filter((url) => url !== req.body.imageUrl);
  await animal.save();
  res.json(animal);
});

const deleteAnimal = asyncHandler(async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) {
    res.status(404);
    throw new Error("Animal introuvable");
  }
  if (animal.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Action non autorisée");
  }
  await animal.deleteOne();
  res.json({ message: "Annonce supprimée" });
});

module.exports = {
  getAnimals,
  getMyAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  removeAnimalImage,
  deleteAnimal,
};
