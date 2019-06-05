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
