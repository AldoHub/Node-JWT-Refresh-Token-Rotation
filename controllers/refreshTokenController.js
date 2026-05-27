const usersDB = {
    users: require('../model/users.json'),
    setUsers: (_users) => {
        usersDB.users = _users;
    }
} 

const jwt = require('jsonwebtoken');
const fsPromises = require('fs').promises;
const path = require('path');
const User = require('../db_models/User');
require('dotenv').config();

const refreshTokenController = {
    refreshToken: async (req, res) => {
      
        //look for the refresh token in the cookies
        const cookies = req.cookies;
        console.log("REFRESH TOKEN COOKIE", cookies);

        if(!cookies?.refreshToken) {
            //console.log("NO COOKI EWITH REFRESH TOKEN");
            return res.sendStatus(401);
        }

        //get the refresh token from the cookies
        const _refreshToken = cookies.refreshToken;
 /*
        //clear the cookies
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            //maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });
*/
        //check if the refresh token exists in the users record
        const userExists = await User.findOne({refreshToken: _refreshToken}).catch(err => console.log(err));
        //console.log("USER EXISTS USING REFRESH TOKEN", userExists);

        /*
        if(userExists === undefined) {
            
            //remove the cookie
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                //maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
            });

            //send a bad request - probably an error getting the user data
            return res.sendStatus(500);
        
        }
    */
        console.log("USER EXISTS USING REFRESH TOKEN", userExists);
        if(!userExists) {
           //detect refresh token re-use - check if is valid
           jwt.verify(_refreshToken, process.env.REFRESH_TOKEN_SECRET, async(err, decoded) => {
               if (err) {
                console.log("VERIFY ERROR", err);
                    return res.status(403);
               }
               
               //get the suspected user and clear the refresh token
               await User.findByIdAndUpdate(userExists._id, {$set: {refreshToken: ''}}).catch(err => console.log(err));
               return res.sendStatus(403);
            })
          
        }else{
           
            //evaluate the refresh token
            jwt.verify(_refreshToken, process.env.REFRESH_TOKEN_SECRET, async(err, decoded) => {
                 console.log("EVALUATING REFRESH TOKEN");
    
                if(err) {
                    console.log("VERIFY ERROR 2", err);
                    //old refresh token
                    await User.findByIdAndUpdate(userExists._id, {$set: {refreshToken: ''}}).catch(err => console.log(err));
                    return res.sendStatus(403);
                }
                
                console.log(err, userExists.user, decoded.user);
/*
                //check if there is an error or if the user is not the same as the one in the token
                if (err || userExists.user !== decoded.user) {
                    return res.sendStatus(403);
                }
*/
                
                //if everything is ok, then create a new access token
                const token = jwt.sign({ user: userExists.user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '60s' });
                //also a new refresh token
                const newRefreshToken = jwt.sign({ user: userExists.user }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                console.log("NEW REFRESH TOKEN", newRefreshToken);

                //save the new refresh token to the user 
                await User.findByIdAndUpdate(userExists._id, {$set: {refreshToken: newRefreshToken}}).catch(err => console.log(err));

                //send a new cookie with the new refresh token
                res.cookie('refreshToken', newRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None',
                    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
                });

                return res.status(200).json({accessToken: token});
    

            });
        }
    
      

  
          
    }

}
module.exports = refreshTokenController;