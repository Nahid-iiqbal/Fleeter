# BD Address

This package provides a set of functions to retrieve information about divisions, districts, upazillas, unions, and post codes in Bangladesh.

## Installation

To use this project, you need to have Node.js installed. Then, you can install from [npm](https://www.npmjs.com/) or clone the repository.

```bash
npm install bd-address
git clone https://github.com/syedshaon/bd-address
```

## Usage

You can import the BdAddress class and other functions from "bd-address" or index.js and use their methods to get the required data.

## Example

```
import BdAddress, { bdUnions, bdUnionByUpazilla, bdPostCodes } from "bd-address";

// Get all divisions
const allDivisions = BdAddress.divisions();
console.log('All Divisions:', allDivisions);

// Get all districts
const allDistricts = BdAddress.districts();
console.log('All Districts:', allDistricts);

// Get districts by division id
const divisionId = '1'; // Example division id
const districtsByDivision = BdAddress.district(divisionId);
console.log(`Districts in Division ${divisionId}:`, districtsByDivision);

// Get all upazillas
const allUpazillas = BdAddress.upazillas();
console.log('All Upazillas:', allUpazillas);

// Get upazillas by district id
const districtId = '1'; // Example district id
const upazillasByDistrict = BdAddress.upazilla(districtId);
console.log(`Upazillas in District ${districtId}:`, upazillasByDistrict);

// Get all unions
const allUnions = bdUnions();
console.log('All Unions:', allUnions);

// Get unions by upazilla id
const upazillaId = '1'; // Example upazilla id
const unionsByUpazilla = bdUnionByUpazilla(upazillaId);
console.log(`Unions in Upazilla ${upazillaId}:`, unionsByUpazilla);

// Get all post codes
const allPostCodes = bdPostCodes();
console.log('All Post Codes:', allPostCodes);
```

## Methods

### BdAddress Class

- BdAddress.divisions(): Returns all divisions.
- BdAddress.districts(): Returns all districts.
- BdAddress.district(id): Returns districts filtered by the given division id. If no id is provided, it returns a message asking for a division id.
- BdAddress.upazillas(): Returns all upazillas.
- BdAddress.upazilla(id): Returns upazillas filtered by the given district id. If no id is provided, it returns a message asking for a district id.

### Functions

- bdUnions(): Returns all unions.
- bdUnionByUpazilla(id): Returns unions filtered by the given upazilla id. If no id is provided, it returns a message asking for an upazilla id.
- bdPostCodes(): Returns all post codes.

## Example Data Structure

Division

```[
  {
    id: "1",
    name: "Chattagram",
    bn_name: "চট্টগ্রাম",
    url: "www.chittagongdiv.gov.bd"
  },
  ...
]
```

District

```
[
  {
    id: "1",
    division_id: "1",
    name: "Comilla",
    bn_name: "কুমিল্লা",
    lat: "23.4682747",
    lon: "91.1788135",
    url: "www.comilla.gov.bd"
  },
  ...
]
```

Upazilla

```
[
  {
    id: "1",
    district_id: "1",
    name: "Debidwar",
    bn_name: "দেবিদ্বার",
    url: "debidwar.comilla.gov.bd"
  },
  ...
]
```

Union

```
[
  {
    "id":"1",
    "upazilla_id":"1",
    "name":"Subil",
    "bn_name":"সুবিল",
    "url":"subilup.comilla.gov.bd"
  },
  ...
]
```

Post Codes

```
{
  "1206 ": {
    en: {
      division: "Dhaka",
      district: "Dhaka ",
      thana: "Dhaka ",
      suboffice: "Dhaka Cantonment--TSO ",
      postcode: "1206 ",
    },
    bn: {
      division: "ঢাকা",
      district: "ঢাকা ",
      thana: "ঢাকা সেনানিবাস ",
      suboffice: "ঢাকা সেনানিবাস TSO ",
      postcode: "১২০৬ ",
    },
  },
}
```

License
This project is licensed under the MIT License.
