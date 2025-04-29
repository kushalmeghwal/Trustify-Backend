import  neo4jDriver  from '../config/database.js';
import pQuery from '../Models/productQuery.js';
import { generalAttributes, categoryAttributes } from '../Models/productAttribute.js';
import { verifyToken } from '../Middlewares/auth.js';
import jwt from 'jsonwebtoken';


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
            products: record.get("Products").map(product => ({
              id: product.identity.low, // Assuming identity has a low value as the product ID
              title: product.properties.title, 
              description: product.properties.description,
              listingDate: product.properties.listingDate,
              category: product.properties.subCategory,
              price: parseInt(product.properties.price), // Converting price to integer
              image: product.properties.image || [],// Assuming it's an array of image URLs
              details:JSON.parse(product.properties.details), 
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

export async function getUserProducts(req, res) {
    const { userId } = req.params;
    let session;
    
    try {
        // Verify authentication token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication token is required' 
            });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        
        if (!decoded || decoded.id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'You are not authorized to view these products' 
            });
        }
        
        session = neo4jDriver.session();
        const query = `
            MATCH (u:User {id: $userId})
            MATCH (u)-[:LISTED]->(p:Product)
            RETURN p
            ORDER BY p.listingDate DESC
        `;
        
        const result = await session.run(query, { userId });
        const products = result.records.map(record => {
            const product = record.get("p").properties;
            return {
                id: record.get("p").identity.low,
                title: product.title,
                description: product.description,
                listingDate: product.listingDate,
                category: product.subCategory,
                price: parseInt(product.price),
                image: product.image || [],
                details: JSON.parse(product.details),
                status: product.status || 'Available',
                sellerName: product.sellerName || 'Unknown',
                sellerId: userId
            };
        });

        return res.status(200).json(products);
    } catch (error) {
        console.error('Error retrieving user products:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    } finally {
        if (session) await session.close();
    }
}

export async function verifyProduct(req, res) {
    const { productId, userId } = req.body;

    if (!productId || !userId) {
        return res.status(400).json({
            success: false,
            message: "Product ID and User ID are required"
        });
    }

    const session = neo4jDriver.session();
    try {
        // First verify if the product exists and belongs to the user
        const productResult = await session.run(
            `MATCH (u:User {userId: $userId})-[:LISTED]->(p:Product {productId: $productId})
             RETURN p`,
            { userId, productId }
        );

        if (productResult.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found or doesn't belong to the user"
            });
        }

        // Update the product verification status
        const result = await session.run(
            `MATCH (p:Product {productId: $productId})
             SET p.isVerified = true,
                 p.verifiedAt = datetime()
             RETURN p`,
            { productId }
        );

        if (result.records.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Product verified successfully",
                data: result.records[0].get('p').properties
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to verify product"
        });
    } catch (err) {
        console.error("Error verifying product:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        await session.close();
    }
}
