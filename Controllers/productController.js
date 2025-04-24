const { connectNeo4j } = require('../config/database');
const pQuery = require('../Models/productQuery');
const {generalAttributes,  categoryAttributes} = require('../Models/productAttribute');
let neo4jDriver;
try {
    neo4jDriver = connectNeo4j();
} catch (error) {
    console.error("falied to connect neo4j");
    process.exit(1);
}
function prepareProductData(req, category) {
    const queryParams = {};
    const details = {};

    generalAttributes.forEach(field => {
        if (req.body[field] !== undefined) {
            queryParams[field] = req.body[field];
        }
    });

    categoryAttributes[category].forEach(field => {
        if (req.body[field] !== undefined) {
            details[field] = req.body[field];
        }
    });

    queryParams.details = JSON.stringify(details);

    return queryParams;
}

function validateProductData(req, category) {
    const missingFields = [];

    generalAttributes.forEach(field => {
        if (req.body[field] === undefined) {
            console.log(`missing field ${field}`)
            missingFields.push(field);
        }
    });

    categoryAttributes[category].forEach(field => {
        if (req.body[field] === undefined) {
            missingFields.push(field);
        }
    });

    if (missingFields.length > 0) {
        return { isValid: false, missingFields };
    }

    return { isValid: true };
}

const addProduct = async (req, res) => {
    let session;
    try {
        const { subCategory } = req.body;
        if (!categoryAttributes[subCategory]) {
            return res.status(400).json({ error: "Invalid category" });
        }

        const validation = validateProductData(req, subCategory);

        if (!validation.isValid) {

            return res.status(400).json({
                error: `Missing required fields: ${validation.missingFields.join(', ')}`
            });
        }

        const queryParams = prepareProductData(req, subCategory);

        session = neo4jDriver.session();
        const query = pQuery;
        const result = await session.run(query, queryParams);
        console.log(result)
        const product = result.records[0].get('p').properties;

        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('Error while adding product: ', error);
        res.status(500).json({ error: 'Internal server error, please try again' });
    } finally {
        if (session) {
            await session.close();
        }
    }
};
//get product
const getProduct = async (req, res) => {
    console.log("req received");

    const { mobileNo } = req.query;
    console.log(mobileNo);
    let session;
    try {
        session = neo4jDriver.session();
        const query = `
       MATCH (u:User {mobileNo: $mobileNo})
       MATCH (u)-[:HAS_CONTACT]->(contacts)
       MATCH (contacts)-[:HAS_CONTACT]->(u) 
       OPTIONAL MATCH (contacts)-[:LISTED]->(p1:Product)
       OPTIONAL MATCH (contacts)-[:HAS_VERIFIED]->(p2:Product)
       WITH contacts, 
       contacts.name AS ContactName, 
       contacts.mobileNo AS ContactMobile, 
       COLLECT(DISTINCT p1) AS Products1, 
       COLLECT(DISTINCT p2) AS Products2
       RETURN ContactName, 
            ContactMobile, 
            apoc.coll.union(coalesce(Products1, []), coalesce(Products2, [])) AS Products;

     `;
        const result = await session.run(query, { mobileNo });
        const data = result.records.map(record => ({
            contactName: record.get("ContactName"),
            contactMobile: record.get("ContactMobile"),
            products: record.get("Products") // This will be an array of product nodes
        }));
        console.log(data);

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        // await session.close();
    }
}
module.exports = { getProduct, addProduct };