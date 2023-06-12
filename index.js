const express = require('express');
const cors = require('cors');
const morgan = require('morgan')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const studentCollection = client.db('artZone').collection('students')
        const classCollection = client.db('artZone').collection('classes')
        const teacherCollection = client.db('artZone').collection('teachers')
        const selectCollection = client.db('artZone').collection('select_classes')
        const enroledCollection = client.db('artZone').collection('enroled_classes')

        // create token 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token: token })
        })


        // add and update user 
        app.put('/students', async (req, res) => {
            const user = req.body;
            const email = req.body.email;
            const filter = { email: email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: user
            }

            const result = await studentCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        // get user role 
        app.get('/students/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await studentCollection.findOne(query)
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

        // get classes by sort or all
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

        // post select item 
        app.post('/select_classes', verifyJWT, async (req, res) => {
            const selectItem = req.body;
            console.log('select item', selectItem)
            const result = await selectCollection.insertOne(selectItem)
            res.send(result)
        })

        // get selected items by email 
        app.get('/selectedItems/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const filter = { email: email }
            const result = await selectCollection.find(filter).toArray()
            res.send(result)
        })

        // delete selected class 
        app.delete('/selectedItems/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await selectCollection.deleteOne(filter)
            res.send(result)
        })

        // teacher api 
        app.post('/add_class', verifyJWT, async (req, res) => {

            if (req.decoded?.email !== req.body?.teacher_email) {
                res.status(403).send({ error: true, message: 'Forbidden' })
            }
            const classItem = req.body;
            console.log(classItem)
            const result = await classCollection.insertOne(classItem)
            res.send(result)
        })
        // get class by teacher email 
        app.get('/classes/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { teacher_email: email }
            console.log(filter)
            const result = await classCollection.find(filter).toArray()

            res.send(result)
        })

        // admin route 
        app.get('/users', verifyJWT, async (req, res) => {
            const result = await studentCollection.find().toArray()
            res.send(result)
        })

        // make admin 
        app.patch('/users/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const userRole = req.body;
            console.log(userRole)
            const filter = { email: email }
            const updatedDoc = {
                $set: {
                    role: userRole.role
                }
            }
            const result = await studentCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })


        // get class by id 
        app.get('/myClasses/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            console.log('amar sonar bangla ami tomay', id)
            const filter = { _id: new ObjectId(id) }
            const result = await classCollection.findOne(filter)
            res.send(result)
        })

        // update class status 
        app.patch('/classes/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const classStatus = req.body
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: classStatus.status
                }
            }
            const result = await classCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        // update class 
        app.put('/classes/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const updateClass = req.body
            const filter = { _id: new ObjectId(id) }
            console.log(updateClass)
            const updatedDoc = {
                $set: {
                    ...updateClass
                }
            }
            const result = await classCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        // class delete by id 
        app.delete('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await classCollection.deleteOne(filter)
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