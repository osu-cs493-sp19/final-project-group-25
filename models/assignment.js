/*
 * Course schema and data accessor methods;
 */


const router = require('express').Router();
const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

const AssingmentSchema = {
	courseId: { required: true },
	points: { required: true},
	due: { required: true },
	title: { required: true}
};

//   getAssignmentsById,
//   isAdmin,

async function getAssignmentById (id) {
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

exports.getAssignmentById = getAssignmentById;

async function insertNewAssignment (assignment) {
  course = extractValidFields(assignment, AssingmentSchema);
  const db = getDBReference();
  const collection = db.collection('assignments');
  const result = await collection.insertOne(assignment);
  return result.insertedId;
}
exports.insertNewAssignment = insertNewAssignment;



exports.insertNewAssignment = insertNewAssignment;

async function replaceAssignmentById (id, body) {
	const db = getDBReference();
  const courseValues = {
		"courseId": body.courseId,
		"points": body.points,
		"dateDue": body.dateDue,
    "title": body.title,
    "instructorId": body.instructorId
    };
    const collection = db.collection('assignments');
    const result = await collection.replaceOne(
      { _id: new ObjectId(id) },
      courseValues
    );
    return result.matchedCount > 0;
}

exports.replaceAssignmentById = replaceAssignmentById;

async function deleteAssignmentById (id) {
	const db = getDBReference();
  const collection = db.collection('assignments');
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

exports.deleteAssignmentById = deleteAssignmentById;

async function getAssignmentsById (id) {

}

exports.getAssignmentsById = getAssignmentsById;


module.exports = router;
