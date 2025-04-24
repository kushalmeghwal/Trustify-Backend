
import { neo4jDriver } from "../config/database.js"; // Use the shared driver

import {pQuery} from '../Models/productQueryModel.js';
import {pSchema} from '../Models/productAttributeModel.js';

//add product
const addProductCar = async (req, res) => {
    console.log("req received",req.body);
    let session;
    try {
        const { category }=req.body;
        if (!pSchema[category]) {
            return res.status(400).json({ error: "Invalid category" });
        }

        const allowedAttributes = pSchema[category];
        let pData = {};

        for (let key of allowedAttributes) {
            if (req.body[key] !== undefined) {
                pData[key] = req.body[key];
            }else{
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
        const result = await session.run(query,pData)
        const product = result.records[0].get('p').properties;
        console.log(product);
        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('error while adding product ', error);
        res.status(500).json({ error: 'internal server error please try again' })

    } finally {
        await session.close();
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
        MATCH (u:User {mobile_no: $mobile_no})
        MATCH (u)-[:HAS_CONTACT]->(contacts)
        MATCH (contacts)-[:HAS_CONTACT]->(u) 
        OPTIONAL MATCH (contacts)-[:LISTED]->(p1:Product)
        OPTIONAL MATCH (u)-[:HAS_VERIFIED]->(p2:Product)
        WITH contacts, 
        contacts.name AS ContactName, 
        contacts.mobile_no AS ContactMobile, 
        COLLECT(DISTINCT p1) AS Products1, 
        COLLECT(DISTINCT p2) AS Products2
        RETURN ContactName, 
             ContactMobile, 
             apoc.coll.union(coalesce(Products1, []), coalesce(Products2, [])) AS Products;
 
      `;
        const result = await session.run(query, { mobile_no });
        const data = result.records.map(record => ({
            contactName: record.get("ContactName"),
            contactMobile: record.get("ContactMobile"),
            products: record.get("Products") // This will be an array of product nodes
        }));
        console.log(data)
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await session.close();
    }
}


const verifyProduct=async (req, res) =>{
    const { mobile_no } = req.body;  
    //find out where to get product id
    const { p_id } = req.params;     

    if (!mobile_no || !p_id) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    const session = neo4jDriver.session();
    try {
        // Step 1: Build 'VERIFIED_BY' relationship (A -> P)
        await session.run(
            "MATCH (a:User {mobile_no: $mobile_no}), (p:Product {id: $p_id}) " +
            "MERGE (a)-[:VERIFIED_BY]->(p)"+
            "RETURN a,p",
            { mobile_no, p_id }
        );

        // Step 2: Find all users in bidirectional 'HAS_CONTACT' relationship with A
        const result = await session.run(
            "MATCH (a:User {mobile_no: $mobile_no})-[:HAS_CONTACT]-(u:User) " +
            "MATCH (p:Product {id: $p_id})<-[:IS_LISTED]-(owner:User) " +
            "WHERE u <> owner " +  // Exclude the product owner
            "MERGE (u)-[:CAN_SEE]->(p)",
            { mobile_no, p_id }
        );

        return res.status(200).json({ message: "Product verified successfully" });

    } catch (error) {
        console.error("Error verifying product:", error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        await session.close();
    }
}

export { getProduct, addProductCar,verifyProduct };