/*
 * API sub-router for users collection endpoints.
 */

const router = require('express').Router();
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { UserSchema, LoginSchema, insertNewUser, getUserById , getUserByEmail, validateUser } = require('../models/users');

router.post('/', async (req, res, next) => {
  if (validateAgainstSchema(req.body, UserSchema)) {
    try {
      const id = await insertNewUser(req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      console.error(err);
      res.status(500).send ({
        error: "Error inserting user into database. Please try again later!"
      });
    }
  } else {
    res.status(500).send({
      error: "Request body is not a valid user object."
    });
  }
});

router.post('/login', async (req, res, next) => {
  if(req.body.email && req.body.password) {
    try {
      const authenticated = await validateUser(req.body.email, req.body.password);
      if (authenticated) {
        const user = await getUserByEmail(req.body.email);
        const token = generateAuthToken(user._id);
        res.status(200).send({
          token:token
        });
      } else {
        res.status(401).send({
          error: "Invalid Credentials"
        });
      }
    } catch (err) {
      res.status(500).send({
        error: "Error loggin in. Try again later."
      });
    }
  } else {
    res.status(400).json({
      error: "Request body needs email and password."
    });
  }
});

/* Create router to fetch data about a particular user */

module.exports = router;
