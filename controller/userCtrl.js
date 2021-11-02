const Users = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookie = require('cookie')

const userCtrl = {
    register: async (req, res) => {
        try {
            const {name, email, password} = req.body;

            const user = await Users.findOne({email})
            if(user){
                return res.status(400).json({msg: "The email already exists."});
            } 
            
            if(password.length < 6){
                return res.status(400).json({msg: "Password is at leat 6 characters long."})
            }

            // Password Encryption
            const passwordHash = await bcrypt.hash(password, 10)
            const newUser = new Users({
                name, email, password: passwordHash
            })
            
            // Save to database
            await newUser.save()

            // Create a jsonwebtoken for authentication
            const accessToken = createAccessToken({id: newUser._id})
            const refreshToken = createRefreshToken({id: newUser._id})

            // res.setHeader('Set-Cookie', cookie.serialize('refreshtoken', String(refreshToken), {
            //     httpOnly: true,
            //     path: '/user/refresh_token',
            // }))
            res.cookie('refreshtoken', refreshToken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 // 7 days
            })
            res.json({accessToken})
            //res.json({msg: "Register Sucess!"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
      }
    }, 
    refreshToken: (req, res) => {
        try {
            const rf_token = req.cookies.refreshToken;
            if(!rf_token) return res.status(400).json({msg: "Please Login or Register"})

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if(err) return res.status(400).json({msg: "Please Login or Register"})

                const accessToken = createAccessToken({id: user.id})

                res.json({accessToken})
            })
            
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
        
    }
}

const createAccessToken = (user) =>{
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '11m'})
}
const createRefreshToken = (user) =>{
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}


module.exports = userCtrl