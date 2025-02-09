//import env
require('dotenv').config();

//import driver for session
const { connectNeo4j }=require('../config/database');

//import bcrypt for password hashing
const bcrypt=require('bcrypt');

//import jwt for token generation
const jwt = require('jsonwebtoken');

// // Import the Neode instance and User model from models.js
// const { neode, User } = require('../Models/userModel');

//connect to the database
let neo4jDriver;
try {
    neo4jDriver = connectNeo4j();//getting driver
} catch (error) {
    console.error("Failed to connect to the Neo4j database:", error.message);
    process.exit(1); // Exit the process if the database connection fails
}



//actual functions
async function getUsers(req,res) {
        const { mobile, password } = req.query;
    
        if (!mobile || !password) {
            return res.status(400).json({ error: "Mobile and password are required" });
        }
        console.log("Mobile:", mobile);
        const session = neo4jDriver.session();
        try{
            //fetch user by mobile no
            const result=await session.run(
                "MATCH (u:user {mobile_no: $mobile}) RETURN u",
                { mobile}
            );
       
        
            if(result.records.length===0){
                return res.status(404).json({error:'user not found from backend'});
            }
            const userNode=result.records[0].get('u');
            const hashedPassword=userNode.properties.password;
            
            // Compare entered password with stored hashed password
            const passwordMatch=await bcrypt.compare(password,hashedPassword);
            
            if(!passwordMatch){
                console.log('wrong password!!');
                return res.status(401).json({error:'Invalid Password'});
            }
                  //generate JWT token
                  const token = jwt.sign(
                    {
                        userId:userNode.identity.low,
                        mobile:userNode.properties.mobile_no,
                        email:userNode.properties.email
                    },
                    process.env.SECRET_KEY,
                    {expiresIn:'1d'}
                );
             
                  //return user data + token (without password for security)
                  const userData={
                    name: userNode.properties.name,
                    mobile:  userNode.properties.mobile,
                    email: userNode.properties.email,
                    token
                  };
                  console.log("User authenticated successfully");
                  res.setHeader("Content-Type", "application/json");
                    return res.status(200).json(userData);
               
            }
            catch(err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
            finally {
               await session.close();  
            }
    }


//post function

    async function registerUsers(req,res) {

             const userName= String(req.body.userName);
             const mobile = String(req.body.mobileNo);
             const email= String(req.body.email);
             const password = String(req.body.password);

             console.log("Received user details:", userName, mobile, email);
             const session = neo4jDriver.session();

             try {
                //check if user already exists
                const existingUser=await session.run(
                    "MATCH (u:user) WHERE u.mobile_no=$mobile RETURN u",
                    {mobile}
                );
                if(existingUser.records.length>0){
                    console.log('user already exists');
                    return res.status(400).json({error:'user already exists'});
                }

                //secure password
                try{
                    hashedPassword=await bcrypt.hash(password,10);
                }
                catch(err){
                    return res.status(500).json({
                        message:'error while hashing password',
                    });
                }
                console.log('hashed password:',hashedPassword);
                //create entry in database
                const result = await session.run(
                    "CREATE (:user {name:$name, mobile_no:$mobile, email:$email, password:$hashedPassword, contacts:[]})",
                          { name: userName, mobile: mobile, email: email, hashedPassword: hashedPassword } // Use `hashedPassword` correctly
                        );
    
        if(result !== undefined){
            console.log("User registered successfully.");
            return res.status(200).json({  //res.end("user register sucessfully from backend");
                message:"user register sucessfully from backend"
            });
        }
        return res.status(500).json({ error: "User registration failed from backend" });
       } catch (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        await session.close();
    }
}


//contact list updation function
async function updateContactsList(req,res){
        const mobile = String(req.body.mobile_no);
        const contacts_list = req.body.contact_list;
        console.log("mobile:",mobile);
        console.log("contact list:",contacts_list);
        const session = neo4jDriver.session();
       
        try{
            const result = await session.run(
                " MATCH (u:user{mobile_no:$mobile }) "+
                "SET u.contacts = $contacts_lst",
                    {mobile:mobile,contacts_lst:contacts_list}
                 );
 
            if(result !== undefined){
                console.log("Contact list updated successfully.");
                await updateRelationship(mobile)
                console.log("result:",result);
                return res.status(200).json({  //res.end("user register sucessfully from backend");
                    message:"contact list updated succefully "
                });
            }
            return res.status(500).json({ error: "Contacts not updated successfully from backend" });
        } catch (err) {
            console.error("Error updating contact list:", err);
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            await session.close();
        }
    }


// function for make has-contact relationship 
 async function updateRelationship(mobile){
      const session = neo4jDriver.session();
      try {
        const result = await session.run(
            "MATCH (u:user {mobile_no : $mobile}) " +
            "UNWIND u.contacts AS contact_number " +
            "MATCH (c:user {mobile_no: contact_number}) " +
            "MERGE (u)-[:HAS_CONTACT]->(c)",
            { mobile }
        );

        if(result !== undefined){
            console.log("Relationships updated successfully.");
        }

    } catch (err) {
        console.error("Error updating relationships:", err);
    } finally {
        await session.close();
    }
}


 module.exports = { getUsers, registerUsers, updateContactsList };
