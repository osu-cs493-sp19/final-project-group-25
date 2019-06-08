/*
 * Course schema and data accessor methods;
 */


// const router = require('express').Router();
const { ObjectId,GridFSBucket } = require('mongodb');
const fs = require('fs');
const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

const AssignmentSchema = {
	courseId: { required: true },
	points: { required: true},
	due: { required: true },
	title: { required: true}
};

exports.AssignmentSchema = AssignmentSchema;
//   getAssignmentsById,
//   isAdmin,

async function getAssignmentById (id) {
  const db = getDBReference();
  const collection = db.collection('assignments');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    console.log(results, id);
    return results[0];
  }
}

exports.getAssignmentById = getAssignmentById;

async function insertNewAssignment (assignment) {
  course = extractValidFields(assignment, AssignmentSchema);
  const db = getDBReference();
  const collection = db.collection('assignments');
  const result = await collection.insertOne(assignment);
  return result.insertedId;
}
exports.insertNewAssignment = insertNewAssignment;




async function replaceAssignmentById (id, body) {
	const db = getDBReference();
  const courseValues = {
		"courseId": body.courseId,
		"points": body.points,
		"due": body.due,
    "title": body.title
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

async function isEnrolled(courseId, studentId){
	// console.log("The courseId is: ", courseId," and the Studentid is: ", studentId);
	const db = getDBReference();
	const collection = db.collection('courseLists');
	//test studentid : 5cfb0a0eebed9100134e4d6c
	//test teacherid: 5cfb3e784811c4001213c41b
	console.log("courseId is: ",courseId, "And studentId is: ",studentId);
	try{
		var listofEnrolled = await collection.find({courseId: courseId}).toArray();

		listofEnrolled = listofEnrolled[0].enrolled;

		for(var i = 0; i < listofEnrolled.length; i++){
			if(listofEnrolled[i]=== studentId){
				// console.log("Finall Matched here: ", listofEnrolled[i]);
				return true;
			}
		}
		return false;
	} catch(err){
		return false;
	}


}
exports.isEnrolled = isEnrolled;

function submitFile(submission){
	return new Promise((resolve,reject) =>{
	const db = getDBReference();
		const bucket = new GridFSBucket(db, {bucketName: 'submissions'});
		const metadata = {
			contentType: submission.contentType,
			Assignment_Id: submission.assignmentId,
			Student_Id: submission.studentId
		}
		const uploadStream = bucket.openUploadStream(
			submission.submissionname,
			{metadata:metadata}
		);
		// console.log("The path is: ", submission);
		fs.createReadStream(submission.path).pipe(uploadStream).on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
  });
}
exports.submitFile = submitFile;


async function isTeacher(courseId, TeacherId){
	// console.log("The courseId is: ", courseId," and the Studentid is: ", studentId);
	const db = getDBReference();
	const collection = db.collection('courses');
	//test studentid : 5cfb0a0eebed9100134e4d6c
	//test teacherid: 5cfb3e784811c4001213c41b
	// console.log("The teacherId we got is: ",TeacherId);
	try{
		var course = await collection.find({_id: new ObjectId(courseId)}).toArray();
		course = course[0];
		if(course.instructorId === TeacherId){
			return true;
		}
		return false;
	} catch(err){
		return false;
	}
}
exports.isTeacher = isTeacher;


async function getSubmissionInfo(data){
	const db = getDBReference();
	const bucket = new GridFSBucket(db, {bucketName: 'submissions'});
  const results = await bucket.find({'metadata.Assignment_Id': data}).toArray();
	var responseBody = [];
	if(results[0]){
		for(var i = 0; i<results.length; i++){
			responseBody.push({
				"AssignmentId": results[i].metadata.Assignment_Id,
				"StudentId": results[i].metadata.Student_Id,
				"Timestamp": results[i].uploadDate,
				"file": "/assignments/downloads/submissions/"+results[i]._id
			});
		}
		return responseBody;
	} else{
		return false;
	}

}
exports.getSubmissionInfo = getSubmissionInfo
async function getCID(id){
	const db = getDBReference();
	const collection = db.collection('assignments');
	const assingnment = await getAssignmentById(id);
	return assingnment.courseId;
}
exports.getCID = getCID;

exports.getDownloadStreamById = function (id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
	if (!ObjectId.isValid(id)) {
    return null;
  } else {
    return bucket.openDownloadStream(new ObjectId(id));
  }
};
