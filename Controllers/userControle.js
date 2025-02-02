
//get function
const { getDriver }=require('../app');
// const neo4j=require('neo4j-driver');
const {connectNeo4j}=require('../config/database');


// // Connect to the Neo4j database
// let driver=null;
// try {
//     driver=connectNeo4j();
// } catch (error) {
//     console.error("Failed to connect to the Neo4j database:", error.message);
//     process.exit(1); // Exit the process if the database connection fails
// }

const driver=getDriver();
async function getUsers(req,res) {
        const { mobile, password } = req.query;
    
        // Validate input
        if (!mobile || !password) {
            return res.status(400).json({ error: "Mobile and password are required" });
        }
     
        console.log("Mobile:", mobile);
        console.log("Password:", password);
      
       
        const session = driver.session();
    
        session
            .run(
                "MATCH (u:User {mobile: $mobile, password: $password}) RETURN u",
                { mobile: neo4j.int(mobile), password: password }
            )
            .then((result) => {
                if (result.records.length > 0) {
                    const users = result.records.map((record) => {
                        const userNode = record.get("u");
                        return {
                            name: userNode.properties.name,
                            mobile:  userNode.properties.mobile.toNumber(),
                            password: userNode.properties.password,
                            email: userNode.properties.email,
                        };
                    });
                   console.log("return user from backend");
                   res.setHeader("Content-Type", "application/json");
                    return res.status(200).json(users); 
                } else {
                    return res.status(404).json({ error: "User not found from backend" });
                }
            })
            .catch((err) => {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Internal server error" });
            })
            .finally(() => {
                session.close();  
            });
    }

//-----------------------------------------------------------------------------

//post function

    async function registerUsers(req,res) {

             const userName= String(req.body.userName);
             const mobile = Number(req.body.mobileNo);
             const email= String(req.body.email);
             const password = String(req.body.password);

             const session = driver.session();
             console.log("nam pata aa gya h jese nam ho gya "+ userName);


    session
    .run("CREATE (:User {name:$name,mobile:$mobile,email:$email,password:$password})",
        { name: userName, mobile: neo4j.int(mobile), email: email, password:password} 
    )
    .then((result)=>{
        if(result !== undefined){
            console.log(result);
            return res.status(200).json({  //res.end("user register sucessfully from backend");
                message:"user register sucessfully from backend"
            })
        }
        return res.send("user not register sucessfully from backend");

    })
    .catch((err)=>console.log(err))
    .finally(() => {
        session.close();  
    });
}


    module.exports={ getUsers , registerUsers };