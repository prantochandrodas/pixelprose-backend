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
        const BookingCollection = client.db('busdb').collection('bookingCollection');
        app.get('/allBus', async (req, res) => {
            const query = {}
            const result = await BusCollection.find(query).toArray();
            const query2 = {}
            res.send(result);
        })

        app.get('/allBooking', async (req, res) => {
            const query = {}
            const result = await BookingCollection.find(query).toArray();
            res.send(result);
        })
        app.get('/findBooing', async (req, res) => {

        })

        app.get('/searchBus', async (req, res) => {

            const searchValue = req.query;
            const destination = searchValue.destination;
            const date = searchValue.date;
            const bustype = searchValue.bustype;
            const query = {
                $and: [
                    { destination: destination }, { date: date }, { bustype: bustype }
                ]
            }
            const result = await BusCollection.find(query).toArray();
            res.send(result);
        })



        // app.get('/selectedBus/:id', async (req, res) => {
        //     const id = req.params.id;

        //     const query = { _id: new ObjectId(id) };
        //     const result = await BusCollection.findOne(query);
        //     res.send(result);
        // });



          // app.get('/add',async(req,res)=>{
        //     const filter={};
        //     const option = { upsert: true }
        //     const updatedDoc = {
        //         $set: {
        //             advertise: false
        //         }
        //     }
        //     const result = await allProductsCollection.updateMany(filter, updatedDoc, option);
        //     res.send(result);
        // }); 


        app.get('/selectedBus/:id', async (req, res) => {
            const id = req.params.id;
            const query = { bookingId: id };
            const selectedBus=await BusCollection.findOne({ _id: new ObjectId(id)});
            const alreadyBooked = await BookingCollection.find(query).toArray()
            const query2 = {};
            const buses = await BusCollection.find(query2).toArray();
            buses.forEach(bus => {
                const seatBooked = alreadyBooked.filter(book => book.bookingId == bus._id);
                const bookedSeat = seatBooked.map(seats => seats.selectedSeats)
                const allBookedSites = bookedSeat.flat();
                const allbookSeat=bus.seat.filter(seat=>allBookedSites.includes(seat))
                // console.log(allbookSeat)
            })
            console.log(allbookSeat)
            res.send(selectedBus);
        });





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

        app.post('/addbooking', async (req, res) => {
            const bookinginfo = req.body;
            console.log(bookinginfo);
            const result2 = await BookingCollection.insertOne(bookinginfo);
            res.send(result2);
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