/*
 * Course schema and data accessor methods;
 */

const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

const AssingmentSchema = {
	courseId: { required: true },
	points: { required: true},
	due: { required: true }
};

//   getAssignmentsById,
//   isAdmin,

async function getAssignmentById (id) {

}

exports.getAssignmentById = getAssignmentById;

async function insertNewAssignment (assignment) {

}

exports.insertNewAssignment = insertNewAssignment;

async function replaceAssignmentById (id) {

}

exports.replaceAssignmentById = replaceAssignmentById;

async function deleteAssignmentById (id) {

}

exports.deleteAssignmentById = deleteAssignmentById;

async function getAssignmentsById (id) {

}

exports.getAssignmentsById = getAssignmentsById;