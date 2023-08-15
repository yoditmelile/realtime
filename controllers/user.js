const User = require ('../model/User')
const Room = require( '../model/Room')
const Message = require ('../model/Message')
const asyncHandler = require ('express-async-handler')

const getUnreadCount = asyncHandler (async(type, from , to) =>{ // it takes three parameters
   const filter = type ==='room' ? [to] : [from, to] // conditional function .. if the value of type is equal to room then the filter array will contain only the value ot the to variable
   const MessageReaders = await Message // the function using message model 
   .find({sender:{$ne: from}}) // searches for documents in the database where the sender field is not equal to the value of from
   .all('users', filter) // 
   .select(['readers'])
   .sort ({createdAt: -1})
   .lean()

    //the result of the query is stored here where the readers array doesn't contain the value of from
   return MessageReaders.filter(({readers}) => readers.indexOf(from) === -1).length || 0
})

const getMessageInfo = asyncHandler (async(type, from, to) =>{
   const filter = type === 'room' ? [to] : [from, to]
   const message = await Message
         .findOne()
         .all('users', filter)
         .select(['message', 'sender', 'updatedAt', 'readers'])
         .sort({createdAt: -1})
         .lean() // this method converts the result to plain javascript object

         const unreadCount = await getUnreadCount(type, from, to)

   return {
      latestMessage: message?.message || null,
      latestMessageSender: message?.sender || null,
      latestMessageUpdatedAt: message?.updatedAt || null,
      unreadCount
   }

})

//read

const getUserContacts = asyncHandler(async (req,res) => {

   try{
       const {userId} = req.params

       if(!userId) return res.status(400).json({message : 'Missing required information'})

       const users = await User
       .find({_id: {$ne : userId}})
       .select(['name', 'avatarImage', 'chatType'])
       .sort({updatedAt : -1})
       .lean()

      const rooms = await Room
      .find()
      .all('users', [userId])
      .select(['name', 'users', 'avatarImage', 'chatType']) 
      .sort({updatedAt: -1})
      .lean()

      const contacts = users.concat(rooms) // concatnates user and room 
      const contactWithMessages = await Promise.all(
         contacts.map(async(contact) => {
            const { _id, chatType: type} = contact
            const messageInfo = await getMessageInfo(type, userId, _id.toHexString())

            return {
               ...contact,
               ...messageInfo
            }
         })

      )

      return res.status (200).json ({data: contactWithMessages})
   } catch (err) {
      return res.status(404).json({message: err.message})
   } 
})

const getUserMessages = asyncHandler (async (req, res) => {

   try{
      const {userId} = req.params
      const {type, chatId } = req.query

      if(!userId || !type || !chatId){
         return res.status(400).json ({message: 'Missing required information'})
      }

      const filter = type === 'room' ? [chatId] : [userId, chatId]
      const messages = await Message
      .find()
      .all('users', filter)
      .sort({createdAt: 1})
      .lean()

      const messagesWithAvatar = await Promise.all(
         messages.map(async(msg) => {
            const senderId = msg.sender
            const user = await User.findById(senderId).lean()

            return{
               ...msg,
               avatarImage: user.avatarImage
            }
         })
      )

      return res.status(200).json({ data: messagesWithAvatar})


   } catch(err){ return res.status(404).json({message : err.message})}
})
 

// create message 
const postUserMessage = asyncHandler(async(req,res) => {
try {
      const {userId} = req.params
      const {chatId} = req.query
      const {message} = req.body
      
      if (!userId || !chatId || !message) {
         return res.status(400).json({message: 'Missing required information'})
      }

      const newMessage = await Message.create({
         message,

         users: [userId, chatId],
         sender: userId,
         readers: []
      })

      return res.status(200).json({data: newMessage})

} catch (err){
   return res.status(500).json({message: err.message})
}

})

const postRoom = asyncHandler (async(req,res,next) =>{

try{
      const {userId} = req.params
      const{name, users, avatarImage} = req.body

      if(!userId || !name || !users || !avatarImage) {
         return res.status(400).json({message: 'Missing required information'})
      }

      const data = await Room.create({
            name,
            users: [...users, userId],
            avatarImage,
            chatType: 'room'

      })

      return res.json ({data, messages: 'successfully created a room'})
} catch(err){
   return res.status(500).json({ message: e.message})
}

})


//update

const updateMessageReadStatus = asyncHandler(async(req,res) => {

try{

      const {userId} = req.params
      const {type, chatId} = req.query

      if(!userId || !type || !chatId){
         return res.status(400).json({message: 'Missing required information'})
      }


      const filter = type ==='room' ? [chatId] : [userId, chatId]

      const messages = await Message

      .find({sender: {$ne: userId}})
      .all('users', filter)
      .sort({createdAt: 1})

      const MessageReaderMap = messages.reduce((prev,curr) => {

         return {...prev, [curr._id.toHexString()]: curr.readers}
      }, {})

      Object.entries(MessageReaderMap).forEach(([key, value]) => {

         const userHasRead = value.indexOf(userId) > -1
         if(!userHasRead) MessageReaderMap[key].push(userId)

      })

         await Promise.all (
            Object.keys(messagesReaderMap).map(async (msgId) => {
               return await Message
                     .findByIdAndUpdate({ _id: msgId}, {readers: messagesReaderMap[msgId]}, {new: true})
                     .lean()
            })
         )

         return res.status(200).json({data: null, message: 'successfully updates.'})



} catch (err){
   return res.status(500).json({message: err.message})
}

})

module.exports ={
   getUserContacts,
   getUserMessages,
   postUserMessage,
   postRoom,
   updateMessageReadStatus,
}