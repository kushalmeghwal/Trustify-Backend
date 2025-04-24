
import { driver as _driver, auth } from "neo4j-driver";
import 'dotenv/config';

const uri = process.env.DATABASE_URI;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;

if (!uri || !user || !password) {
    throw new Error("Neo4j database connection details are missing in environment variables.");
}
let neo4jDriver;
try{
    neo4jDriver = _driver(uri, auth.basic(user, password));
    console.log("Connected to Neo4j database successfully");
}catch(error){
    console.log("Failed to connected to Neo4j database",error);
}
export default neo4jDriver ; 