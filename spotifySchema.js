({
    babel: true
})

const mongoose = require('mongoose')    
let Schema = mongoose.Schema;

var spotifySchema = new Schema
({
    id: String,
    name: String,
    artists:
    [{
        external_urls: Object,
        href: String, 
        id: String, 
        name: String, 
        dataType: String, 
        uri: String
    }],
    
    album: {
        artists: 
        [{
            name: String, 
            id: String, 
            href: String, 
            dataType: String, 
            uri: String
        }],
        external_urls: {
            spotify: String
        },
        name: String,
        uri: String,
    
        images:
        [{
            height: Number,
            width: Number,
            url: String
        }],
    },
    
    uri: String,
    duration_ms: Number,
    external_ids: {isrc: String},
    popularity: Number,
    feats: {
        danceability: Number,
        energy: Number,
        key: Number,
        loudness: Number,
        mode: Number,
        speechiness: Number,
        acousticness: Number,
        instrumentalness: Number,
        liveness: Number,
        valence: Number,
        tempo: Number,
        id: String,
        uri: String,
        track_href: String,
        analysis_url: String,
        duration_ms: Number,
        time_signature: Number,
    }
})

module.exports = spotifySchema;