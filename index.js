const bodyParser = require("body-parser");
const { application, Router } = require("express");
const express = require("express");
const passwordHash = require("password-hash");
const ejs = require('ejs');
const app = express();

const port = 3000;

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

var serviceAccount = require("./key1.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

app.set("view engine", "ejs");
app.set('views', './views')


app.use(bodyParser.urlencoded({
  extended: true
}));

function hashPassword(password) {
  return passwordHash.generate(password);
}
app.get("/", (req, res) => {
  res.render("index");
});
app.get('/up', (req, res) => { res.render("signup", { data: " " }); });
app.get('/in', (req, res) => { res.render("signin", { data1: " " }); });
app.get('/dashboard', (req, res) => { res.render("studentregister"); });

app.get("/signin", (req, res) => { res.render("signin"); });
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/signupsubmit", (req, res) => {
  const full_name = req.query.full_name;
  const last_name = req.query.last_name;
  const email = req.query.email;
  const password = req.query.password;
  const Status = req.query.status;

  // Check if the email address doesn't end with "@vishnu.edu.in"
  if (Status === "student" && !email.endsWith("@vishnu.edu.in")) {
    res.render("signup", { data: "Student email address must belong to the @vishnu.edu.in domain." });
    return;
  }

  // The email address is unique and meets the domain requirement, proceed with registration
  const modifiedEmail = email; // No need to modify the email if it's from the allowed domain

  // Hash the password (using password-hash)
  const hashedPassword = hashPassword(password);

  if (Status === "teacher") {
    // Add the teacher to the database with the hashed password
    var faculty = db.collection("allusers");
    faculty.add({
      name: full_name + last_name,
      email: modifiedEmail,
      password: hashedPassword,
      role: Status,
    })
      .then(() => {
        res.render("hodashboard");
      });
  } else if (Status === "student") {
    // Add the student to the database with the hashed password
    var student = db.collection("allusers");
    student.add({
      name: full_name + last_name,
      email: modifiedEmail,
      password: hashedPassword,
      role: Status,
    })
      .then(() => {
        res.render("studashboard");
      });
  } else {
    res.send("Signup failed");
  }
});


app.get("/signinsubmit", (req, res) => {
  const email = req.query.email;
  const password = req.query.password;
  const Passcode = req.query.code;

  // Query the database to find the user by email
  db.collection("allusers")
    .where("email", "==", email)
    .get()
    .then((docs) => {
      if (!docs.empty) {
        const user = docs.docs[0].data();
        const storedHashedPassword = user.password;

        // Verify the password using password-hash
        if (passwordHash.verify(password, storedHashedPassword)) {
          // Password is correct
          if (Passcode == "student" && user.role === "student") {
            // User is a student
            // Query for student data and render the student dashboard
            // Example: You can add your code to fetch student data here
            res.render("studashboard", { thestud: user });
          } else if (Passcode == "teacher" && user.role === "teacher") {
            // User is a teacher
            // Query for teacher data and render the teacher dashboard
            // Example: You can add your code to fetch teacher data here
            res.render("hodashboard", { userData: user });
          } else {
            res.render("signin", { data1: "Invalid user role" });
          }
        } else {
          res.render('signin', { data1: "Invalid password" });
        }
      } else {
        res.render('signin', { data1: "User not found" });
      }
    })
    .catch((error) => {
      console.error("Error querying the database:", error);
      res.send("An error occurred");
    });
});

app.get('/studentregistr', (req, res) => {
  const full_name = req.query.First_Name;
  const last_name = req.query.Last_Name;
  const regId = req.query.RegId;
  const email = req.query.Email_Id;
  const semno = req.query.Semno;
  const branchname = req.query.branch;
  const Update = req.query.update
  const result = db.collection("student register").add({
    name: full_name + " " + last_name,
    email: email,
    registerNumber: regId,
    CurrentSemNumber: semno,
    Branch: branchname,
    update: Update,

  }).then(() => {
    res.send("Registered sucessfully");
  });
});
app.get('/hodashboard', (req, res) => {
  res.render("teacherregister");
});
app.get('/postingcse', (req, res) => {
  res.render("postmarks");
});
app.get('/postingece', (req, res) => {
  res.render("postmarks");
});
app.get('/postingcivil', (req, res) => {
  res.render("postmarks");
});

