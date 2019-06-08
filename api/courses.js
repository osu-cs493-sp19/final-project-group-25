/*
 * API sub-router for courses collection endpoints.
 */

const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const {
  CourseSchema,
  EnrollmentSchema,
  getCoursePage,
  insertNewCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseList,
  checkIfCourseListExists,
  insertEnrollment,
  modifyEnrollment,
  getCourseRoster,
  getCourseAssignments,
  isTeacher
} = require('../models/course');

/*
 * Route to return a paginated list of courses.
 */
router.get('/', async (req, res) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const coursePage = await getCoursePage(parseInt(req.query.page) || 1);
    coursePage.links = {};
    if (coursePage.page < coursePage.totalPages) {
      coursePage.links.nextPage = `/courses?page=${coursePage.page + 1}`;
      coursePage.links.lastPage = `/courses?page=${coursePage.totalPages}`;
    }
    if (coursePage.page > 1) {
      coursePage.links.prevPage = `/courses?page=${coursePage.page - 1}`;
      coursePage.links.firstPage = '/courses?page=1';
    }
    res.status(200).send(coursePage);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching course list.  Please try again later."
    });
  }
});

/*
 * Route to create a new course.
 */
//router.post('/', requireAuthentication, async (req, res) => {
router.post('/', async (req, res) => {
  //if (req.body.ownerid == req.user || req.admin == 1) {
    if (validateAgainstSchema(req.body, CourseSchema)) {
      try {
        const id = await insertNewCourse(req.body);
        res.status(201).send({
          id: id,
          links: {
            course: `/courses/${id}`
          }
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting course into DB.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid course object."
      });
    }
  /*} else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }*/
});


/*
 * Route to fetch info about a specific course.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const course = await getCourseById(req.params.id);
    if (course) {
      res.status(200).send(course);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch course.  Please try again later."
    });
  }
});

/*
 * Route to replace data for a business.
 */
//router.put('/:id', requireAuthentication, async (req, res, next) => {
router.patch('/:id', async (req, res, next) => {
  //if (req.body.ownerid == req.user || req.admin == 1) {
    if (validateAgainstSchema(req.body, CourseSchema)) {
      try {
        const id = req.params.id;
        const updateSuccessful = await updateCourse(id, req.body);
        if (updateSuccessful) {
          res.status(200).send({
            links: {
              course: `/courses/${id}`
            }
          });
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to update specified course.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid course object"
      });
    }
  /*} else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }*/
});

/*
 * Route to delete a course.
 */
//router.delete('/:id', requireAuthentication, async (req, res, next) => {
router.delete('/:id', async (req, res, next) => {
  //if (req.body.ownerid == req.user || req.admin == 1) {
    try {
      const deleteSuccessful = await deleteCourse(req.params.id);
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to delete course.  Please try again later."
      });
    }
  /*} else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }*/
});


/*
 * Route to fetch list of students enrolled in a specific course.
 */
router.get('/:id/students', async (req, res, next) => {
  try {
    const course = await getCourseList(req.params.id);
    if (course) {
      res.status(200).send(course);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch course list.  Please try again later."
    });
  }
});



/*
 * Route to enroll students in a course.
 */
//router.post('/', requireAuthentication, async (req, res) => {
router.post('/:id/students', async (req, res) => {
  //if (req.body.ownerid == req.user || req.admin == 1) {
    if (validateAgainstSchema(req.body, EnrollmentSchema)) {
      try {
        const courseId = req.params.id; // Sets the course id
        var listId = null; // Create var to hold returned listId
        const listExists = await checkIfCourseListExists(courseId); // Check if course list exists

        // If the list does not exist, insert else modify
        if (!listExists) {
          listId = await insertEnrollment(courseId, req.body);
        } else {
          listId = await modifyEnrollment(courseId, req.body);
        }

        res.status(201).send({
          listId: listId, // Sends back listId
          links: { // Returns link to fetch course list
            course: `/courses/${courseId}/students`
          }
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting course list into DB.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid enrollment list object."
      });
    }
  /*} else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }*/
});


router.get('/:id/roster', requireAuthentication, async (req, res) => {

// Code to authenticate that it is an instructor or admin who is accessing this dada
// console.log("in roster function");
  if(await isTeacher(req.params.id,req.user)){
try{
    const courseId = req.params.id;
  const csv = await getCourseRoster(courseId);
  res.attachment('roster.csv');
  res.status(200).send(csv);
}

catch(err){
console.error("Specified Course ID was not found");
res.status(404).send({
  error: "Specified Course ID was not found!"
});

}
} else{
    res.status(404).send({
      error:"Please log in with valid teacher/admin account enrolled in the class you specified"
    });

}
});

router.get('/:id/assignments', async (req, res) => {

// Code to authenticate that it is an instructor or admin who is accessing this dada

try{
    const courseId = req.params.id;
  const assignments = await getCourseAssignments(courseId);
  res.status(200).send({
    assignments: assignments
  });
}
catch(err){
console.error("Specified Course ID was not found");
res.status(404).send({
  error: "Specified Course ID was not found!"
});

}
});
module.exports = router;
