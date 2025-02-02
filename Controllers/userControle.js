const { connectNeo4j }=require('../config/database');

let neo4jDriver;
try {
    neo4jDriver = connectNeo4j();
} catch (error) {
    console.error("Failed to connect to the Neo4j database:", error.message);
    process.exit(1); // Exit the process if the database connection fails
}

async function getUsers(req,res) {
        const { mobile, password } = req.query;
    
        // Validate input
        if (!mobile || !password) {
            return res.status(400).json({ error: "Mobile and password are required" });
        }
     
        console.log("Mobile:", mobile);
        console.log("Password:", password);
        console.log("ye app.get ke login me h");
       
        const session = neo4jDriver.session();
    
        session
            .run(
                "MATCH (u:user {mobile_no: $mobile, password: $password}) RETURN u",
                { mobile: mobile, password: password }
            )
            .then((result) => {
                if (result.records.length > 0) {
                    const users = result.records.map((record) => {
                        const userNode = record.get("u");
                        return {
                            name: userNode.properties.name,
                            mobile:  userNode.properties.mobile,
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
             const mobile = String(req.body.mobileNo);
             const email= String(req.body.email);
             const password = String(req.body.password);

             const session = neo4jDriver.session();
             console.log("nam pata aa gya h jese nam ho gya "+ userName);


    session
    .run("CREATE (:user {name:$name,mobile_no:$mobile,email:$email,password:$password,contacts:[]})",
        { name: userName, mobile: mobile, email: email, password:password} 
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
//contact list updation function
async function updateContactsList(req,res){
        const mobile = String(req.body.mobile_no);
        const contacts_list = req.body.contact_list;
        console.log(mobile);
        console.log(contacts_list);
        const session = neo4jDriver.session();
       
        session
        .run(" MATCH (u:user{mobile_no:$mobile }) SET u.contacts = $contacts_lst",
            {mobile:mobile,contacts_lst:contacts_list}
        )
        .then((result)=>{
            if(result !== undefined){
                updationRelationship(mobile,contacts_list)
                console.log(result);
                return res.status(200).json({  //res.end("user register sucessfully from backend");
                    message:"contact list updated succefully "
                })
            }
          return res.send("users contacts not updated sucessfully from backend");

        })
        .catch((err)=>console.log(err))
        .finally(() => {
            session.close();  
        });
}
 async function updationRelationship(mobile , contacts_list){
      const session = neo4jDriver.session();
     await session
      .run('Match (u:user{mobile_no : $mobile}) UNWIND u.contacts AS contact_number MATCH (c:user{mobile_no:contact_number}) MERGE (u)-[:HAS_CONTACT]->(c)',
        {mobile:mobile}
          
      )
      .then((result)=>{
        if(result !== undefined){
           console.log(result);
           return ;
        }

    })
    .catch((err)=>console.log(err))
    .finally(() => {
        session.close();  
    });
 }

    module.exports={ getUsers , registerUsers ,updateContactsList};