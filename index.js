const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;



app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c0auljw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();


    const menuCollection = client.db("foodBoosDB").collection('menu');
    const usersCollection = client.db("foodBoosDB").collection('users');
    const cartsCollection = client.db("foodBoosDB").collection('carts');


    // Middlewires
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'You have no parmitin to go the databace' });
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'You have no parmitin to go the databace' })
        }
        req.decoded = decoded;
        next()
      });
    }

    const varifyAdmin = async(req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({message: 'Forbiden Access'})
      }
      next();
    }



    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token })
    })



    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'User Already exists', insertedId: null })
      }

      const result = await usersCollection.insertOne(user);

      res.send(result)
    })


    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result)
    })


    app.post('/menu', verifyToken, varifyAdmin, async (req, res) => {
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result)
    })


    app.get('/users', verifyToken, varifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })


    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        res.status(403).send({ message: 'You have no parmitin to go the databace' })
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin });
    })


    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { UserEmail: email }
      const result = await cartsCollection.find(query).toArray();

      res.send(result)
    })


    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cartsCollection.insertOne(cartItem);

      res.send(result)
    })


    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);

      res.send(result)
    })


    app.patch('/users/admin/:id', verifyToken, varifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);

      res.send(result)
    })


    app.patch('/users/castomer/:id', verifyToken, varifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'castomer'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);

      res.send(result)
    })


    app.delete('/users/:id', verifyToken, varifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);

      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Food Boss Server is running')
})

app.listen(port, () => {

})