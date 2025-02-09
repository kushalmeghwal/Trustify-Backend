
/* not in use right now

const Neode = require('neode');
require('dotenv').config();
// Initialize the Neode instance
const neode = new Neode(
    process.env.DATABASE_URL,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD
    );

// Define the user model
const User = neode.model('User', {
    name: {
        type: 'string',
        required: true
    },
    mobile_no: {
        type: 'string',
        unique: true,
        required: true
    },
    email: {
        type: 'string',
        unique: true,
        required: true
    },
    password: {
        type: 'string',
        required: true
    },
    contacts: {
        type: 'array',
        default: []
    }
});

// Export the neode instance and User model
module.exports = { neode, User };



*/