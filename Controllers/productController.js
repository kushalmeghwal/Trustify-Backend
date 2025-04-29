
import neo4jDriver from '../config/database.js';
import pQuery from '../Models/productQuery.js';
import { createAndDispatchNotifications } from './notificationController.js'
import { generalAttributes, categoryAttributes } from '../Models/productAttribute.js';


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
    console.log('req received');
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
        if (result.records.length === 0) {
            return res.status(500).json({ error: 'Failed to add product, no data returned' });
        }

        const record = result.records[0];

        if (!record) {
            return res.status(500).json({ error: 'Product creation failed, no product node returned' });
        }

        const product = record.get('p').properties;
        console.log('Product:', product);
        console.log(record);
        const sellerName = record.get('sellerName')
        console.log(sellerName)

        await createAndDispatchNotifications({
            senderId: req.body.id,
            productId: product.id,
            title:'New Product added',
            message: `your friend ${sellerName} has listed new product`,
            io: req.app.get('io'),
        });

        return res.status(201).json({ success: true, });
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
            products: record.get("Products").map(product => ({
                id: product.properties.id, // Assuming identity has a low value as the product ID
                title: product.properties.title,
                description: product.properties.description,
                listingDate: product.properties.listingDate,
                category: product.properties.subCategory,
                price: parseInt(product.properties.price), // Converting price to integer
                image: product.properties.image || [],// Assuming it's an array of image URLs
                details: JSON.parse(product.properties.details),
            }))
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error retrieving products:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (session) await session.close();
    }
}
export async function getProductById(req, res) {
    console.log('req received');

    let session;
    try {
        session = neo4jDriver.session();
        const result = await session.run(
            `
            MATCH (s:User)-[:LISTED]->(p:Product {id: $productId})
            RETURN s.name AS contactName,
                   s.MobileNo AS contactMobile,
                   p AS product
            `,
            { productId: req.query.productId }
        );
        const record = result.records[0];

        if (!record) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const data = {
            contactName: record.get("contactName"),
            contactMobile: record.get("contactMobile"),
            products: [
                {
                    id: record.get("product").properties.id,
                    title: record.get("product").properties.title,
                    description: record.get("product").properties.description,
                    listingDate: record.get("product").properties.listingDate,
                    category: record.get("product").properties.subCategory,
                    price: parseInt(record.get("product").properties.price),
                    image: record.get("product").properties.image || [],
                    details: JSON.parse(record.get("product").properties.details),
                }
            ]
        };
        console.log(data);

        return res.status(200).json({ success: true, data: [data] });
    } catch (error) {
        console.error('Error retrieving products:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (session) await session.close();
    }
}

export async function verifyProduct(req, res) {
    console.log('req received')
    let session;
    try {
        const { userId, productId } = req.query;


        session = neo4jDriver.session();
        const result = await session.run(
            `MATCH (u:User {id: $userId})
            MATCH (p:Product {id: $productId})
            MERGE (u)-[r:HAS_VERIFIED]->(p)
            RETURN u.name AS verifiedBy, p;
            `,
            { userId, productId });
        if (result.records.length === 0) {
            return res.status(500).json({ error: 'Failed to verify product, no data returned' });
        }

        const record = result.records[0];

        if (!record) {
            return res.status(500).json({ error: 'failed in verify product server error' });
        }

        const product = record.get('p').properties;
        console.log('Product:', product);
        const verifiedBy = record.get('verifiedBy')

        await createAndDispatchNotifications({
            senderId: req.query.userId,
            productId: product.id,
            title:'Verified Product',
            message: `your Friend ${verifiedBy} verify an product tap to See `,
            io: req.app.get('io'),
        });

        return res.status(200).json({ success: true, product });
    } catch (error) {
        console.error('Error while adding product:', error);
        return res.status(500).json({ error: 'Internal server error, please try again' });
    } finally {
        if (session) await session.close();
    }
}