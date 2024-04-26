const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config();
const port = 3000;
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pbafkul.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const BusCollection = client.db('busdb').collection('busesCollection');

        app.get('/allBus', async (req, res) => {
            const query = {}
            const result = await BusCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/searchBus', async (req, res) => {

            const searchValue = req.query;
            const destination = searchValue.destination;
            const date = searchValue.date;
            const bustype = searchValue.bustype;
            console.log(searchValue);
            const query = {
                $and: [
                    { destination: destination }, { date: date }, {bustype:bustype}
                ]
            }
            const result=await BusCollection.find(query).toArray();
            res.send(result);
        })

        // *********************************save buses****************************
        app.post('/addBus', async (req, res) => {
            const businfo = req.body;
            const time = req.body.time;
            const date = req.body.date;
            const destination = req.body.destination;
            const query = {
                $and: [
                    { time: time }, { destination: destination }, { date: date }
                ]
            }
            const result = await BusCollection.findOne(query);
            if (result) {
                res.send(false)
            } else {
                const result2 = await BusCollection.insertOne(businfo);
                res.send(result2);
            }
        })

    } finally {

    }
}
run().catch(console.log);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})