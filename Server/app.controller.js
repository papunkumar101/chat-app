const UserModel = require('./app.model');

class userController{

    async signup(req, res) {
        try {
            let {username, password} = req.body;
             if(!username || username =='' || !password || password =='') return res.json({code : 400, message:'failed', data:null, error:'Incorrect input'});
            let result = await UserModel.checkUserExist(username);
            console.log(res,res);
            if(result) res.json({code : 400, message: 'failed', data: null, error : "User already exist"});
            // password encryption
            await UserModel.insertUser(username, password);
            // check the response and return 
            return res.json({code : 201, message:'success', data:'Successfully created', error:null});
        } catch (error) {
            res.json({code : 400, message: 'failed', data: null, error: error});
        }
    }
}

module.exports = new userController();