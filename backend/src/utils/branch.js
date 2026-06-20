export function getNearestBranch(location = "") {
  const cleanLocation = location.trim().toLowerCase();

  if (cleanLocation.includes("galle") || cleanLocation.includes("hambantota")) {
    return "Galle";
  }
  if (cleanLocation.includes("matara")) {
    return "Matara";
  }
  if (cleanLocation.includes("colombo") || cleanLocation.includes("gampaha") || cleanLocation.includes("kalutara")) {
    return "Colombo";
  }
  if (cleanLocation.includes("anuradhapura") || cleanLocation.includes("polonnaruwa")) {
    return "Anuradhapura";
  }
  if (cleanLocation.includes("embilipitiya") || cleanLocation.includes("ratnapura")) {
    return "Embilipitiya";
  }
  return "Galle";
}
