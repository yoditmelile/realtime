const {
   getUserContacts,
   getUserMessages,
   postUserMessage,
   updateMessageReadStatus,
   postRoom
 } = require('../controllers/user')

 const authenticateToken = require('../middleware/authenticateToken')

 const router = require ('express').Router()
 router.use(authenticateToken)

 // read
 router.get('./:userId/contacts', getUserContacts)
 router.get('./:userId/messages', getUserMessages)

// create 

router.post('/:userId/message', postUserMessage)
router.post('/:userId/room', postRoom)

//update 
router.put('/:userId/messages/status', updateMessageReadStatus)

module.exports = router