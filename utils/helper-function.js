
// function for recalculating total price of cart

const calculateCartTotal = (items) => {
  return items.reduce(
    (sum, item) => sum + item.priceSnapshot * item.quantity,
    0
  );
};


module.exports = { calculateCartTotal };