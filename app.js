const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http:localhost/3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserInfo = `
  SELECT 
    * 
  FROM 
    user
  WHERE username = '${username}';`;
  const dbUser = await db.get(getUserInfo);

  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const userCreationQuery = `
      INSERT INTO 
        user(username,name,password,gender,location)
      VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newUser = await db.run(userCreationQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserInfo = `
  SELECT 
    * 
  FROM 
    user
  WHERE username = '${username}';`;
  const dbUser = await db.get(getUserInfo);
  //console.log(dbUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
    // console.log("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newHashPassword = await bcrypt.hash(newPassword, 10);
  const getUserInfo = `
  SELECT 
    * 
  FROM 
    user
  WHERE username = '${username}';`;
  const dbUser = await db.get(getUserInfo);
  console.log(dbUser);

  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  console.log(isPasswordMatched);
  if (isPasswordMatched) {
    const updatePasswordQuery = `
        UPDATE user
        SET password = '${newHashPassword}' 
        WHERE username = '${username}';`;
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else if (isPasswordMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
