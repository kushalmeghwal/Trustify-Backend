
// /**
//  * User Node Schema
//  * This defines the properties of a `User` node in the Neo4j database.
//  * - name: string (The name of the user)
//  * - mobile: integer (The mobile number of the user, treated as unique)
//  * - email: string (The email address of the user)
//  * - password: string (The hashed password of the user)
//  */

// const neo4j = require("neo4j-driver");

// // Schema-related constants
// const USER_LABEL = "User";

// /**
//  * Function to create a User node in the database.
//  * @param {object} driver - The Neo4j driver instance.
//  * @param {string} name - The name of the user.
//  * @param {number} mobile - The user's mobile number.
//  * @param {string} email - The user's email.
//  * @param {string} password - The user's password.
//  * @returns {Promise<number>} The number of nodes created.
//  */
// async function createUser(driver, name, mobile, email, password) {
//     const session = driver.session();
//     try {
//         const result = await session.run(
//             `CREATE (u:${USER_LABEL} {name: $name, mobile: $mobile, email: $email, password: $password})`,
//             { name, mobile: neo4j.int(mobile), email, password }
//         );
//         return result.summary.counters.nodesCreated(); // Number of nodes created
//     } finally {
//         await session.close();
//     }
// }

// /**
//  * Function to find a User node by its credentials.
//  * @param {object} driver - The Neo4j driver instance.
//  * @param {number} mobile - The user's mobile number.
//  * @param {string} password - The user's password.
//  * @returns {Promise<array|null>} The matching user(s), or null if not found.
//  */
// async function findUserByCredentials(driver, mobile, password) {
//     const session = driver.session();
//     try {
//         const result = await session.run(
//             `MATCH (u:${USER_LABEL} {mobile: $mobile, password: $password}) RETURN u`,
//             { mobile: neo4j.int(mobile), password }
//         );

//         if (result.records.length > 0) {
//             // Map Neo4j records to user objects
//             return result.records.map((record) => {
//                 const userNode = record.get("u");
//                 return {
//                     name: userNode.properties.name,
//                     mobile: userNode.properties.mobile.toNumber(),
//                     email: userNode.properties.email,
//                     password: userNode.properties.password,
//                 };
//             });
//         }
//         return null; // No user found
//     } finally {
//         await session.close();
//     }
// }

// /**
//  * Function to define schema guidelines as comments.
//  * This is useful for documenting your Neo4j database structure.
//  */
// function describeSchema() {
//     console.log(`
//         User Node Schema:
//         -----------------
//         - Label: ${USER_LABEL}
//         - Properties:
//             - name: string
//             - mobile: integer
//             - email: string
//             - password: string (hashed)
//         Relationships (future use):
//             - None defined in this model. Relationships can be added as needed.
//     `);
// }

// module.exports = { createUser, findUserByCredentials, describeSchema };


