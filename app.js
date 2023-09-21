// Import necessary packages and modules
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const { MongoClient } = require('mongodb');
const app = express(); // Create an Express application
const port = 3000; // Define the port to listen on

// Middleware configuration
app.use(fileUpload()); // Enable file uploads
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(bodyParser.urlencoded({ extended: true })); // Parse request bodies as URL-encoded data
app.set('view engine', 'ejs'); // Set the view engine to EJS

// MongoDB configuration
const dbName = 'school'; // Database name
const collectionName = 'students'; // Collection name
const mongoURI =
  'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.6'; // MongoDB URI
const client = new MongoClient(mongoURI); // Create a MongoDB client

// Define a route for handling form submissions to add a new student
app.post('/submit', async (req, res) => {
  try {
    // Connect to the MongoDB server
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Create a data object to insert into the collection
    const dataToInsert = {
      name: req.body.name,
      father: req.body.father,
      email: req.body.email,
      age: req.body.age,
      id: generateRandomNumericId(20), // Generate a random ID for the student
    };

    // Insert the data into the collection
    await collection.insertOne(dataToInsert);

    // Redirect to the homepage
    res.redirect('/');
  } catch (err) {
    // If an error occurs, render an error page
    renderErrorPage(res, 'Student could not be added!');
  }
});

// Define a route for displaying a confirmation page before deleting a student
app.post('/delete-conf', (req, res) => res.render('delete.ejs', { id: req.body.id }));

// Define a route for handling student deletion
app.post('/delete', async (req, res) => {
  const id = req.body.id;
  try {
    // Connect to the MongoDB server
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Define a query to find the student by their ID
    const query = { id: id };

    // Delete the student using the query
    const result = await collection.deleteOne(query);

    // Check if a student was deleted and log a message
    if (result.deletedCount === 1) console.log(`Student with ID has been deleted`);
    else console.log(`Student with ID not found`);

    // Redirect to the homepage
    res.redirect('/');
  } catch (error) {
    // If an error occurs, render an error page
    renderErrorPage(res, 'Student could not be deleted');
  }
});

// Define a route for handling student data updates
app.post('/update', async (req, res) => {
  const query = { id: req.body.id };

  // Create an object with the updated student data
  const updateData = {
    $set: {
      name: req.body.name,
      father: req.body.father,
      email: req.body.email,
      age: req.body.age,
    },
  };

  try {
    // Connect to the MongoDB server
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Update the student data using the query and update data
    const result = await collection.findOneAndUpdate(query, updateData, {
      returnOriginal: false,
    });

    // Check if a document was updated and redirect to the homepage
    if (result) res.redirect('/');
    else console.log('No document was updated');
  } catch (error) {
    // If an error occurs, render an error page
    renderErrorPage(res, 'Student data could not be updated');
  } finally {
    // Close the MongoDB client connection
    client.close();
  }
});

// Define a route for displaying the form to add a new student
app.get('/add', (req, res) => res.render('add.ejs', {}));

// Define a route for editing a student's data
app.get('/edit', async (req, res) => {
  try {
    // Find a student by their ID
    const user = await findItemById(req.query.userId);

    // Render the edit form with the student's data
    res.render('edit.ejs', { user, id: user.id });
  } catch (error) {
    // If an error occurs, render an error page
    renderErrorPage(res, 'Student data not found!');
  }
});

// Function to generate a random numeric ID of a specified length
function generateRandomNumericId(length) {
  let id = '';
  for (let i = 0; i < length; i++) id += Math.floor(Math.random() * 10);
  return id;
}

// Function to find a student by their ID
async function findItemById(itemId) {
  try {
    // Connect to the MongoDB server
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Find a student by their ID
    const item = await collection.findOne({ id: itemId });

    // If the student is found, return it
    if (item) return item;
    else console.log('Item not found');
  } catch (error) {
    // If an error occurs, render an error page
    renderErrorPage(res, 'Student not found!');
  } finally {
    // Close the MongoDB client connection
    client.close();
  }
}

// Define a route for the homepage
app.get('/', async (req, res) => {
  try {
    // Connect to the MongoDB server
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Retrieve all student data from the collection
    const data = await collection.find({}).toArray();

    // Render the homepage with the student data
    res.render('all.ejs', { users: data });
  } catch (error) {
    // If an error occurs, render an error page
    renderErrorPage(res, 'Page not found!');
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
});

// Function to render an error page with an error message
function renderErrorPage(res, error) {
  res.render('error.ejs', { errorMessage: error });
}

// Start the Express server and listen on the defined port
app.listen(port, () => console.log(`Server is running on port ${port}`));
