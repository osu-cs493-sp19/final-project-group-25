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
  const result = await collection.insertOne(user);
  return result.insertedID;
}
exports.insertNewUser = insertNewUser;

async function getUserById(id) {
  const db = getDBReference();
  const collection = db.collection('users');
  const results = await collection.find({ _id: new ObjectId(id) }).toArray();
  return results[0];
}
exports.getUserById = getUserById;

async function getUserByEmail(email) {
  const db = getDBReference();
  const collection = db.collection('users');
  const results = await collection.find({ email: email }).toArray();
  return results[0];
}

async function validateUser(email, password) {
  const user = await getUserByEmail(email);
  const authenticated = user && await bcrypt.compare(password, user.password);
  return authenticated;
}
exports.validateUser = validateUser;
