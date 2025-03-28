

//import driver for session
import { neo4jDriver } from "../config/database.js"; // Use the shared driver

//import bcrypt for password hashing
import bcrypt from 'bcrypt';

//import jwt for token generation
import jwt from 'jsonwebtoken';
const { sign } = jwt;


//login user 
async function loginUser(req,res) {
        const { mobile, password } = req.body;
    
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
                  const token = sign(
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


//register function

    async function registerUser(req,res) {

        const { userName, mobileNo: mobile, email, password, img_url } = req.body;



             console.log("Received user details:", userName, mobile, email,password);
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
                let hashedPassword;
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
                    "CREATE (:User{uid:apoc.create.uuid(),name:$name, mobile_no:$mobile, email:$email, password:$hashedPassword,profile_img:$img_url, location:'India',trust_score:2, contacts:[]})",
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
    const {mobile_no,contacts_list} = req.body;
        console.log("mobile:",mobile_no);
        console.log("contact list:",contacts_list);
        const session = neo4jDriver.session();
        
        try{
            const contactsArray = Array.isArray(contacts_list) ? contacts_list : [];
            const result = await session.run(
                " MATCH (u:User{mobile_no:$mobile_no }) "+
                "SET u.contacts = $contacts_lst",
                    {mobile_no:mobile_no,contacts_lst:contactsArray}
                 );
 
            if(result !== undefined){
                console.log("Contact list updated successfully.");
                if (contactsArray.length > 0) {
                    await updateRelationship(mobile_no);
                }
           
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
            "MATCH (u:User {mobile_no: $mobile}) " +
            "UNWIND u.contacts AS contact_number " +
            "MATCH (c:User {mobile_no: contact_number}) " +
            "MERGE (u)-[:HAS_CONTACT]->(c) " +  
            "WITH u, c " +  
            "WHERE u.mobile_no IN c.contacts " + 
            "MERGE (c)-[:HAS_CONTACT]->(u) " +
            "RETURN u, c",  
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


 export { loginUser, registerUser, updateContactsList };
 