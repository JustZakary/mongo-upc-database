import express from 'express';
import {MongoClient} from 'mongodb';

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'upcdatabase';
const collectionName = 'upcs';

const app = express();
app.use(express.json());

let db;

// Connect to MongoDB once and reuse the database connection
MongoClient.connect(mongoUrl, {useUnifiedTopology: true})
  .then((client) => {
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.error(err));

// POST: Create a new UPC entry
app.post('/upc', async (req, res) => {
  try {
    const newEntry = req.body;
    const result = await db.collection(collectionName).insertOne(newEntry);
    res.status(201).json(result.ops ? result.ops[0] : newEntry);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

//Get/retailers:  Get count of products by retailer
app.get('/retailers', async (req, res) => {
  try {
    const retailersCount = await db
      .collection(collectionName)
      .aggregate([{$unwind: '$retailers'}, {$group: {_id: '$retailers.retailer', count: {$sum: 1}}}])
      .toArray();
    res.json(retailersCount);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// GET/:id: Retrieve a specific UPC entry by id
app.get('/upc/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const entry = await db.collection(collectionName).findOne({_id: id});
    if (!entry) return res.status(404).json({message: 'Entry not found'});
    res.json(entry);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// PUT: Update a UPC entry by id
app.put('/upc/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    const result = await db.collection(collectionName).updateOne({_id: id}, {$set: updateData});
    if (result.matchedCount === 0) return res.status(404).json({message: 'Entry not found'});
    res.json({message: 'Entry updated successfully'});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// DELETE: Remove a UPC entry by id
app.delete('/upc/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.collection(collectionName).deleteOne({_id: id});
    if (result.deletedCount === 0) return res.status(404).json({message: 'Entry not found'});
    res.json({message: 'Entry deleted successfully'});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
