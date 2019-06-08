const router = require('express').Router();

const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { getAssignmentsById,
  getAssignmentById,
  insertNewAssignment,
  replaceAssignmentById, 
  deleteAssignmentById
 } = require('../models/assignment');

const { extractValidFields } = require('../lib/validation');
const { validateAgainstSchema } = require('../lib/validation');

const AssignmentSchema = {
	courseId: { required: true },
	points: { required: true},
	due: { required: true },
	title: { required: true}
};
/* 
* Route to create a new photo.
*/

router.post('/',    async (req, res) => {
  // const is_admin = await isAdmin(req.user)
  if (req.params.id == req.user || is_admin.id > 0) {  
    // console.log(req.body, AssignmentSchema);
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

router.get('/:id',    async (req, res) => {
  try {
    // console.log(req.params.id);
    const assignment = await getAssignmentById(req.params.id);
    if (assignment) {
      res.status(200).send(assignment);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch assignment.  Please try again later."
    });
  }
});

/*
 * Route to update an assignment.
 */
router.put('/:id',    async (req, res, next) => {

  // const is_admin = await isAdmin(req.user) 
  // if (req.params.id == req.user || is_admin.id > 0) {  
  if (!(req.params.id == req.user)) {  

  if (validateAgainstSchema(req.body, AssignmentSchema)) {
    try {
      /*
       * Make sure the updated photo has the same businessID and userID as
       * the existing photo.  If it doesn't, respond with a 403 error.  If the
       * photo doesn't already exist, respond with a 404 error.
       */
      const id = (req.params.id);
      const existingAssignment = await getAssignmentById(id);
      if (existingAssignment) {
        // console.log(existingAssignment, req.body.courseId)
        if (req.body.courseId === existingAssignment.courseId) { // && req.body.userid === existingAssignment.userid) {  // CHANGE
          const updateSuccessful = await replaceAssignmentById(id, req.body);
          if (updateSuccessful) {
            res.status(200).send({
              links: {
                course: `/courses/${req.body.courseId}`
                // users: `/users/${req.body._id}`
              }
            });
          } else {
            next();
          }
        } else {
          res.status(403).send({
            error: "Updated assignment must have the same courseId"
          });
        }
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to update assignment.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid assignment object."
    });
  }
} else {
  res.status(403).json({
    error: "Unauthorized to access the specified resource"
  });
}
});

router.delete('/:id',async (req, res, next) => {
  // const is_admin = await isAdmin(req.user);
  if (!(req.params.id == req.user)) {    
  try {
    const deleteSuccessful = await deleteAssignmentById(req.params.id);
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to delete photo.  Please try again later."
    });
  }
} else {
  res.status(403).json({
    error: "Unauthorized to access the specified resource"
  });
}
});

router.get('/:id/submissions',    async (req, res) => {
  try {
    const assignment = await getAssignmentsById(parseInt(req.params.id));
    if (assignment) {
      res.status(200).send(assignment);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch assignment.  Please try again later."
    });
  }
});

module.exports = router;