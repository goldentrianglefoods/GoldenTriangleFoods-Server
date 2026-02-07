const parseCoord = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const RESTAURANT_COORDS = {
  lat: parseCoord(process.env.RESTAURANT_LAT, 28.648209),
  lng: parseCoord(process.env.RESTAURANT_LNG, 77.506562),
};

const toRad = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getDistanceKmFromApi = async (lat, lng) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_COORDS.lng},${RESTAURANT_COORDS.lat};${lng},${lat}?overview=false`;
  console.log('OSRM API URL:', url);
  const response = await fetch(url, { headers: { "User-Agent": "GoldenTriangleFoods/1.0" } });
  if (!response.ok) {
    console.error('OSRM API response not ok:', response.status, response.statusText);
    throw new Error("Distance API error");
  }
  const data = await response.json();
  console.log('OSRM API response:', JSON.stringify(data, null, 2));
  const meters = data?.routes?.[0]?.distance;
  if (!meters && meters !== 0) {
    console.error('Distance not found in OSRM response');
    throw new Error("Distance not found");
  }
  const km = meters / 1000;
  console.log(`OSRM Distance: ${km.toFixed(2)} km`);
  return km;
};

const calculateDeliveryFee = async (lat, lng, orderAmount = 0) => {
  console.log('calculateDeliveryFee called with lat:', lat, 'lng:', lng, 'orderAmount:', orderAmount, 'restaurant:', RESTAURANT_COORDS);
  if (lat == null || lng == null) {
    console.log('Lat/lng is null, returning default fee 49');
    return 49;
  }
  let distanceKm = 0;
  try {
    distanceKm = await getDistanceKmFromApi(lat, lng);
    console.log('Using OSRM distance:', distanceKm, 'km');
  } catch (error) {
    console.log('OSRM failed, using Haversine fallback:', error.message);
    distanceKm = calculateDistanceKm(lat, lng, RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng);
    console.log('Haversine distance:', distanceKm, 'km');
  }
  
  // For orders ₹1000 and above: free up to 4km, then ₹10/km
  if (orderAmount >= 1000) {
    if (distanceKm <= 4) {
      console.log('Order >= ₹1000 and distance <= 4km, free delivery');
      return 0;
    }
    const extraKm = Math.ceil(distanceKm - 4);
    const fee = extraKm * 10;
    console.log(`Order >= ₹1000, distance ${distanceKm.toFixed(2)} km, extraKm: ${extraKm}, fee: ₹${fee}`);
    return fee;
  }
  
  // For regular orders: free up to 1.5km, then ₹10/km
  if (distanceKm <= 1.5) {
    console.log('Distance <= 1.5km, free delivery');
    return 0;
  }
  const extraKm = Math.ceil(distanceKm - 1.5);
  const fee = extraKm * 10;
  console.log(`Distance ${distanceKm.toFixed(2)} km, extraKm: ${extraKm}, fee: ₹${fee}`);
  return fee;
};

module.exports = {
  RESTAURANT_COORDS,
  calculateDistanceKm,
  calculateDeliveryFee,
  getDistanceKmFromApi,
};
