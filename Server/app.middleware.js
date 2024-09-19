const {VerifyToken, generateToken} = require('./app.helper');

class UserMiddleware {
    async auth(req, res, next) {
    let token = req.cookies.authToken;
    if(!token) return res.redirect('/signin');
    const verify = await VerifyToken(req.cookies.authToken);
    if(!verify) return res.redirect('/signin');
     next();
    }
}

module.exports = new UserMiddleware();