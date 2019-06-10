const router = require('express').Router();
const crypto = require('crypto');
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { getAssignmentsById,
  getAssignmentById,
  insertNewAssignment,
  replaceAssignmentById,
  deleteAssignmentById,
  isEnrolled,
  submitFile,
  isTeacher,
  getCID,
  getSubmissionInfo,
  getDownloadStreamById
 } = require('../models/assignment');
 const multer = require('multer');
const fs = require('fs');
const { extractValidFields } = require('../lib/validation');
const { validateAgainstSchema } = require('../lib/validation');

const AssignmentSchema = {
	courseId: { required: true },
	points: { required: true},
	due: { required: true },
	title: { required: true}
};
const fileTypes = {
  'application/pdf': 'pdf'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const basename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = fileTypes[file.mimetype];
      callback(null, `${basename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!fileTypes[file.mimetype])
  }
});


function removeUploadedFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file.path, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

}
/*
* Route to create a new assignemt. ONLY ADMIN or instructor.
*/
router.post('/', requireAuthentication, async (req, res) => {
  if (req.auth == "admin" || req.auth == "instructor") {
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

router.get('/:id', async (req, res) => {
  try {
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
 * Route to update an assignment. ONLY ADMIN or instructor.
 */
router.patch('/:id', requireAuthentication, async (req, res, next) => {
  const course = getCID(req.params.id);
  if (req.auth == "admin" || (req.auth == "instructor" && await isTeacher(course, req.user))) {
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

// ONLY ADMIN or instructor.
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  const course = getCID(req.params.id);
  if (req.auth == "admin" || (req.auth == "instructor" && await isTeacher(course, req.user))) {
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
      error: "Unable to delete assignment.  Please try again later."
    });
  }
} else {
  res.status(403).json({
    error: "Unauthorized to access the specified resource"
  });
}
});

// ONLY ADMIN or instructor.
router.get('/:id/submissions', requireAuthentication,  async (req, res) => {
  const course = getCID(req.params.id);
  if (req.auth == "admin" || (req.auth == "instructor" && await isTeacher(course, req.user))) {
  try{
    const courseId = await getCID(req.params.id);
    if(await isTeacher(courseId, req.user)){
      const list_assign = await getSubmissionInfo(req.params.id);
      if(list_assign){

               res.status(200).send({submissions:list_assign});
      }
      else{
        res.status(403).send({
          error:"Unable to find submissions for this assignment"
        });
      }

    }
    else{
      res.status(404).send({
        error:"Please log in with valid teacher/admin account enrolled in the class you specified"
      });
    }
  } catch(err){
    res.status(500).send({
      error:"The error was: " + err
    })
  }
} else {
  res.status(403).json({
    error: "Unauthorized to access the specified resource"
  });
}
});


// ONLY enrolled student
router.post('/:id/submissions', upload.single('file'),requireAuthentication, async (req,res) =>{
  // console.log("The file is: ",req.file);
  if(req.file && req.body && req.body.assignmentId && req.body.studentId){
  try{
    const courseId = await getCID(req.params.id);
    if(await isEnrolled(courseId,req.user)){
      //in here if student is enrolled in the class provided by the ID
      //the assignment id we are working with : 5cfb24c4916acb0011c71412
      var timeSubmitted = new Date();
      timeSubmitted.toISOString();
      const submittedFile = {
        path: req.file.path,
        filename: req.file.filename,
        contentType: req.file.mimetype,
        assignmentId: req.body.assignmentId,
        studentId: req.body.studentId,
        timestamp: timeSubmitted
      }
      // console.log("We are submitting this: ",submittedFile);
      const id = await submitFile(submittedFile);
      await removeUploadedFile(req.file);
      res.status(200).send({message:"New Submission Successfully added!",id:id});
    }
    else{
      res.status(404).send({
        error:"Please log in with valid student account enrolled in the class you specified"
      });
    }
  } catch(err){
    res.status(500).send({
      error:"The error was: " + err
    })
  }
  }
 else{
  res.status(400).send({
    error:"Please send request with proper form-data"
  });
}
});

router.get('/downloads/submissions/:id', requireAuthentication, async (req,res) =>{
  const courseId = await getCID(req.params.id);
  if(await isEnrolled(courseId, req.user)){
      await getDownloadStreamById(req.params.id)
      .on('error', (err) => {
        if (err.code === 'ENOENT') {
          res.status(404).send({
            error: "Unable to present the submission, please provide a valid id."
          });
        } else {
          res.status(500).send({
            error: "Unable to fetch the submission.  Please try again later."
          });
        }
      })
      .on('file', (file) => {
        res.status(200).send({message:"File download is now accessible!"});
          // res.status(200).type(file.metadata.contentType);
      })
      .pipe(res);
    }
  else{
    res.status(404).send({
      error:"Please log in with valid student account enrolled in the class you specified"
    });
}
});

module.exports = router;
