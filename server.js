import express from 'express';
var app = express();
import Spotify from './spotifyClass';
import dotenv from 'dotenv';
dotenv.config('./.env');
let spotify = new Spotify('mongodb://localhost:27017/straph')
app.get('/search', async function(req, res) {
    let query = req.query.query
    console.log(query)
    await spotify.authenticate({
        clientId: process.env.spotify_client_id,
        clientSecret: process.env.spotify_client_secret
    })
    let tracks = await spotify.query(query)
    res.send({"tracks": tracks})
})

app.listen('4200', function() {
    console.log('listening on port 4200');
    }
)