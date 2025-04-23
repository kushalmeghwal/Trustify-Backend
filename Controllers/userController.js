

//import driver for session
const { connectNeo4j }=require('../config/database');

//import bcrypt for password hashing
const bcrypt=require('bcrypt');

//import jwt for token generation
const jwt = require('jsonwebtoken');


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
        const { mobileNo, password } = req.body;
    
        if (!mobileNo || !password) {
            return res.status(400).json({ error: "Mobile and password are required" });
        }
        console.log("Mobile:", mobileNo);
        const session = neo4jDriver.session();
        try{
            //fetch user by mobile no
            const result=await session.run(
                "MATCH (u:User {mobileNo: $mobileNo}) RETURN u",
                { mobileNo}
            );
       
        
            if(result.records.length===0){
                return res.status(404).json({'status':false,error:'user not found from backend'});
            }
            const userNode=result.records[0].get('u');
            const hashedPassword=userNode.properties.password;
            
            // Compare entered password with stored hashed password
            const passwordMatch=await bcrypt.compare(password,hashedPassword);
            
            if(!passwordMatch){
                console.log('wrong password!!');
                return res.status(401).json({'status':false,error:'Invalid Password'});
            }
            
                  //generate JWT token
                  const token = jwt.sign(
                    {
                        name:userNode.properties.name,
                        mobileNo:userNode.properties.mobileNo,
                        email:userNode.properties.email,
                        profileImg:userNode.properties.profileImg
                    },
                    process.env.SECRET_KEY,
                    {expiresIn:'1d'}
                );
             
                  
                  console.log("User authenticated successfully");
                  res.setHeader("Content-Type", "application/json");
                    return res.status(200).json({'status':true,'token':token});
               
            }
            catch(err) {
                console.error("Database error:", err);
                return res.status(500).json({ 'status':false,error: "Internal server error" });
            }
            finally {
               await session.close();  
            }
    }


//post function

    async function registerUsers(req,res) {

        const { name, mobileNo, email, password, profileImg } = req.body;



             const session = neo4jDriver.session();

             try {
                //check if user already exists
                const existingUser=await session.run(
                    "MATCH (u:User) WHERE u.mobileNo=$mobileNo RETURN u",
                    {mobileNo}
                );
                if(existingUser.records.length>0){
                    console.log('user already exists');
                    return res.status(400).json({error:'user already exists'});
                }

                //Hashing the password
                try{
                    hashedPassword=await bcrypt.hash(password,10);
                }
                catch(err){
                    return res.status(500).json({
                        message:'error while hashing password',
                    });
                }
                const result = await session.run(
                    "CREATE (:User{id:apoc.create.uuid(),name:$name, mobileNo:$mobileNo, email:$email, password:$hashedPassword,profileImg:$profileImg, location:'India',trustScore:2, contacts:[],createdAt: date()})",
                          {name, mobileNo, email, hashedPassword ,profileImg} 
                        );
    
        if(result !== undefined){
            console.log("User registered successfully.");
            return res.status(200).json({  
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
    const {mobileNo,contacts} = req.body;
        console.log("mobile:",mobileNo);
        console.log("contact list:",contacts);
        const session = neo4jDriver.session();
       
        try{
            const result = await session.run(
                " MATCH (u:User{mobileNo:$mobileNo }) "+
                "SET u.contacts = $contacts",
                    {mobileNo,contacts}
                 );
 
            if(result !== undefined){
                console.log("Contact list updated successfully.");
                await updateRelationship(mobileNo)
                console.log("result:",result);
                return res.status(200).json({ 
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
 async function updateRelationship(mobileNo){
      const session = neo4jDriver.session();
      try {
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) " +
            "UNWIND u.contacts AS contactNumber " +
            "MATCH (c:User {mobileNo: contactNumber}) " +
            "MERGE (u)-[:HAS_CONTACT]->(c) " +  
            "WITH u, c " +  
            "WHERE u.mobileNo IN c.contacts " + 
            "MERGE (c)-[:HAS_CONTACT]->(u) " +
            "RETURN u, c",  
            { mobileNo }
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