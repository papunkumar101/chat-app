const UserModel = require('./app.model');
const {generateToken, VerifyToken} = require('./app.helper');

class userController{

    async signin(req, res) {
        try {
            let {username, password} = req.body;
             if(!username || username =='' || !password || password =='') return res.json({code : 400, message:'failed', data:null, error:'Incorrect input'});
             // password decrypt
             let result = await UserModel.checkUserCred(username, password);
             if(!result) return res.json({code : 400, message: 'failed', data: null, error : "User not exist"});
             // Return the jwt token
             const [[response]] = await UserModel.getUserData(username);
             const jwtToken = await generateToken(response);
             const data = {
                'name' : response.name,
                'u_id' : response.u_id,
                'type' : response.user_type,
                'token' : jwtToken
             } 
             return res.json({code : 200, message:'success', data:data, error:null});
        } catch (error) {
             res.json({code : 400, message: 'failed', data: null, error: error});
        }
    }

    async signup(req, res) {
        try {
            let {username, password, type} = req.body;
             if(!username || username =='' || !password || password =='' || !type || type =='') return res.json({code : 400, message:'failed', data:null, error:'Incorrect input'});
             let result = await UserModel.checkUserExist(username);
             if(result) return res.json({code : 400, message: 'failed', data: null, error : "User already exist"});
            // password encryption
            await UserModel.insertUser(username, password, +type);
            // check the response and return 
            return res.json({code : 201, message:'success', data:'Successfully created', error:null});
        } catch (error) {
            res.json({code : 400, message: 'failed', data: null, error: error});
        }
    }

    async profile(req, res){
        try {
            const token = req.cookies.authToken;
            const verify = await VerifyToken(req.cookies.authToken);
            const {name,u_id,user_type,current_date_time} = verify.userData;
            let [member] = await UserModel.memberList();
            let [group] = await UserModel.groupList();
            let memberList = ``;
            member.map((val)=>{
                if(val.u_id != u_id) memberList +=`<li>${val.name.toUpperCase()} <a href="/message?to=${val.name}">Send message to ${val.name}</a></li>`;
            });
            let groupList = ``;
            group.map((val)=>{
                if(val.u_id != u_id) groupList +=`<li>${val.name.toUpperCase()} <a href="/message?to=${val.name}">Send message to ${val.name}</a></li>`;
            });
            console.log('member',member,group);
            return res.send(`
                   <p>Hii ${name.toUpperCase()}, </p><p style="float:right"><a href="/logout">Logout</a></p>
                  <h1>Select the group or name to start charting : </h1><br>
                  <h3>Member : </h3>
                  <ol>${memberList}</ol>
                  <h3>Group : </h3>
                  <ol>${groupList}</ol>
                `);
        } catch (error) {
            return res.json({code:400, message : 'failed', data: null, error : error});
        }
    }



    logout(req, res){
        try {
            res.clearCookie('authToken');
            return res.redirect('/signin');
        } catch (error) {
            return res.json({code:400, message : 'failed', data: null, error : error});
        }
    }
     

    async sendMessage(auth, message, socket){ 
        if(!auth) return false;
        try {
            const {senderToken, receiverName} = JSON.parse(auth); 
            const verify = await VerifyToken(senderToken);
            const [[receiverInfo]] = await UserModel.getUserData(receiverName);
            const {name:fromName,u_id:fromUserId,user_type:fromUserType,current_date_time:FromCurrentDate} = verify.userData;
            const {name:toName,u_id:toUserId,user_type:toUserType,current_date_time:toCurrentDate} = receiverInfo;
            await UserModel.saveMessage(fromUserId, toUserId, message);
            // get the old messages and send back to the user 
            const [res] = await UserModel.getAllMessages(fromUserId, toUserId);
            return res;
        } catch (error) {
            console.log({code:400, message : 'failed', data: null, error : error});
        }
    }
}

module.exports = new userController();