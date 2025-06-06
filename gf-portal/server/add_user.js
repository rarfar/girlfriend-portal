// Import required modules
const sqlite3 = require('sqlite3').verbose(); // For working with SQLite database
const bcrypt = require('bcryptjs');           // For hashing passwords securely

// Connect to the grievances.db SQLite database (file must exist in the same folder)
const db = new sqlite3.Database('grievances.db');

// Set the username and password for the new user
const username = 'kyra<3';                // The login name you want
const password = 'stinky123';  // The password (will be hashed!)

// Hash the password using bcrypt (10 rounds of salting)
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err; // Stop and show error if hashing fails

  // Insert the new user into the users table, storing the hashed password
  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hash],
    function (err) {
      if (err) {
        // If there is a problem (e.g., username already exists), print the error
        console.error("Error adding user:", err.message);
      } else {
        // Success!
        console.log("User added!");
      }
      // Close the database connection after inserting
      db.close();
    }
  );
});
