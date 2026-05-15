const usersDB = {
    users: require('../model/users.json'),
    setUsers: (_users) => {
        usersDB.users = _users;
    }
} 

const fsPromises = require('fs').promises;
const path = require('path');

const logoutController = {
    logout: async (req, res) => {
        //look for the refresh token in the cookies
        const cookies = req.cookies;

        
        if(!cookies?.refreshToken) {
            return res.sendStatus(204);
        }
            

        const _refreshToken = cookies.refreshToken;

        //check if the refresh token exists in the users record
        const userExists = usersDB.users.find(_user => _user.refreshToken === _refreshToken);
        console.log("LOGOUT USER EXISTS", userExists);


        if(!userExists) {
            //clear the cookes
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                //maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
            });
           return res.sendStatus(204);
        }

        //delete the refresh token from the users record
        const users = usersDB.users.filter(user => user.refreshToken !== _refreshToken);
        const currentUser = {...userExists, refreshToken: ''};

        usersDB.setUsers([...users, currentUser]);

        await fsPromises.writeFile(
            path.join(__dirname, '../model/users.json'),
            JSON.stringify(usersDB.users)
        ).catch(err => {
            res.status(500).json({ message: 'Error saving users to file' });
        });
      
        //clear the cookies
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            //maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });

        res.sendStatus(204);
        
    }

}
module.exports = logoutController;