import neo4jDriver from '../config/database.js'; // your neo4j driver

export async function getUserContacts(mobileNo) {
    const query = `
        MATCH (u:User {mobileNo: $mobileNo})-[:HAS_CONTACT]->(contact:User),
              (u)<-[:HAS_CONTACT]-(contact)
        RETURN collect(DISTINCT contact.mobileNo) AS contacts
    `;
    const params = { mobileNo };
    let session;

    try {
        session = neo4jDriver.session();
        const result = await session.run(query, params);

        if (result.records.length === 0) {
            return [];
        }
    
        return result.records[0].get('contacts');
       
    } catch (error) {
        console.error('Error while getting contacts:', error);
        return [];
    } finally {
        if (session) await session.close();
    }
}

