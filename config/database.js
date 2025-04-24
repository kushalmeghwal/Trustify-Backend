
import { driver as _driver, auth } from "neo4j-driver";
import 'dotenv/config';

const uri = process.env.DATABASE_URI;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;

if (!uri || !user || !password) {
    throw new Error("Neo4j database connection details are missing in environment variables.");
}

// Create a single shared instance of the driver


let neo4jDriver;
try {
    neo4jDriver = _driver(uri, auth.basic(user, password));
    console.log("Connected to Neo4j database successfully");
 } catch (error) {
     console.error("falied to connect neo4j");
     process.exit(1);
 }
export default neo4jDriver ; // Export the shared instance
