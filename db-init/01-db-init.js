db.users.insertMany([
  {
      "name": "Rob Hess",
      "email": "robhess@gmail.com",
      "password": "hunter2",
      "role":"instructor"
    },
    {
        "name": "Nikhil Anand",
        "email": "nikhil@gmail.com",
        "password": "password",
        "role":"student"
    },
    {
        "name": "Harsh Singh",
        "email": "admin@gmail.com",
        "password": "password",
        "role":"admin"
    }
]);

db.courses.insertMany([
  {
    "subject": "CS",
    "number": "493",
    "title": "Cloud Application Development",
    "term": "sp19",
    "instructorId": "123"
  },
  {
    "subject": "CS",
    "number": "492",
    "title": "Mobile Application Development",
    "term": "sp19",
    "instructorId": "456"
  }
]);

db.courseLists.insertMany([
  {
    "courseId": "abc123",
    "enrolled": [
      "123",
      "456",
      "789"
    ]
  },
  {
    "courseId": "def456",
    "enrolled": [
      "456",
      "000",
      "123"
    ]
  }
]);
