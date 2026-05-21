const usersDB = {
    users: require('../model/users.json'),
    setUsers: (_users) => {
        usersDB.users = _users;
    }
} 

const jwt = require('jsonwebtoken');
const fsPromises = require('fs').promises;
const path = require('path');
require('dotenv').config();

const refreshTokenController = {
    refreshToken: async (req, res) => {
       
        //look for the refresh token in the cookies
        const cookies = req.cookies;
        console.log("REFRESH TOKEN ENDPOINT", cookies);

        
        if(!cookies?.refreshToken) {
            console.log("NO COOKI EWITH REFRESH TOKEN");
            return res.sendStatus(401);
        }
            
       
        const _refreshToken = cookies.refreshToken;
 
        //clear the cookies
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            //maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });

      
        //check if the refresh token exists in the users record
        console.log( "TOKENS: ", _refreshToken, cookies.refreshToken);
        const userExists = usersDB.users.find(_user => _user.refreshToken === _refreshToken);
        console.log("USER EXISTS", userExists);
     

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

        if(!userExists) {
           //detect refresh token re-use
           jwt.verify(_refreshToken, process.env.REFRESH_TOKEN_SECRET, async(err, decoded) => {
               if (err) {
                    return res.status(403);
               }
               
               //get the suspected user
               const suspectedUser = usersDB.users.find(_user => _user.email === decoded.user);
               //clear the suspected user refresh token
               suspectedUser.refreshToken = '';
               
               //update the users record
                const users = usersDB.users.filter(user => user.email !== decoded.user);
                usersDB.setUsers([...users, suspectedUser]);
                await fsPromises.writeFile(
                path.join(__dirname, '../model/users.json'),
                JSON.stringify(usersDB.users)
                ).catch(err => {
                     return res.status(500).json({ message: 'Error saving users to file' });
                });
            
            })
          
        }

        //evaluate the refresh token
        jwt.verify(_refreshToken, process.env.REFRESH_TOKEN_SECRET, async(err, decoded) => {

            if(err) {
               //old refresh token
                userExists.refreshToken = '';
                const users = usersDB.users.filter(user => user.email !== decoded.user);
                usersDB.setUsers([...users, userExists]);
                await fsPromises.writeFile(
                path.join(__dirname, '../model/users.json'),
                JSON.stringify(usersDB.users)
                ).catch(err => {
                res.status(500).json({ message: 'Error saving users to file' });
                });
            }
            

            //check if there is an error or if the user is not the same as the one in the token
            if (err || userExists.email !== decoded.user) {
                return res.sendStatus(403);
            }

            //if everything is ok, then create a new access token
            const token = jwt.sign({ user: userExists.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '60s' });
            //also a new refresh token
            const newRefreshToken = jwt.sign({ user: userExists.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
            console.log("NEW REFRESH TOKEN", newRefreshToken);

            //save the new refresh token to the user
            userExists.refreshToken = newRefreshToken;

            const users = usersDB.users.filter(user => user.email !== userExists.email);
            usersDB.setUsers([...users, userExists]);

            await fsPromises.writeFile(
                path.join(__dirname, '../model/users.json'),
                JSON.stringify(usersDB.users)
            ).catch(err => {
                res.status(500).json({ message: 'Error saving users to file' });
            });

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
module.exports = refreshTokenController;