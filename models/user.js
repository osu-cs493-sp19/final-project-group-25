const { ObjectId } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
const bcrypt = require('bcryptjs');

const UserSchema = {
  name: { required:true },
  email: { required: true },
  password: {required: true },
  role: { required: true }
};
exports.UserSchema = UserSchema;

const LoginSchema = {
  email: { required:true },
  password: { required: true}
};
exports.LoginSchema = LoginSchema;

async function insertNewUser(user) {
  user = extractValidFields(user, UserSchema);
  const db = getDBReference();
  const collection = db.collection('users');
  const passwordHash = await bcrypt.hash(user.password, 8);
  user.password = passwordHash;
  console.log("==PASSWORDHASH " + passwordHash);
  const result = await collection.insertOne(user);
  console.log("==RESULT " + result);
  console.log("==RESULT.INSERTEDID " + result.insertedId);
  return result.insertedId;
}
exports.insertNewUser = insertNewUser;

async function getUserById(id, includePassword) {
  const db = getDBReference();
  const collection = db.collection('users');
  const results = await collection.find({ _id: new ObjectId(id) }).toArray();
  console.log("==RESULTS[0] (id)" + results[0])
  return results[0];
}
exports.getUserById = getUserById;

async function getUserByEmail(email) {
  const db = getDBReference();
  const collection = db.collection('users');
  const getEmail = { email: email };
  const results = await collection.find(getEmail).toArray();
  console.log("==RESULTS[0] (email)" + results[0])
  return results[0];
}
exports.getUserByEmail = getUserByEmail;

async function getStudentInformationById(id) {
  const student = await getUserById(id);
  if (student) {
    student.courses = await getCoursesByStudentId(id);
  }
  return student;
}
exports.getStudentInformationById = getStudentInformationById;

async function getCoursesByStudentId(id) {
  const db = getDBReference();
  const collection = db.collection('students');
  if (!ObjectId.isValid(id)){
    return [];
  } else {
    const results = await collection
      .find({ 'studentId.$id': new ObjectId(id) })
      .project({ studentId:0, _id:0})
      .toArray();
    return results;
  }
}
exports.getCoursesByStudentId = getCoursesByStudentId;

async function getInstructorInformationById(id) {
  const instructor = await getUserById(id);
  if (instructor) {
    instructor.courses = await getCoursesByInstructorId(id);
  }
  return instructor;
}
exports.getInstructorInformationById = getInstructorInformationById;

async function getCoursesByInstructorId(id){
  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
    return [];
  } else {
    const instructors = await collection
      .find({'instructorId.$id': new ObjectId(id)})
      .project({_id: 0})
      .toArray();

    return instructors;
  }
}
exports.getCoursesByInstructorId = getCoursesByInstructorId;

async function validateUser(id, password) {
  const user = await getUserById(id, true);
  const authenticated = user && await bcrypt.compare(password, user.password);
  return authenticated;
}
exports.validateUser = validateUser;
