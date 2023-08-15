const mongoose = require ('mongoose')
const {Schema} = mongoose

const userSchema = new Schema(
   {
      name:{
         type: String,
         required: true,
         minlength: 3,
         maxlength: 20,
         unique: true
      },

      email:{
         type: String,
         required: true,
         maxlength: 50,
         unique : true
      },

      password:{
         type: String,
         minlength: 8,
      },

      avatarImage:{
         type: String,
         default: ''
      },

      chatType:{
         type: String,
         default: 'user'
      }
   },
   {
      timestamps: true
   }
)

module.exports = mongoose.model('User',userSchema)