const carQuery = `
    CREATE (p:Product {
        pid: apoc.create.uuid(),
        category: 'Car',
        brand: $brand,
        year_of_purchase: $year,
        fuel_type: $fuel_type,
        transmission: $transmission,
        km_driven: $km_driven,
        owner: $owner,
        price: $price,
        p_title: $ad_title,
        p_description: $additional_information,
        p_img: $img_urls,
        date_added: date()
    })
    WITH p
    MATCH (u:User{
        mobile_no: $mobile_no
    }) 
    MERGE (u)-[:LISTED]->(p)
    RETURN p 
`;
const bikeQuery = `
    CREATE (p:Product {
        pid: apoc.create.uuid(),
        category: 'Bike',
        brand: $brand,
        year_of_purchase: $year,
        fuel_type: $fuel_type,
        km_driven: $km_driven,
        owner: $owner,
        price: $price,
        p_title: $ad_title,
        p_description: $additional_information,
        p_img: $img_urls,
        date_added: date()
    })
    WITH p
    MATCH (u:User{
        mobile_no: $mobile_no
    }) 
    MERGE (u)-[:LISTED]->(p)
    RETURN p
`;

const cycleQuery = `
    CREATE (p:Product {
        pid: apoc.create.uuid(),
        category: 'Cycle',
        brand: $brand,
        year_of_purchase: $year,
        price: $price,
        p_title: $ad_title,
        p_description: $additional_information,
        p_img: $img_urls,
        date_added: date()
    })
    WITH p
    MATCH (u:User{
        mobile_no: $mobile_no
    }) 
    MERGE (u)-[:LISTED]->(p)
    RETURN p
`;

const mobileQuery = `
    CREATE (p:Product {
        pid: apoc.create.uuid(),
        category: 'Mobile',
        brand: $brand,
        year_of_purchase: $year,
        ram: $ram,
        storage: $storage,
        price: $price,
        p_title: $ad_title,
        p_description: $additional_information,
        p_img: $img_urls,
        date_added: date()
    })
    WITH p
    MATCH (u:User{
        mobile_no: $mobile_no
    }) 
    MERGE (u)-[:LISTED]->(p)
    RETURN p
`;
const laptopQuery = `
    CREATE (p:Product {
        pid: apoc.create.uuid(),
        category: 'Laptop',
        brand: $brand,
        year_of_purchase: $year,
        ram: $ram,
        storage: $storage,
        processor: $processor,
        price: $price,
        p_title: $ad_title,
        p_description: $additional_information,
        p_img: $img_urls,
        date_added: date()
    }) 
    WITH p
    MATCH (u:User{
        mobile_no: $mobile_no
    }) 
    MERGE (u)-[:LISTED]->(p)
    RETURN p
`;
const furnitureQuery = `
    CREATE (p:Product {
        pid: apoc.create.uuid(),
        category: 'Furniture',
        furniture_type: $furniture_type,
        material: $material,
        condition: $condition,
        price: $price,
        p_title: $ad_title,
        p_description: $additional_information,
        p_img: $img_urls,
        date_added: date()
    }) 
    WITH p
    MATCH (u:User{
        mobile_no: $mobile_no
    }) 
    MERGE (u)-[:LISTED]->(p)
    RETURN p
`;


module.exports = {
    Car: carQuery,
    Bike: bikeQuery,
    Mobile: mobileQuery,
    Laptop: laptopQuery,
    Furniture: furnitureQuery,
    Cycle: cycleQuery
};