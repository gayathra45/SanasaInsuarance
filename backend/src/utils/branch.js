/**
 * Determines the nearest branch name based on a city or location string.
 * @param {string} location - The city or location name.
 * @returns {string} The matched branch name (Galle, Matara, Colombo, Anuradhapura, or Embilipitiya).
 */
export function getNearestBranch(location = "") {
  const cleanLocation = location.trim().toLowerCase();

  const keywords = [
    { name: "Galle", keys: ["galle", "hambantota"] },
    { name: "Matara", keys: ["matara"] },
    { name: "Colombo", keys: ["colombo", "gampaha", "kalutara"] },
    { name: "Anuradhapura", keys: ["anuradhapura", "polonnaruwa"] },
    { name: "Embilipitiya", keys: ["embilipitiya", "ratnapura"] }
  ];

  let bestBranch = "Galle";
  let maxIndex = -1;

  for (const b of keywords) {
    for (const key of b.keys) {
      const idx = cleanLocation.lastIndexOf(key);
      if (idx > maxIndex) {
        maxIndex = idx;
        bestBranch = b.name;
      }
    }
  }

  return bestBranch;
}
