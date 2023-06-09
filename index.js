const express = require('express');
const cors = require('cors');
const morgan = require('morgan')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middlewares 
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@artzone.efur78y.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    // mongodb connection pooling 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect((err) => {
            if (err) {
                console.log(err)
                return;
            }
        });

        const serviceCollection = client.db('artZone').collection('services')
        const userCollection = client.db('artZone').collection('users')

        app.get('/services', async (req, res) => {
            const result = await serviceCollection.find().toArray()
            res.send(result)
        })

        // add and update user 
        app.put('/users', async (req, res) => {
            const user = req.body;
            const email = req.body.email;
            const filter = { email: email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: user
            }

            const result = await userCollection.updateOne(filter, updatedDoc, options)
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
    res.send('artZone server is running')
})

app.listen(port, () => {
    console.log('artZone in running on', port)
})