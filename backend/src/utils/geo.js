// Haversine distance in kilometers between two lat/lng points.
function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Coarsens coordinates to ~100m precision so a report's exact location (which
// can reveal a home address) is never exposed as-is to other users — only to
// the report's own author, who sees the untouched document from the DB.
function fuzzCoordinates(latitude, longitude) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return { latitude, longitude };
  }
  return {
    latitude: Math.round(latitude * 1000) / 1000,
    longitude: Math.round(longitude * 1000) / 1000,
  };
}

function toPublicReport(reportDoc, viewerId) {
  const report = reportDoc.toObject ? reportDoc.toObject() : { ...reportDoc };
  const isOwner = viewerId && report.user && report.user._id
    ? String(report.user._id) === String(viewerId)
    : viewerId && String(report.user) === String(viewerId);

  if (!isOwner) {
    report.location = { ...report.location, ...fuzzCoordinates(report.location.latitude, report.location.longitude) };
  }
  return report;
}

module.exports = { distanceKm, fuzzCoordinates, toPublicReport };
