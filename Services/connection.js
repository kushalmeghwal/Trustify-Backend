const neo4j = require("neo4j-driver");

/**
 * Creates and returns a Neo4j driver instance.
 * @param {string} uri - The URI of the Neo4j database.
 * @param {string} user - The username for authentication.
 * @param {string} password - The password for authentication.
 * @returns {neo4j.Driver} A Neo4j driver instance.
 */
function connectneo4j(uri, user, password) {
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    console.log("Connected to Neo4j database successfully!");
    return driver;
}

module.exports = { connectneo4j };
