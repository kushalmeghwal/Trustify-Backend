const neo4j = require("neo4j-driver");

/**
 * Creates and returns a Neo4j driver instance.
 * @returns {neo4j.Driver} A Neo4j driver instance.
 */
function connectNeo4j() {
    const uri = process.env.DATABASE_URL;
    const user = process.env.DATABASE_USER;
    const password = process.env.DATABASE_PASSWORD;

    if (!uri || !user || !password) {
        throw new Error("Neo4j database connection details are missing in environment variables.");
    }

    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    console.log("Connected to Neo4j database successfully");
    return driver;
}

module.exports = {connectNeo4j};

