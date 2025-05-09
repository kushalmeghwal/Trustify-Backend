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
        const existingUserWithMobile = await session.run(
            "MATCH (u:User) WHERE u.mobileNo=$mobileNo RETURN u",
            { mobileNo }
        );
        if (existingUserWithMobile.records.length > 0) {
            return res.status(400).json({ success: false,error: 'user already exists With this mobile number' });
        }
        const existingUserWithEmail = await session.run(
            "MATCH (u:User) WHERE u.email=$email RETURN u",
            { email }
        );
        if (existingUserWithEmail.records.length > 0) {
            return res.status(400).json({ success: false,error: 'user already exists With this email' });
        }

        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (err) {
            return res.status(500).json({ success: false,message: 'error while hashing password' });
        }

        const result = await session.run(
            "CREATE (:User{id:apoc.create.uuid(),name:$name, mobileNo:$mobileNo, email:$email, password:$hashedPassword,profileImg:$profileImg, location:'India',trustScore:2, contacts:[],createdAt: date()})",
            { name, mobileNo, email, hashedPassword, profileImg }
        );

        if (result) {
            return res.status(200).json({ success: true, message: "user registered successfully from backend" });
        }

        return res.status(500).json({ success: false,error: "User registration failed from backend" });
    } catch (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({ success: false,error: "Internal server error" });
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
    const { email, mobile } = req.body;

    if (!email || !mobile) {
        return res.status(400).json({ 
            success: false, 
            message: "Email and mobile number are required" 
        });
    }
    // Validate and format mobile number
    const mobileRegex = /^(\+91)?[0-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
  
        return res.status(400).json({ 
            success: false, 
            message: "Invalid mobile number format. Please provide a valid Indian mobile number" 
        });
    }

    const formattedMobile = mobile.startsWith('+91') ? mobile : `+91${mobile}`;

console.log(formattedMobile);
    const session = neo4jDriver.session();
    try {
        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobile, email: $email}) RETURN u",
            { mobile: formattedMobile, email }
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
    const { mobile, newPassword } = req.body;
    console.log(mobile);
    if (!mobile || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "Mobile number and new password are required" 
        });
    }

    // Validate and format mobile number
    const mobileRegex = /^(\+91)?[0-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid mobile number format. Please provide a valid Indian mobile number" 
        });
    }

    // Format mobile number to +91 format if not already
    const formattedMobile = mobile.startsWith('+91') ? mobile : `+91${mobile}`;

    const session = neo4jDriver.session();
    try {
        const userResult = await session.run(
            "MATCH (u:User {mobileNo: $mobile}) RETURN u",
            { mobile: formattedMobile }
        );

        if (userResult.records.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(newPassword, 10);
        } catch (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error while hashing password' 
            });
        }

        const result = await session.run(
            "MATCH (u:User {mobileNo: $mobileNo}) SET u.password = $hashedPassword RETURN u",
            { mobileNo: formattedMobile, hashedPassword }
        );

        if (result.records.length > 0) {
            return res.status(200).json({ 
                success: true, 
                message: "Password reset successfully" 
            });
        }

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
