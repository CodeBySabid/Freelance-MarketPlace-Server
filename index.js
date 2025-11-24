require('dotenv').config()
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.URI;

app.use(cors())
app.use(express.json())


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db('marketplace');
    const modelCollection = db.collection('users');
    const acceptedJobsCollection = db.collection('acceptedJobs')
    const { ObjectId } = require("mongodb");

    app.post('/accepted', async (req, res) => {
      try {
        const job = req.body;
        const exists = await acceptedJobsCollection.findOne({
          jobId: job.jobId,
          acceptedBy: job.acceptedBy
        });
        if (exists) {
          return res.status(400).send({ message: "You already accepted this job!" });
        }
        const result = await acceptedJobsCollection.insertOne(job);
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "Error saving job", error })
      }
    })

    app.post('/users', async (req, res) => {
      try {
        const newJob = req.body;
        const result = await modelCollection.insertOne(newJob);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error adding job", error });
      }
    });

    app.get('/my-jobs', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ message: 'Email is required' })
        const result = await modelCollection.find({ userEmail: email }).toArray();
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "Error fetching jobs", error })
      }
    })


    app.delete('/job/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await modelCollection.deleteOne({ _id: new ObjectId(id) });

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to delete job", error });
      }
    });


    app.get('/users', async (req, res) => {
      const result = await modelCollection.find().toArray();
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Server is running')
})

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
