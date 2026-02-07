const buildQuery = (address) => {
  const parts = [
    address.houseNumber,
    address.building,
    address.street,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    "India",
  ].filter(Boolean);
  return parts.join(", ");
};

const forwardGeocodeAddress = async (address) => {
  const query = encodeURIComponent(buildQuery(address));
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`;
  const response = await fetch(url, { headers: { "User-Agent": "GoldenTriangleFoods/1.0" } });
  if (!response.ok) {
    throw new Error("Geocode API error");
  }
  const data = await response.json();
  if (!data?.length) {
    throw new Error("Geocode not found");
  }
  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("Invalid geocode");
  }
  return { lat, lng };
};

module.exports = {
  forwardGeocodeAddress,
};
