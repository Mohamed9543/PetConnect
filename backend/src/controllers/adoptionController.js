const asyncHandler = require("express-async-handler");
const AdoptionRequest = require("../models/AdoptionRequest");
const Animal = require("../models/Animal");
const { notifyUser } = require("../utils/notify");

const createAdoptionRequest = asyncHandler(async (req, res) => {
  const { animalId, message } = req.body;

  const animal = await Animal.findById(animalId);
  if (!animal) {
    res.status(404);
    throw new Error("Animal introuvable");
  }
  if (animal.owner.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Vous ne pouvez pas adopter votre propre annonce");
  }

  const existing = await AdoptionRequest.findOne({
    animal: animal._id,
    requester: req.user._id,
    status: { $in: ["pending", "accepted"] },
  });
  if (existing) {
    res.status(409);
    throw new Error(
      existing.status === "accepted"
        ? "Votre demande d'adoption pour cet animal a déjà été acceptée."
        : "Vous avez déjà une demande en attente pour cet animal."
    );
  }

  let request;
  try {
    request = await AdoptionRequest.create({
      animal: animal._id,
      requester: req.user._id,
      owner: animal.owner,
      message,
    });
  } catch (error) {
    // Race condition (e.g. double tap): the pre-check above passed but a
    // concurrent request landed first. The partial unique index on the
    // model rejects this at the database level with code 11000.
    if (error.code === 11000) {
      res.status(409);
      throw new Error("Vous avez déjà une demande en cours pour cet animal.");
    }
    throw error;
  }

  res.status(201).json(request);

  notifyUser(animal.owner, {
    type: "adoption_status",
    title: "Nouvelle demande d'adoption",
    body: `${req.user.firstName} souhaite adopter ${animal.name}.`,
    data: { adoptionRequestId: request._id.toString(), animalId: animal._id.toString() },
  }).catch((error) => console.error("Notify (new adoption request) failed:", error.message));
});

const getMyAdoptionRequests = asyncHandler(async (req, res) => {
  const requests = await AdoptionRequest.find({
    $or: [{ requester: req.user._id }, { owner: req.user._id }],
  })
    .populate("animal")
    .populate("requester", "firstName lastName avatar")
    .populate("owner", "firstName lastName avatar")
    .sort({ createdAt: -1 });

  res.json(requests);
});

const updateAdoptionRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await AdoptionRequest.findById(req.params.id).populate("animal", "name");
  if (!request) {
    res.status(404);
    throw new Error("Demande introuvable");
  }
  if (request.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Action non autorisée");
  }

  request.status = status;
  await request.save();

  if (status === "accepted") {
    await Animal.findByIdAndUpdate(request.animal._id, { status: "pending" });
  }

  res.json(request);

  notifyUser(request.requester, {
    type: "adoption_status",
    title: status === "accepted" ? "Demande acceptée 🎉" : "Demande refusée",
    body:
      status === "accepted"
        ? `Votre demande d'adoption pour ${request.animal.name} a été acceptée !`
        : `Votre demande d'adoption pour ${request.animal.name} a été refusée.`,
    data: { adoptionRequestId: request._id.toString(), status },
  }).catch((error) => console.error("Notify (adoption status) failed:", error.message));
});

module.exports = { createAdoptionRequest, getMyAdoptionRequests, updateAdoptionRequest };
