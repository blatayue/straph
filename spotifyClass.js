// 'use strict';
({
  babel: true
})
import spotifyWebApi from 'spotify-web-api-node';
import _ from 'lodash';
import spotifySchema from './spotifySchema.js';
import mongoose from 'mongoose';
import findOrCreate from 'findorcreate-promise';
import PError from 'pretty-error';
import fetch from 'node-fetch'
PError.start();
// mongoose setup
mongoose.Promise = Promise;
spotifySchema.plugin(findOrCreate);
let spotifyTrackModel = mongoose.model('track', spotifySchema);
let webApi;
class spotify {
  constructor(mongoUrl) {
    mongoose.connect(mongoUrl, {useMongoClient: true}).catch(err => {
      console.log('Check connection to DB', err);
    });
  };

  async authenticate(credentials) {
    webApi = await new spotifyWebApi(credentials);
    const cred = await webApi.clientCredentialsGrant();
    let token = await cred.body.access_token;
    webApi.setAccessToken(token);
    return;
  };

  async query(query) {
    try {
    // Queries through api, limits by default, no other props currently
    var search = await webApi.searchTracks(query, {limit: 24});
    var tracks = await search.body.tracks.items;
    // Call aggregateTracks with song array
    return await this.dbFormatSpotifyTracks(tracks);
    }
    catch(err) {
      console.log(err);
    };
  };

  async audioAnalysis(tracks) {
    let idArray = tracks.map(track => {
      return track.id;
    });
    let audioFeats = await webApi.getAudioFeaturesForTracks(idArray);
    return audioFeats.body.audio_features;
  };
  
  async recommend(tracks) {
    // keep only ids
    let idArray = tracks.map(track => track.id);
    let fiveId = [];
    // picks 5 nonrepeating
    for (let i = 0; i < 5; i++) {
      let itemI = Math.floor(Math.random()*idArray.length)
      fiveId.push(idArray[itemI]);
      idArray.splice(itemI, 1)
    }
    let seedTracks = fiveId.join(',');
    let token = 'Bearer ' + webApi._credentials.accessToken;
    // Damn API wrapper doesn't have this as a method...
    // fetch recomendations
    let baseUrl = 'https://api.spotify.com/v1/'
    let recommendations = await fetch(
      baseUrl + 'recommendations?seed_tracks=' + seedTracks, 
      {
        headers: {
        'Authorization': token
        }
      }
    );
    let res = await recommendations.json();
    let formatted = await this.dbFormatSpotifyTracks(res.tracks)
    return formatted;
  }

  findCreate(tracks) {
    // resolve the promise array
    let documentPromiseArray = tracks.map(async(track) => {
      let docs = await spotifyTrackModel.findOrCreate({id: track.id}, track);
      return await docs.result.toJSON();
    });
    return Promise.all(documentPromiseArray);
  };
  
  async dbFormatSpotifyTracks(tracks) {
    let formatted = tracks.map(track => {
      // pick properties with lodash
      let dbFormattedTrack = _.pick(track, 
        [
          "id", 
          "name", 
          "artists", 
          "album", 
          "uri", 
          "duration_ms", 
          "external_ids",
          "popularity"
        ]);
      // remove unecessary album props
      delete dbFormattedTrack.album.available_markets
      // delete dbFormattedTrack.album.external_urls
      delete dbFormattedTrack.album.href
      delete dbFormattedTrack.album.id
      delete dbFormattedTrack.album.type

      return dbFormattedTrack;
    });
    // one api call for array
    let features = await this.audioAnalysis(formatted);
    // inserts at correct index
    features.map((feat, i) => {
      formatted[i].feats = feat;
    });
    return this.findCreate(formatted)
    // return formatted;
  };
};


// Test
// async function test() {
//   let testClass = new spotify('mongodb://localhost:27017/straph');
//   await spotify.authenticate({
//   clientId: process.env.spotify_client_id,
//   clientSecret: process.env.spotify_client_secret
// })
//   let results = await testClass.query('Water')
//   let recomendations = await testClass.recommend(results);
//   testClass.findCreate(recomendations)
//   console.log(recomendations)
//   return;
// };
// test();

export default spotify;