/*
 * Course schema and data accessor methods;
 */

const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

/*
* Schema describing required/optional fields of a course object.
*/
const CourseSchema = {
  subject: { required: true },
  number: { required: true },
  title: { required: true },
  term: { required: true },
  instructorId: { required: true }
};
exports.CourseSchema = CourseSchema;

/*
* Schema describing required/optional fields of a course enrollment object.
*/
const EnrollmentSchema = {
  add: { required: false },
  remove: { required: false }
};
exports.EnrollmentSchema = EnrollmentSchema;

/*
 * Executes a DB query to return a single page of courses.  Returns a
 * Promise that resolves to an array containing the fetched page of courses.
 */
async function getCoursePage(page) {
  const db = getDBReference();
  const collection = db.collection('courses');
  const count = await collection.countDocuments();

  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const results = await collection.find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    courses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
}
exports.getCoursePage = getCoursePage;

/*
 * Executes a DB query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created course entry.
 */
async function insertNewCourse(course) {
  course = extractValidFields(course, CourseSchema);
  const db = getDBReference();
  const collection = db.collection('courses');
  const result = await collection.insertOne(course);
  return result.insertedId;
}
exports.insertNewCourse = insertNewCourse;

/*
 * Executes a DB query to fetch information about a single specified
 * course based on its ID. Returns a Promise that resolves to an object containing
 * information about the requested course.  If no course with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getCourseById(id) {
  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}
exports.getCourseById = getCourseById;

/*
 * Executes a DB query to update information about a single specified
 * course based on its ID.
 */
async function updateCourse(id, courseData) {
  const db = getDBReference();
  const courseValues = {
      "subject": courseData.subject,
      "number": courseData.number,
      "title": courseData.title,
      "term": courseData.term,
      "instructorId": courseData.instructorId
    };
    const collection = db.collection('courses');
    const result = await collection.replaceOne(
      { _id: new ObjectId(id) },
      courseValues
    );
    return result.matchedCount > 0;
};
exports.updateCourse = updateCourse;

/*
 * Executes a DB query to delete a single specified
 * course based on its ID.
 */
async function deleteCourse(id) {
  const db = getDBReference();
  const collection = db.collection('courses');
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
exports.deleteCourse = deleteCourse;

/*
 * Executes a DB query to fetch information about a single specified
 * course list on its ID.
 */
async function getCourseList(courseId) {
  const db = getDBReference();
  const collection = db.collection('courseLists');
  //if (!ObjectId.isValid(courseId)) {
  //  return null;
  //} else {
    const results = await collection
      .find({ courseId: courseId })
      .toArray();
    return results[0];
  //}
}
exports.getCourseList = getCourseList;


/*
 * Executes a DB query to insert enrollment information about a single specified
 * course list on its ID.
 */
 async function insertEnrollment(courseId, modifications) {
   console.log("== in insertEnrollment");
   const db = getDBReference();
   const collection = db.collection('courseLists');
   if (!ObjectId.isValid(courseId)) {
     return null;
   } else {
       var newEnrollmentList = ["000", "000", "000"];
       // Modify enrollment object based on modifications

       // Insert a new course list
       const result = await collection.insertOne({
         courseId: courseId,
         enrolled: newEnrollmentList });
       return result.insertedId;
   }
 }
 exports.insertEnrollment = insertEnrollment;


/*
 * Executes a DB query to modify enrollment information about a single specified
 * course list on its ID.
 */
async function modifyEnrollment(courseId, modifications) {
  const db = getDBReference();
  const collection = db.collection('courseLists');
  if (!ObjectId.isValid(courseId)) {
    return null;
  } else {
      var newEnrollmentList = ["999", "999", "999"];
      // Find the list id based on provided course id if exists
      const course = await collection.find({ courseId: courseId }).toArray();
      const listId = course[0]._id;

      // Modify enrollment object based on modifications

      // Update list with modified object
      const result = await collection.updateOne(
        { _id: new ObjectId(listId) },
        { $set: { enrolled: newEnrollmentList }}
      );
      return result.matchedCount > 0;
  }
}
exports.modifyEnrollment = modifyEnrollment;
