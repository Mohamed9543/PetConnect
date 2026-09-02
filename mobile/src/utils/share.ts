import { Share } from "react-native";
import type { Animal, Report } from "../types";

const typeLabel: Record<string, string> = { dog: "chien", cat: "chat", other: "animal" };

export async function shareAnimal(animal: Animal) {
  const city = animal.location?.city ? ` à ${animal.location.city}` : "";
  const message = `🐾 ${animal.name} — ${typeLabel[animal.type]} de ${animal.age} an(s) à adopter${city} sur PetConnect.`;
  try {
    await Share.share({ message });
  } catch {
    // user cancelled the native share sheet — nothing to handle
  }
}

export async function shareReport(report: Report) {
  const kind = report.type === "lost" ? "perdu" : "trouvé";
  const place = report.location?.address ? ` près de ${report.location.address}` : "";
  const message = `🚨 Animal ${kind} (réf. ${report.reference})${place}. Signalement PetConnect — ${report.description || "voir les détails dans l'app"}.`;
  try {
    await Share.share({ message });
  } catch {
    // user cancelled the native share sheet — nothing to handle
  }
}
