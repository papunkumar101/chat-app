const jwt = require('jsonwebtoken');
const secretKey = "thisIsmySecretKey";

// JsonWebToken(JWT)
async function generateToken(userData) {
    return await jwt.sign({userData}, secretKey, { expiresIn: '1d' });  
} 
async function VerifyToken(token) { 
    let decoded = await jwt.verify(token, secretKey);
    if(decoded) return decoded;
    return false;  
}
 
module.exports = {generateToken, VerifyToken};