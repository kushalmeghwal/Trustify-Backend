const { connectNeo4j } = require('../config/database');
const pQuery = require('../Models/productQueryModel');
const pSchema = require('../Models/productAttributeModel');
let neo4jDriver;
try {
    neo4jDriver = connectNeo4j();
} catch (error) {
    console.error("falied to connect neo4j");
    process.exit(1);
}
//add product
const addProductCar = async (req, res) => {
    console.log("req received");
    let session;
    try {
        const { category } = req.body;
        console.log(category);
        console.log(req.body.mobile_no)
        if (!pSchema[category]) {
            return res.status(400).json({ error: "Invalid category" });
        }

        const allowedAttributes = pSchema[category];
        let pData = {};

        for (let key of allowedAttributes) {
            if (req.body[key] !== undefined) {
                pData[key] = req.body[key];
            } else {
                console.log("something is missing");
                return res.status(400).json({ error: 'fill requeired(* marked) fields' });
            }
        }

        // const { brand, year, fuel_type, transmission, km_driven, owner, ad_title, additional_information, price, img_urls } = req.body;
        // console.log(req.body);
        // if (!brand || !year || !fuel_type || !transmission || !km_driven || !ad_title || !price || !owner || !img_urls) {
        //     console.log("something is missing");
        //     return res.status(400).json({ error: 'fill requeired(* marked) fields' });
        // }
        session = neo4jDriver.session();
        const query = pQuery[category];
        const result = await session.run(query, pData)
        const product = result.records[0].get('p').properties;
        console.log(product);
        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('error while adding product ', error);
        res.status(500).json({ error: 'internal server error please try again' })

    } finally {
        //await session.close();
        // await neo4jDriver.close();
    }
}
//get product
const getProduct = async (req, res) => {
    console.log("req received");

    const { mobile_no } = req.query;
    console.log(mobile_no);
    let session;
    //with optional (u)-[:has-verified]->(p);
    try {
        session = neo4jDriver.session();
        const query = `
        MATCH (u:User {mobile_no:$mobile_no})
        MATCH (u)-[:HAS_CONTACT]->(contacts)
        MATCH (contacts)-[:HAS_CONTACT]->(u) 
        MATCH (contacts)-[:LISTED]->(p1:Product)
        MATCH (u)-[:HAS_VERIFIED]->(p2:Product)
        RETURN contacts.name AS ContactName, 
        contacts.mobile_no AS ContactMobile,
        COLLECT(DISTINCT p1) + COLLECT(DISTINCT p2) AS Products;
     `;
        const result = await session.run(query, { mobile_no });
        const data = result.records.map(record => ({
            contactName: record.get("ContactName"),
            contactMobile: record.get("ContactMobile"),
            products: record.get("Products") // This will be an array of product nodes
        }));
        console.log(data[0]);
        console.log(data[1]);

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        // await session.close();
        // await neo4jDriver.close();
    }
}
module.exports = { getProduct, addProductCar };