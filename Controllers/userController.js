import neo4jDriver  from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export async function loginUser(req, res) {
    const { mobileNo, password } = req.body;

    if (!mobileNo || !password) {
        return res.status(400).json({ error: "Mobile and password are required" });
    }

    const session = neo4jDriver.session();
    try {
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) RETURN u",
            { mobileNo }
        );
        if (result.records.length === 0) {
            return res.status(404).json({ status: false, error: 'user not found from backend' });
        }

        const userNode = result.records[0].get('u');
        const hashedPassword = userNode.properties.password;

        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (!passwordMatch) {
            return res.status(401).json({ status: false, error: 'Invalid Password' });
        }

        const token = jwt.sign({
            id: userNode.properties.id,
            name: userNode.properties.name,
            mobileNo: userNode.properties.mobileNo,
            email: userNode.properties.email,
            profileImg: userNode.properties.profileImg
        }, process.env.SECRET_KEY, { expiresIn: '1d' });

        return res.status(200).json({ status: true, token, id:userNode.properties.id });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ status: false, error: "Internal server error" });
    } finally {
        await session.close();
    }
}

export async function registerUser(req, res) {
    const { name, mobileNo, email, password, profileImg } = req.body;
    const session = neo4jDriver.session();

    try {
        const existingUser = await session.run(
            "MATCH (u:User) WHERE u.mobileNo=$mobileNo RETURN u",
            { mobileNo }
        );
        if (existingUser.records.length > 0) {
            return res.status(400).json({ error: 'user already exists' });
        }

        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (err) {
            return res.status(500).json({ message: 'error while hashing password' });
        }

        const result = await session.run(
            "CREATE (:User{id:apoc.create.uuid(),name:$name, mobileNo:$mobileNo, email:$email, password:$hashedPassword,profileImg:$profileImg, location:'India',trustScore:2, contacts:[],createdAt: date()})",
            { name, mobileNo, email, hashedPassword, profileImg }
        );

        if (result) {
            return res.status(200).json({ message: "user registered successfully from backend" });
        }

        return res.status(500).json({ error: "User registration failed from backend" });
    } catch (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        await session.close();
    }
}

export async function updateContactsList(req, res) {
    const { mobileNo, contacts } = req.body;
    const session = neo4jDriver.session();
    console.log(mobileNo)
    console.log(contacts)

    try {
        const result = await session.run(
            "MATCH (u:User{mobileNo:$mobileNo }) SET u.contacts = $contacts",
            { mobileNo, contacts }
        );

        if (result) {
            await updateRelationship(mobileNo);
            return res.status(200).json({ message: "contact list updated successfully" });
        }

        return res.status(500).json({ error: "Contacts not updated successfully from backend" });
    } catch (err) {
        console.error("Error updating contact list:", err);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        await session.close();
    }
}

async function updateRelationship(mobileNo) {
    const session = neo4jDriver.session();
    try {
        const result = await session.run(
            `MATCH (u:User {mobileNo: $mobileNo})
             UNWIND u.contacts AS contactNumber
             MATCH (c:User {mobileNo: contactNumber})
             MERGE (u)-[:HAS_CONTACT]->(c)
             WITH u, c
             WHERE u.mobileNo IN c.contacts
             MERGE (c)-[:HAS_CONTACT]->(u)
             RETURN u, c`,
            { mobileNo }
        );

        if (result) {
            console.log("Relationships updated successfully.");
        }
    } catch (err) {
        console.error("Error updating relationships:", err);
    } finally {
        await session.close();
    }
}

export async function verifyUserForPasswordReset(req, res) {
    const { email, mobileNo } = req.body;
    
    if (!email || !mobileNo) {
        return res.status(400).json({ 
            success: false, 
            message: "Email and mobileNo number are required" 
        });
    }


    const session = neo4jDriver.session();
    try {
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo, email: $email}) RETURN u",
            { mobileNo, email }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No user found with these credentials' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'User verified successfully' 
        });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    } finally {
        await session.close();
    }
}

export async function resetPassword(req, res) {
    const { mobileNo, newPassword } = req.body;
    console.log('Reset password request received for mobileNo:', mobileNo);

    if (!mobileNo || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "mobileNo number and new password are required" 
        });
    }

    const session = neo4jDriver.session();
    try {
        // First verify if user exists
        const userResult = await session.run(
            "MATCH (u:User {mobileNo: $mobileNoNo}) RETURN u",
            { mobileNo }
        );

        if (userResult.records.length === 0) {
            console.log('User not found for mobileNo:', mobileNo);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log('User found, proceeding with password reset');

        // Hash the new password
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(newPassword, 10);
            console.log('Password hashed successfully');
        } catch (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error while hashing password' 
            });
        }

        // Update the password
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) SET u.password = $hashedPassword RETURN u",
            { mobileNo, hashedPassword }
        );

        if (result.records.length > 0) {
            console.log('Password updated successfully for user:', mobileNo);
            return res.status(200).json({ 
                success: true, 
                message: "Password reset successfully" 
            });
        }

        console.log('Failed to update password for user:', mobileNo);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to reset password" 
        });
    } catch (err) {
        console.error("Error resetting password:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    } finally {
        await session.close();
    }
}

export async function getUserProfile(req, res) {
    const session = neo4jDriver.session();
    try {
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) RETURN u",
            { mobileNo: req.user.mobileNo }
        );

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.records[0].get('u').properties;
        console.log("got the profile");
        return res.status(200).json({
            success: true,
            data: {
                name: user.name,
                email: user.email,
                mobileNo: user.mobileNo,
                profileImg: user.profileImg,
                location: user.location,
                trustScore: user.trustScore
            }
        });
    } catch (err) {
        console.error("Error fetching user profile:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        await session.close();
    }
}

export async function updateUserProfile(req, res) {
    const { name } = req.body;
    const session = neo4jDriver.session();

    try {
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) SET u.name = $name RETURN u",
            { mobileNo: req.user.mobileNo, name }
        );

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
console.log("profile updated");
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: result.records[0].get('u').properties
        });
    } catch (err) {
        console.error("Error updating user profile:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        await session.close();
    }
}

export async function updateProfileImage(req, res) {
    const { profileImg } = req.body;
    const session = neo4jDriver.session();

    try {
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) SET u.profileImg = $profileImg RETURN u",
            { mobileNo: req.user.mobileNo, profileImg }
        );

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
console.log("image updated");
        return res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            data: result.records[0].get('u').properties
        });
    } catch (err) {
        console.error("Error updating profile image:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        await session.close();
    }
}

export async function updateUserPassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const session = neo4jDriver.session();

    try {
        // First verify current password
        const userResult = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) RETURN u",
            { mobileNo: req.user.mobileNo }
        );

        if (userResult.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.records[0].get('u').properties;
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) SET u.password = $hashedPassword RETURN u",
            { mobileNo: req.user.mobileNo, hashedPassword }
        );

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error("Error updating password:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        await session.close();
    }
}
