
const querie=
`CALL apoc.create.node(
  ['Product',$label], 
  {
    id: apoc.create.uuid(),
    subCategory: $subCategory,
    title: $title,
    description: $description,
    image: $image,
    price: $price,
    details: $details,
    listingDate: date()
  }
) YIELD node AS p

WITH p
MATCH (u:User { mobileNo: $mobileNo }) 
MERGE (u)-[r:LISTED]->(p)
SET r.isSold = false
RETURN p
`;

export default querie;


