import divisions from "./assets/divisions.js";
import districts from "./assets/districts.js";
import upazillas from "./assets/upazillas.js";
import unions from "./assets/unions.js";
import postCodes from "./assets/postCodes.js";

class BdAddress {
  static divisions() {
    return divisions;
  }

  static districts() {
    return districts;
  }

  static district(id) {
    if (!id) {
      return { message: "Plese insert a division id as params." };
    }
    return this.districts().filter((district) => district.division_id === id.toString());
  }

  static upazillas() {
    return upazillas;
  }

  static upazilla(id) {
    if (!id) {
      return { message: "Plese insert a district id as params." };
    }
    return this.upazillas().filter((upazilla) => upazilla.district_id === id.toString());
  }
}

function bdUnions() {
  return unions;
}

function bdUnionByUpazilla(id) {
  if (!id) {
    return { message: "Plese insert a upazilla id as params." };
  }
  return bdUnions().filter((union) => union.upazilla_id === id.toString());
}

function bdPostCodes() {
  return postCodes;
}

export default BdAddress;

export { bdUnions, bdUnionByUpazilla, bdPostCodes };
