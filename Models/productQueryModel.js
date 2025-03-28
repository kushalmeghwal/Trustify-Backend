const pQuery = {
    Car: `
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
        RETURN p
    `,
    Bike: `
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
        RETURN p
    `,
    Cycle: `
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
        RETURN p
    `,
    Mobile: `
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
        RETURN p
    `,
    Laptop: `
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
        RETURN p
    `,
    Furniture: `
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
        RETURN p
    `
};

export { pQuery };
