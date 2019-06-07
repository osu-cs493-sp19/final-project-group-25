/*
 * API sub-router for users collection endpoints.
 */

const router = require('express').Router();
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { UserSchema, LoginSchema, insertNewUser, getUserById , getUserByEmail, validateUser } = require('../models/user');

router.post('/',  async (req, res, next) => {
   if (req.body && req.body.name && req.body.email && req.body.password && req.body.role) {
     console.log("==CONTAINS VALID BODY")
     try {
       const id = await insertNewUser(req.body);
       console.log("==INSERTED " + id)
       res.status(201).send({
         id: id
       });
     } catch (err) {
       console.error(err);
       res.status(500).send({
         error: "Error inserting user into DB.  Please try again later."
       });
     }
   } else {
     res.status(400).send({
       error: "Request body is not a valid business object."
     });
   }
});

router.post('/login', async (req, res, next) => {
  if(req.body && req.body.email && req.body.password) {
    try {
      const user = await getUserByEmail(req.body.email);
      console.log("==VERIFY USER " + user);
      if (user) {
        const authenticated = await validateUser(user._id, req.body.password);
        console.log("==AUTHENICATED " + authenticated);
        if (authenticated) {
          //const user = await getUserByEmail(user);
          const token = generateAuthToken(user);
          console.log("==TOKEN " + token);
          res.status(200).send({
            token: token
          });
        } else {
          res.status(401).send({
            error: "Invalid Credentials"
          });
        }
      } else {
        res.status(401).send({
          error: "Invalid User"
        });
      }
    } catch (err) {
      res.status(500).send({
        error: "Error logging in. Try again later."
      });
    }
  } else {
    res.status(400).json({
      error: "Request body needs email and password."
    });
  }
});

router.get('/:id', requireAuthentication, async (req, res, next) => {
  console.log("==REQ.PARAMS.ID " + req.params.id);
  console.log("==REQ.USER " + req.user);
  if (req.params.id == req.user) {
    try {
      const user = await getUserById(req.params.id, false);
      if(user) {
        res.status(200).send(user);
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch user. Please try again later."
      });
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resources"
    });
  }
});

module.exports = router;
