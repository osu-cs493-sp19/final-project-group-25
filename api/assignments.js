const router = require('express').Router();

const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { insertNewUser, getUserById, getUserByEmail, validateUser, isAdmin } = require('../lib/user')

/* 
* Route to create a new photo.
*/

router.post('/:id', requireAuthentication, async (req, res) => {
  const is_admin = await isAdmin(req.user)
  if (req.params.id == req.user || is_admin.id > 0) {  
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
      try {
        const id = await insertNewAssignment(req.body);
        res.status(201).send({
        id: id,
        links: {
          assingmentId: `/assignment/${id}`,
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error inserting photo into DB.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid object"
    });
  }
} else {
  res.status(403).json({
    error: "Unauthorized to access the specified resource"
  });
}
});