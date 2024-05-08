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
        const demoBusCollection = client.db('busdb').collection('demoBusCollection');

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



        app.get('/myBookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await BookingCollection.find(query).toArray();
            res.send(result);
        });



        app.get('/getBookingForPayment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await BookingCollection.findOne(query);
            res.send(result);
        });
        app.get('/allBus', async (req, res) => {
            const page = req.query.page;
            const size = parseInt(req.query.size);
            const query = {}
            const buses = await BusCollection.find(query).sort({ date: -1, time: -1 }).skip(page * size).limit(size).toArray();
            const count = await BusCollection.estimatedDocumentCount();
            const alreadyBooked = await BookingCollection.find(query).toArray()
            buses.forEach(bus => {
                const seatBooked = alreadyBooked.filter(book => book.bookingId == bus._id);
                const bookedSeat = seatBooked.map(seats => seats.bookedSeats)
                const allBookedSites = bookedSeat.flat();
                const allbookSeat = bus.seat.filter(seat => allBookedSites.includes(seat))
                bus.bookedSeats = allbookSeat;
            })
            res.send({ count, buses });
        })



        app.get('/selectedBus/:id', async (req, res) => {
            const id = req.params.id;
            const query = { bookingId: id };
            const findBookings = await BookingCollection.find(query).sort({ date: -1, time: -1 }).toArray();
            const getAllBookedSeats = findBookings.map(bookings => bookings.bookedSeats)
            const allBookedSites = getAllBookedSeats.flat();
            const query2 = { _id: new ObjectId(id) }
            const selectedBus = await BusCollection.findOne(query2);
            selectedBus.bookedSeats = allBookedSites;
            res.send(selectedBus);
        });
        app.get('/myBookedBus/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await BookingCollection.findOne(query);
            res.send(result);
        });





        app.delete('/deleteSelectedSeat/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await BookingCollection.deleteOne(query);
            res.send(result);
        });
        app.delete('/deleteAllSelectedSeat/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await BookingCollection.deleteMany(query);
            res.send(result);
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



        app.get('/allBus', async (req, res) => {
            const page = req.query.page;
            const size = parseInt(req.query.size);
            const query = {}
            const buses = await BusCollection.find(query).sort({ "date": -1, "time": -1 }).collation({ locale: "en_US", numericOrdering: true }).skip(page * size).limit(size).toArray();
            const count = await BusCollection.estimatedDocumentCount();
            const alreadyBooked = await BookingCollection.find(query).toArray()
            buses.forEach(bus => {
                const seatBooked = alreadyBooked.filter(book => book.bookingId == bus._id);
                const bookedSeat = seatBooked.map(seats => seats.bookedSeats)
                const allBookedSites = bookedSeat.flat();
                const allbookSeat = bus.seat.filter(seat => allBookedSites.includes(seat))
                bus.bookedSeats = allbookSeat;
            })
            res.send({ count, buses });
        })
        app.post('/addMultiBus', async (req, res) => {
            const businfo = req.body;
            const allBuses = await BusCollection.find({}).toArray();

            function findDifferentNames(arr1, arr2) {
                const differentObjects = [];

                arr1.forEach(obj1 => {
                    const foundObj = arr2.find(obj2 => obj1.destination === obj2.destination && obj1.date == obj2.date && obj1.time == obj2.time);
                    if (!foundObj) {
                        differentObjects.push(obj1);
                    }
                });
                return differentObjects;
            }

            const differentObjects = findDifferentNames(businfo, allBuses);
            if (differentObjects.length == 0) {
                res.send(false)
            } else {
                const result = await BusCollection.insertMany(differentObjects);
                res.send(result);
            }
        })




        app.post('/addbooking', async (req, res) => {
            const bookinginfo = req.body;
            const query2 = { bookingId: bookinginfo.bookingId, email: bookinginfo.email }
            const find = await BookingCollection.findOne(query2)
            if (find == null) {
                const result2 = await BookingCollection.insertOne(bookinginfo);
                res.send(result2);
            } else {
                const seatArray = [...find.bookedSeats, ...bookinginfo.bookedSeats]
                bookinginfo.bookedSeats = seatArray;
                const option = { upsert: true }
                const updatedDoc = {
                    $set: {
                        bookedSeats:seatArray
                    }
                }
                const result2 = await BookingCollection.updateOne(query2,updatedDoc,option)
                res.send(result2)
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