app.get('/postmark', (req, res) => {
  const branchcse = "CSE";
  const branchece = "ECE";
  const branchcil = "CIVIL";
  const studentname = req.query.stud_name;
  const registerno = req.query.rol_no;
  const bran = req.query.branch;
  const semNo = req.query.semnum;
  const Cgpa = req.query.cgpa;
  const Attend = req.query.attendence;
  const remark = req.query.remarks;
  const markinfo = db.collection("marksentered").add({
    Studentname: studentname,
    RegistrationNumber: registerno,
    CurrentSemisterNum: semNo,
    BranchName: bran,
    CGPA: Cgpa,
    attendence: Attend,
    Remarks: remark,

  });
  var info = db.collection('student register').where("Branch", "==", branchcse).where("registerNumber", "==", registerno).get().then((querySnapshot) => {
    querySnapshot.forEach(function(document) {
      document.ref.update({
        'update': 'yes',
      });
    })
  });
  var info = db.collection('student register').where("Branch", "==", branchece).where("registerNumber", "==", registerno).get().then((querySnapshot) => {
    querySnapshot.forEach(function(document) {
      document.ref.update({
        'update': 'yes',
      });
    })
  });
  var info = db.collection('student register').where("Branch", "==", branchcil).where("registerNumber", "==", registerno).get().then((querySnapshot) => {
    querySnapshot.forEach(function(document) {
      document.ref.update({
        'update': 'yes',
      });
    })
  }).then(() => {
    res.send("Marks posted sucessfully");
  })
});

app.get('/studduecse', (req, res) => {
  var datas = [];

  db.collection('student register').where("Branch", "==", "CSE").where("update", "==", "no").get()
    .then((docs) => {
      docs.forEach((doc) => {
        datas.push(doc.data());

      });
    }).then(() => {
      res.render("postcse", { thestudent: datas });
      console.log(datas);
    })
});
app.get('/ece', (req, res) => {
  var datak = [];
  db.collection('student register').where("Branch", "==", "ECE").where("update", "==", "no").get()
    .then((docs) => {
      docs.forEach((doc) => {
        datak.push(doc.data());

      });
    })
    .then(() => {
      res.render("postcse", { thestudent: datak });
      console.log(datak);
    })
});
app.get('/civil', (req, res) => {
  var datav = [];
  db.collection('student register').where("Branch", "==", "CIVIL").where("update", "==", "no").get()
    .then((docs) => {
      docs.forEach((doc) => {
        datav.push(doc.data());

      });
    })
    .then(() => {
      res.render("postcse", { thestudent: datav });
      console.log(datav);
    })
});

app.get('/teacherregistr', (req, res) => {
  const full_name = req.query.First_Name;
  const last_name = req.query.Last_Name;
  const regId = req.query.RegId;
  const email = req.query.Email_Id;
  const Branc = req.query.branch;
  const techerinfo = db.collection("teacherregister");
  techerinfo.add({
    name: full_name + last_name,
    email: email,
    Branch: Branc,

  }).then(() => {
    res.send("Registered sucessfully");
  });
});
app.get('/markget', (req, res) => {
  res.render("ask");
});
app.get('/hark', (req, res) => {
  const roll = req.query.Regid;
  const bran = req.query.branchh;
  var datax = [];
  db.collection("student register").where('registerNumber', '==', roll).where('Branch', '==', bran).get().then(async (docs) => {

    var refer = await db.collection("marksentered").where('RegistrationNumber', '==', roll).where('BranchName', '==', bran).get();
    refer.forEach((doc) => {
      datax.push(doc.data());
    });
  }).then(() => {
    res.render("marks", { marks: datax });
    console.log(datax);
  });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
}); 