const User = require ('../model/User')
const bcrypt = require ('bcryptjs')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const {validationResult} = require('express-validator')


// user registration 

const register = asyncHandler (async(req, res, next) =>{

const {username, email, password, avatarImage} = req.body

const errors= validationResult(req)
if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})

const hashedPassword = await bcrypt.hash(password,10)

const user = await User.create({
   name:username,
   email,
   password: hashedPassword,
   avatarImage,
   chatType: 'user'
})

delete user._doc.password
return res.json({data: {...user._doc}, message: 'Register success'})

})


//user login 

const login = asyncHandler (async(req,res,next) => {

   const {username , password} = requ.body

   //this checks if error exist
   const errors = validationResult(req)
   if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()})

   // this check if the user is unauthorized 
   const user = await User.findOne({name : username})
   if (!user){ return res.status(401).json({message: 'Unauhtorized'})}

   // this checks if the password is correct 
const passwordCorrect = bcrypt.compareSync(password, user.password)
if (!passwordCorrect){ return res.status(401).json({message: 'Unauthorized'})
}

delete user._doc.password

//create accessToken & refreshToken 

const accessToken = jwt.sign(
   {username},
   process.env.ACCESS_TOKEN_SECRET,
   {expiresIn: '1h'}
)

const refreshToken = jwt.sign(
   {username},
   process.env.REFRESH_TOKEN_SECERT,
   {expiresIn:'3d'}
)

res.cookie('jwt', refreshToken, {
   httpOnly: true, // the client can not acesss this 
   secure: true,
   signed: true,
   sameSite: 'None',
   maxAge: 3* 24* 60 *60* 1000 // the maximum age of the cookie 3 days 

})

return res.json({data: {...user._doc, accessToken}})
})

const refresh = asyncHandler(async(req, res, next) => {
  const cookies = req.signedCookies
  if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })

  const refreshToken = cookies.jwt
  jwt.verify(
   refreshToken, 
   process.env.REFRESH_TOKEN_SECERT, 
   async (err, decoded) =>{ if (err) return res.status(403).json({message:'Forbidden'})

   //this checks if user exist 

   const username = decoded.username
   const user = await User.findOne({ name: username})
   if (!user) return res.status(401).json({ message: 'Unauthorized' })
   const accessToken = jwt.sign(
      { username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    )
    return res.json({ accessToken })
   })
})

const logout = asyncHandler(async(req,res,next) =>{
   //remove refersh token from cookie 

   const cookies = req.signedCookies
   if(!cookies?.jwt) return res.status(401).json({message: 'Unauthorized'})
   res.clearCookie('jwt', {
         httpOnly: true,
         secure: true,
         signed: true,
         sameSite: 'None',
   })

   return res.json({message: 'Success'})
})

module.exports = {
   register,
   login,
   refresh,
   logout
}