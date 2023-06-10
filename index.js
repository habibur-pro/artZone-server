const express = require('express');
const cors = require('cors');
const morgan = require('morgan')
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middlewares 
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))


// token verify 
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    const token = authorization.split(' ')[1]

    // verify 
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded
        next()

    })



}

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
        const classCollection = client.db('artZone').collection('classes')
        const teacherCollection = client.db('artZone').collection('teachers')

        // create token 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token: token })
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

        // get user role 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            res.send(user)
        })


        // get teachrs by sort or all
        app.get('/teachers', async (req, res) => {
            const limit = parseInt(req.query.limit) || 0
            const filter = {}
            let options = {}
            if (limit > 0) {
                options = {
                    sort: { students: -1 }
                }
            }

            const result = await teacherCollection.find(filter, options).limit(limit).toArray()
            res.send(result)
        })

        // get teachrs by sort or all
        app.get('/classes', async (req, res) => {
            const limit = parseInt(req.query.limit) || 0
            const filter = {}
            let options = {}
            if (limit > 0) {
                options = { sort: { enroled: -1 } }
            }

            const result = await classCollection.find(filter, options).limit(limit).toArray()
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