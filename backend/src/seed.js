// Fills the database with sample data (adoption animals + lost/found reports,
// each with real photo URLs) so the mobile app has something to show while
// testing. Safe to re-run: it wipes only the records it owns (via the seed
// user) before recreating them, so it never touches real user data.
require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const Animal = require("./models/Animal");
const Report = require("./models/Report");
const { generateReference } = require("./utils/reference");

const SEED_EMAIL = "seed@petconnect.local";

// Tunis-area coordinates with small offsets so pins don't all stack.
const TUNIS = { latitude: 36.8065, longitude: 10.1815 };
function near(offsetLat, offsetLng) {
  return { latitude: TUNIS.latitude + offsetLat, longitude: TUNIS.longitude + offsetLng };
}

const dogPhoto = (id) => `https://placedog.net/640/480?id=${id}`;
const catPhoto = (seed) => `https://cataas.com/cat?width=640&height=480&seed=${seed}`;

const animalsToSeed = [
  {
    name: "Rex",
    type: "dog",
    breed: "Berger allemand",
    gender: "male",
    age: 2,
    ageCategory: "adult",
    color: "Noir et feu",
    description: "Rex est un chien joueur et affectueux, très obéissant. Il s'entend bien avec les enfants et les autres chiens.",
    images: [dogPhoto(1), dogPhoto(2)],
    location: { ...near(0.01, 0.01), city: "Tunis" },
    vaccinated: true,
    status: "available",
  },
  {
    name: "Minou",
    type: "cat",
    breed: "Européen",
    gender: "female",
    age: 1,
    ageCategory: "young",
    color: "Gris tigré",
    description: "Minou est une chatte calme et câline, idéale pour un appartement. Déjà stérilisée et vaccinée.",
    images: [catPhoto("minou1"), catPhoto("minou2")],
    location: { ...near(-0.008, 0.015), city: "Ariana" },
    vaccinated: true,
    status: "available",
  },
  {
    name: "Bella",
    type: "dog",
    breed: "Labrador",
    gender: "female",
    age: 0.5,
    ageCategory: "baby",
    color: "Doré",
    description: "Bella est une chiot pleine d'énergie, en cours de sociabilisation. Elle cherche une famille active.",
    images: [dogPhoto(3)],
    location: { ...near(0.02, -0.01), city: "La Marsa" },
    vaccinated: false,
    status: "available",
  },
  {
    name: "Simba",
    type: "cat",
    breed: "Persan",
    gender: "male",
    age: 3,
    ageCategory: "adult",
    color: "Roux",
    description: "Simba est un chat tranquille qui aime dormir au soleil. Habitué à vivre avec d'autres animaux.",
    images: [catPhoto("simba1")],
    location: { ...near(-0.015, -0.02), city: "Ben Arous" },
    vaccinated: true,
    status: "pending",
  },
];

const reportsToSeed = [
  {
    type: "lost",
    animalName: "Max",
    animalType: "dog",
    breed: "Husky",
    color: "Blanc et gris",
    gender: "male",
    description: "Max s'est échappé du jardin pendant l'orage. Il porte un collier rouge avec une médaille.",
    images: [dogPhoto(4), dogPhoto(5)],
    location: { ...near(0.005, 0.005), address: "Avenue Habib Bourguiba, Tunis" },
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    contact: "+216 29 210 727",
  },
  {
    type: "lost",
    animalName: "Luna",
    animalType: "cat",
    breed: "Siamois",
    color: "Beige et brun",
    gender: "female",
    description: "Luna a disparu près du marché central, elle est très craintive avec les inconnus.",
    images: [catPhoto("luna1")],
    location: { ...near(-0.01, 0.008), address: "Marché central, Tunis" },
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    contact: "+216 22 345 678",
  },
  {
    type: "found",
    animalName: "",
    animalType: "dog",
    breed: "Croisé",
    color: "Marron",
    gender: "unknown",
    description: "Trouvé errant près du parc du Belvédère, semble amical, pas de collier ni de puce visible.",
    images: [dogPhoto(6)],
    location: { ...near(0.012, -0.015), address: "Parc du Belvédère, Tunis" },
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    contact: "+216 24 555 111",
  },
  {
    type: "found",
    animalName: "",
    animalType: "cat",
    breed: "Inconnu",
    color: "Noir",
    gender: "unknown",
    description: "Chaton trouvé seul près d'une station-service, très jeune, a besoin de soins rapides.",
    images: [catPhoto("found1"), catPhoto("found2")],
    location: { ...near(-0.02, 0.01), address: "La Goulette" },
    date: new Date(Date.now() - 1000 * 60 * 60 * 12),
    contact: "+216 20 999 222",
  },
];

async function run() {
  await connectDB();

  let seedUser = await User.findOne({ email: SEED_EMAIL });
  if (!seedUser) {
    seedUser = await User.create({
      firstName: "Seed",
      lastName: "PetConnect",
      email: SEED_EMAIL,
      password: "seedpassword123",
      city: "Tunis",
      role: "user",
      verified: true,
    });
    console.log("Created seed user:", SEED_EMAIL);
  }

  await Animal.deleteMany({ owner: seedUser._id });
  await Report.deleteMany({ user: seedUser._id });

  const animals = await Animal.insertMany(
    animalsToSeed.map((animal) => ({ ...animal, owner: seedUser._id }))
  );
  console.log(`Inserted ${animals.length} animals (adoption).`);

  const reports = await Report.insertMany(
    reportsToSeed.map((report) => ({
      ...report,
      reference: generateReference(report.type === "lost" ? "PRD" : "TRV"),
      user: seedUser._id,
      statusHistory: [{ status: "active" }],
    }))
  );
  console.log(`Inserted ${reports.length} reports (${reports.filter((r) => r.type === "lost").length} lost, ${reports.filter((r) => r.type === "found").length} found).`);

  console.log("Seed complete.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
