

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
        const { mobile, password } = req.query;
    
        if (!mobile || !password) {
            return res.status(400).json({ error: "Mobile and password are required" });
        }
        console.log("Mobile:", mobile);
        const session = neo4jDriver.session();
        try{
            //fetch user by mobile no
            const result=await session.run(
                "MATCH (u:User {mobile_no: $mobile}) RETURN u",
                { mobile}
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
                        mobile_no:userNode.properties.mobile_no,
                        email:userNode.properties.email,
                        img_url:userNode.properties.profile_img
                    },
                    process.env.SECRET_KEY,
                    {expiresIn:'1d'}
                );
                console.log(userNode.properties.profile_img);
             
                  
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

        const { userName, mobileNo: mobile, email, password, img_url } = req.body;



             console.log("Received user details:", userName, mobile, email);
             const session = neo4jDriver.session();

             try {
                //check if user already exists
                const existingUser=await session.run(
                    "MATCH (u:User) WHERE u.mobile_no=$mobile RETURN u",
                    {mobile}
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
                console.log('hashed password:',hashedPassword);
                //register user
                const result = await session.run(
                    "CREATE (:User{uid:apoc.create.uuid(),name:$name, mobile_no:$mobile, email:$email, password:$hashedPassword,profile_img:$img_url, contacts:[]})",
                          { name: userName, mobile: mobile, email: email, hashedPassword: hashedPassword ,img_url:img_url} 
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
    const {mobile,contacts_list} = req.body;
        console.log("mobile:",mobile);
        console.log("contact list:",contacts_list);
        const session = neo4jDriver.session();
       
        try{
            const result = await session.run(
                " MATCH (u:User{mobile_no:$mobile }) "+
                "SET u.contacts = $contacts_lst",
                    {mobile:mobile,contacts_lst:contacts_list}
                 );
 
            if(result !== undefined){
                console.log("Contact list updated successfully.");
                await updateRelationship(mobile)
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
 async function updateRelationship(mobile){
      const session = neo4jDriver.session();
      try {
        const result = await session.run(
            "MATCH (u:User {mobile_no : $mobile}) " +
            "UNWIND u.contacts AS contact_number " +
            "MATCH (c:User {mobile_no: contact_number}) " +
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