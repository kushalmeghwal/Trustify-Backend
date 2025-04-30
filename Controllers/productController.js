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
            title: 'New Product added',
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
    console.log(mobileNo);
    let session;
    try {
        session = neo4jDriver.session();
        const query = `
           MATCH (u:User {mobileNo:$mobileNo})
      MATCH (u)-[:HAS_CONTACT]->(contact:User)-[:HAS_CONTACT]->(u)


      OPTIONAL MATCH (contact)-[r1:LISTED]->(p1:Product)  WHERE r1.isSold = false
      OPTIONAL MATCH (contact)-[:HAS_VERIFIED]->(p2:Product)<-[r2:LISTED]-(sellerName:User) WHERE r2.isSold = false AND sellerName <> u


      WITH
        COLLECT(DISTINCT { product: p2, seller: sellerName.name, verifiedBy: contact.name }) + 
        COLLECT(DISTINCT { product: p1, seller: contact.name, verifiedBy: NULL }) AS Products

      UNWIND Products AS p
      RETURN p.product AS product, p.verifiedBy AS verifiedBy, p.seller AS seller

        `;
        const result = await session.run(query, { mobileNo });
        const products = [];
        const seenIds = new Set();

        result.records.forEach(record => {
            const productNode = record.get("product");
            const verifiedBy = record.get("verifiedBy");
            const seller = record.get("seller");

            if (productNode) {
                const productId = productNode.properties.id;

                if (!seenIds.has(productId)) {
                    seenIds.add(productId);

                    products.push({
                        id: productId,
                        title: productNode.properties.title,
                        description: productNode.properties.description,
                        listingDate: `${productNode.properties.listingDate.year.low}-${productNode.properties.listingDate.month.low}-${productNode.properties.listingDate.day.low}`,
                        category: productNode.properties.subCategory,
                        price: parseInt(productNode.properties.price),
                        details: JSON.parse(productNode.properties.details),
                        image: productNode.properties.image || [],
                        verifiedBy: verifiedBy || null,
                        seller: seller || null
                    });
                }
            }
        });


        if (products.length > 0) {
            res.status(200).json({ success: true, products });
        } else {
            res.status(404).json({ success: false, message: "No products found" });
        }

    } catch (error) {
        console.error('Error retrieving products:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    } finally {
        if (session) {
            await session.close();
        }
    }
}
export async function getProductById(req, res) {
    console.log('req received');

    let session;
    try {
        session = neo4jDriver.session();
        const result = await session.run(
            `
                MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:HAS_CONTACT]->(contact:User)-[:HAS_CONTACT]->(u)
        OPTIONAL MATCH (u)-[:LISTED]->(pSelf:Product)
          WHERE pSelf.id = $productId 

        OPTIONAL MATCH (u)-[:HAS_VERIFIED]->(pselfVerified:Product)<-[:LISTED]-(contact)
          WHERE pselfVerified.id = $productId 

        OPTIONAL MATCH (contact)-[:LISTED]->(pContact:Product)
          WHERE pContact.id = $productId 

            OPTIONAL MATCH (contact)-[:HAS_VERIFIED]->(pVerified:Product)<-[:LISTED]-(seller:User)
            WHERE pVerified.id = $productId 
            WITH 
            COLLECT(DISTINCT { product: pSelf, seller: u.name,sellerId: u.id, verifiedBy: NULL,verifierId:NULL }) +
            COLLECT(DISTINCT { product: pselfVerified, seller: contact.name,sellerId: contact.id, verifiedBy: u.name , verifierId : u.id}) +
            COLLECT(DISTINCT { product: pContact, seller: contact.name,sellerId: contact.id, verifiedBy: NULL,verifierId:NULL }) +
            COLLECT(DISTINCT { product: pVerified, seller: seller.name,sellerId: seller.id, verifiedBy: contact.name ,verifierId : contact.id}) AS Products

            UNWIND Products AS p
            WITH p
            WHERE p.product IS NOT NULL
            RETURN p.product AS product, p.seller AS seller, p.verifiedBy AS verifiedBy,p.verifierId AS verifierId,p.sellerId as sellerId
            LIMIT 1

            `,
            { productId: req.query.productId, userId: req.query.userId }
        );
        const record = result.records[0];

        if (!record) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const product =
        {
            id: record.get("product").properties.id,
            title: record.get("product").properties.title,
            description: record.get("product").properties.description,
            listingDate: record.get("product").properties.listingDate,
            category: record.get("product").properties.subCategory,
            price: parseInt(record.get("product").properties.price),
            image: record.get("product").properties.image || [],
            details: JSON.parse(record.get("product").properties.details),
            seller: record.get('seller') || null,
            verifiedBy: record.get('verifiedBy') || null,
            verifierId: record.get('verifierId') || null,
            sellerId: record.get('sellerId'),
        };



        return res.status(200).json({ success: true, product });
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
            title: 'Verified Product',
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
export async function getMyProducts(req, res) {
    console.log('req received');

    let session;
    try {
        session = neo4jDriver.session();
        const result = await session.run(
            `
            MATCH (s:User {id: $userId})-[:LISTED]->(p:Product)
            RETURN p AS product
            `,
            { userId: req.query.userId }
        );


        if (!result) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const records = result.records;

        const products = [];

        result.records.forEach(record => {
            const productNode = record.get("product");

            if (productNode) {
                const props = productNode.properties;
                products.push({
                    id: props.id,
                    title: props.title,
                    description: props.description,
                    listingDate: props.listingDate,
                    category: props.subCategory,
                    price: parseInt(props.price),
                    details: JSON.parse(props.details),
                    image: props.image || [],
                });
            }
        });



        return res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error retrieving products:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (session) await session.close();
    }
}