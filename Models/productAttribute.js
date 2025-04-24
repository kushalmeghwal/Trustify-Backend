export const generalAttributes = [
  "mobileNo", "label","subCategory", "title", "description", "image", "price", 
];

export const categoryAttributes = {
  Car: ["brand", "purchasedYear", "fuelType", "transmission", "kmDriven", "owner"],
  Bike: ["brand", "purchasedYear", "fuelType", "kmDriven", "owner"],
  Cycle: ["brand", "purchasedYear"],//hasGear add
  Mobile: ["brand", "purchasedYear", "ram", "storage"],
  Laptop: ["brand", "ram", "storage", "processor"],
  Furniture: ["furnitureType", "material","condition"]
};


