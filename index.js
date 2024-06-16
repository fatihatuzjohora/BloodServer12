const express = require('express');
const jwt = require('jsonwebtoken');

const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


app.use(
  cors(
  //   {
  //   origin: [
  //     "http://localhost:5173",
  //     "https://blood-donation-1ed49.web.app",
  //     "https://blood-donation-1ed49.firebaseapp.com",
  //   ]
  // }
  )
);


// middleware
app.use(cors());
app.use(express.json());


// middlewares 
const logger = (req, res, next) =>{
  console.log('log: info', req.method, req.url);
  next();
}

// mongoDB
const uri = process.env.DB_URL

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

client .connect()
.then(() => {
  console.log("MongoDB Connected");
})
.catch((err) => {
  console.log(err);
});

async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
     // await client.connect();

     const blogCollection = client.db("blood").collection("blog");
     const userCollection = client.db("blood").collection("user");
     const requestCollection = client.db("blood").collection("request");
     const paymentCollection = client.db("blood").collection("payment");
     
// auth related api
app.post('/jwt', async (req, res) => {
  const user = req.body;
  console.log('user for token', user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
  res.send({token});
 })
// middlewares 
const verifyToken = (req, res, next) => {
  // console.log('inside verify token', req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

// users related api


app.get('/all-blogs', async (req, res) => {
  const result = await blogCollection.find().toArray();
  res.send(result);
});

app.get('/blogs/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await blogCollection.findOne(query);
  res.send(result);
})

app.put('/blogs/:id', async (req, res) => {
  const id = req.params.id;
  const options = { upsert: true };
  const item = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
       
      status : item.status
    }
  }
  const result = await blogCollection.updateOne(filter, updatedDoc, options);
  res.send(result);
})

//issu
app.delete('/blogs/:id', async (req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await blogCollection.deleteOne(query)
  res.send(result);
})

app.get('/bloging', async (req, res) => {
  const result = await blogCollection.find().toArray();
  res.send(result);
});

app.post('/content', async (req, res) => {
  const request = req.body;
  const result = await blogCollection.insertOne(request);
  res.send(result);
});


app.put('/donate/:id', async (req, res) => {
  const id = req.params.id;
  const options = { upsert: true };
  const item = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      donorName:item.donorName,
      donorEmail:item.donorEmail, 
      status : item.status
    }
  }
  const result = await requestCollection.updateOne(filter, updatedDoc, options);
  res.send(result);
})


app.post('/request', async (req, res) => {
  const request = req.body;
  const result = await requestCollection.insertOne(request);
  res.send(result);
});

app.get('/request', async (req, res) => {
  
  const result = await requestCollection.find().toArray();
  res.send(result)
})

app.get('/detail/:id',verifyToken, async (req, res) => {
  const id = req.params.id;
  //console.log('clfehfio');
      const query = { _id: new ObjectId(id) }
  
  const result = await requestCollection.findOne(query);
  res.send(result)
})


app.put('/request/:id', async (req, res) => {
  const id = req.params.id;
  const options = { upsert: true };
  const item = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
       
      status : item.status
    }
  }
  const result = await requestCollection.updateOne(filter, updatedDoc, options);
  res.send(result);
})

 // update
 app.put('/update/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updated = req.body;

  const spot = {
      $set: {
          
        requestername: updated.requestername,
        requesteremail: updated.requesteremail,
        recipient: updated.recipient,
        dictrict: updated.dictrict,
        upazila: updated.upazila,
          time: updated.time,
          donername: updated.donername,
          doneremail: updated.doneremail,
          hospital: updated.hospital,
          address: updated.address,
          date: updated.date,
          massage: updated.massage,

      }
  }

  const result = await requestCollection.updateOne(filter, spot, options);
  res.send(result);
})

app.put('/update-user/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updated = req.body;

  const spot = {
      $set: {
          
        name: updated.name,
        email: updated.email,
        recipient: updated.recipient,
        dictrict: updated.dictrict,
        upazila: updated.upazila,
         blood: updated.blood,
        photo: updated.photo,
      }
  }

  const result = await userCollection.updateOne(filter, spot, options);
  res.send(result);
})

app.get('/request/:email', async (req, res) => {
  const requesteremail = req.params.email
  const result = await requestCollection.find({ requesteremail }).toArray();
  res.send(result)
})

// delete
app.delete('/delete/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await requestCollection.deleteOne(query);
  res.send(result);
})

app.delete('/blogs/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await blogCollection.deleteOne(query);
  res.send(result);
})

app.post('/user', async (req, res) => {
  const user = req.body
  const query={email:user.email}
  const existUser=await userCollection.findOne(query)
  if (existUser){
    return res.send({
      message:'user has already exist'
    })
  }
  const result = await userCollection.insertOne(user);
  res.send(result);
});

app.get('/user',verifyToken, async (req, res) => {
  
  const result = await userCollection.find().toArray();
  res.send(result)
})

app.get('/alls',verifyToken, async (req, res) => {
  
  const result = await userCollection.find().toArray();
  res.send(result)
})

app.get('/user/:email',verifyToken, async (req, res) => {
  const email = req.params.email
  const result = await userCollection.findOne({ email })
  res.send(result)
})

app.put('/user/:id', async (req, res) => {
  const id = req.params.id;
  const options = { upsert: true };
  const item = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
       
      status : item.status
    }
  }
  const result = await userCollection.updateOne(filter, updatedDoc, options);
  res.send(result);
})

app.put('/users/:id', async (req, res) => {
  const id = req.params.id;
  const options = { upsert: true };
  const item = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
       
      role : item.role
    }
  }
  const result = await userCollection.updateOne(filter, updatedDoc, options);
  res.send(result);
})


// API endpoint to filter data
app.get('/api/filter', async (req, res) => {
  const { blood, upazila, dictrict } = req.query;
  try {
      const query = {};
      if (blood == 'A' || blood == 'B' || blood == 'AB' || blood == 'O') query.blood =  blood+'+';
      if (blood == 'A-' || blood == 'B-' || blood == 'AB-' || blood == 'O-') query.blood =  blood;
      if (upazila) query.upazila = upazila;
      if (dictrict) query.dictrict = dictrict;
      
      console.log(query.blood);

      const results = await userCollection.find(query).toArray();
      
      res.send(results);
  } catch (error) {
      res.status(500).send('Server Error');
  }
});


// payment intent
app.post('/create-payment-intent', async (req, res) => {
  const { price } = req.body;
  console.log(price);
  const amount = parseInt(price * 100);
  console.log(amount, 'amount inside the intent')

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card']
  });

  res.send({
    clientSecret: paymentIntent.client_secret
  })
});

app.post('/confirm', async (req, res) => {
  const payment = req.body;
  const result = await paymentCollection.insertOne(payment);
  res.send(result);
});

app.get('/all-payments', async (req, res) => {
  
  const result = await paymentCollection.find().toArray();
  res.send(result)
})

app.get('/products', async (req, res) => {
  console.log(req.query);
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const skip = page * limit;

  const result = await requestCollection.find().skip(skip).limit(limit).toArray();
  res.send(result);
})


      // Send a ping to confirm a successful connection
     // await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
     // await client.close();
    }
  }
  run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('12 server is running')
})

app.listen(port, () => {
    console.log(`12 is running on port: ${port}`)
})


