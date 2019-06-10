/*
 * Course schema and data accessor methods;
 */
const { Parser } = require('json2csv');
const { ObjectId } = require('mongodb');
const stringify = require('csv-stringify');
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
  add: { required: true },
  remove: { required: true }
};
exports.EnrollmentSchema = EnrollmentSchema;

/*
 * Executes a DB query to return a single page of courses.  Returns a
 * Promise that resolves to an array containing the fetched page of courses.
 */
async function getCoursePage(page) {
  const db = getDBReference();
  // const db = getDBRgetAssignmentByIdgetAssignmentByIdeference();
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
  if (!ObjectId.isValid(courseId)) {
    return null;
  } else {
    const results = await collection
      .find({ courseId: courseId })
      .toArray();
    return results[0];
  }
}
exports.getCourseList = getCourseList;

/*
 * Executes a DB query to check if a course enrollment list exists for a given course
 */
async function checkIfCourseListExists(courseId) {
  const db = getDBReference();
  const collection = db.collection('courseLists');
  const course = await collection.findOne({ courseId: courseId });
  if (course != null) {
    return true;
  } else {
    return false;
  }
}
exports.checkIfCourseListExists = checkIfCourseListExists;

/*
 * Executes a DB query to insert enrollment information about a single specified
 * course list on its ID.
 */
 async function insertEnrollment(courseId, modifications) {
   const db = getDBReference();
   const collection = db.collection('courseLists');
   if (!ObjectId.isValid(courseId)) {
     return null;
   } else {
       // Create enrollment list based on modifications add
       var newEnrollmentList = []; // Empty enrollment list
       var newEnrollmentList = newEnrollmentList.concat(modifications.add);
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
      var newEnrollmentList = []; // Empty new enrollment list
      // Find the list id based on provided course id if exists
      const course = await collection.find({ courseId: courseId }).toArray();
      const courseList = course[0]; // Store course list cursor
      const listId = courseList._id; // Course list id
      const studentIds = courseList.enrolled; // Course list studentids

      // Modify enrollment object based on modifications
      newEnrollmentList = studentIds.concat(modifications.add); // Add ids
      newEnrollmentList = newEnrollmentList.filter(x => modifications.remove.indexOf(x) == -1); // Remove ids

      // Update list with modified object
      const result = await collection.updateOne(
        { _id: new ObjectId(listId) },
        { $set: { enrolled: newEnrollmentList }}
      );
      return result.matchedCount > 0;
  }
}
exports.modifyEnrollment = modifyEnrollment;

async function getCourseRoster(courseId){
  const db = getDBReference();
  const collection = db.collection('courseLists');
  const userCollection = db.collection('users');
  if(!ObjectId.isValid(courseId)){
        console.log("Enter a valid course ID please");
        return null;
  }else{
      const class_data = await collection.find({ courseId: courseId }).toArray();
      //recieved object for the business
      var dataList = [];
      const studentsArray = class_data[0].enrolled;
      for(var i =0; i < studentsArray.length;i++){
        if(ObjectId.isValid(studentsArray[i])){
          var studentInfo = await userCollection.find({_id: new ObjectId(studentsArray[i])}).toArray();

          // var studentInfo = [
          //   {
          //       "name": "Rob Hess",
          //       "email": "robhess@gmail.com",
          //       "password": "hunter2",
          //       "role":"instructor"
          //     },
          //     {
          //         "name": "Nikhil Anand",
          //         "email": "nikhil@gmail.com",
          //         "password": "password",
          //         "role":"student"
          //     },
          //     {
          //         "name": "Harsh Singh",
          //         "email": "admin@gmail.com",
          //         "password": "password",
          //         "role":"admin"
          //     }
          // ]
            dataList.push(studentInfo[0]); // should be 0 but putting i for testing
          }
        }
        const fields = ['_id','name','email'];
        // const fields = ['role','name','email'];
        const json2csvParser = new Parser({fields});
        const csvFile = json2csvParser.parse(dataList);
        console.log("The csv file is: ", csvFile);
        // console.log("The id we are looking for is: ",courseId,"The students we found are : ",students);
        return csvFile;

  }
}
exports.getCourseRoster = getCourseRoster;



async function getCourseAssignments(courseId){
  const db = getDBReference();
  const collection = db.collection('assignments');
  var courseAssignments = [];
  if(!ObjectId.isValid(courseId)){
        console.log("Enter a valid course ID please");
        return null;
  }else{
      const assignments = await collection.find({ courseId: courseId }).toArray();
      // const assignments = [
      //   {
      //       "_id": "999"
      //     },
      //     {
      //       "_id": "222"
      //     },
      //     {
      //       "_id": "333"
      //     }
      // ]
        //recieved object with all the assignments for a course
      for(var i =0; i < assignments.length;i++){
        courseAssignments.push(assignments[i]._id);
    }
    return courseAssignments;
  }
}

exports.getCourseAssignments = getCourseAssignments;
