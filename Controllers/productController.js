
import { connectNeo4j } from '../config/database.js';
import pQuery from '../Models/productQuery.js';
import { generalAttributes, categoryAttributes } from '../Models/productAttribute.js';

let neo4jDriver;
try {
    neo4jDriver = connectNeo4j();
} catch (error) {
    console.error("Failed to connect Neo4j");
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
            missingFields.push(field);
        }
    });

    categoryAttributes[category].forEach(field => {
        if (req.body[field] === undefined) {
            missingFields.push(field);
        }
    });

    return missingFields.length > 0
        ? { isValid: false, missingFields }
        : { isValid: true };
}

export async function addProduct(req, res) {
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
        const result = await session.run(pQuery, queryParams);
        const product = result.records[0].get('p').properties;

        return res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('Error while adding product:', error);
        return res.status(500).json({ error: 'Internal server error, please try again' });
    } finally {
        if (session) await session.close();
    }
}

export async function getProduct(req, res) {
    const { mobileNo } = req.query;
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
            products: record.get("Products")
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error retrieving products:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (session) await session.close();
    }
}
