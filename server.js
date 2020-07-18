const express= require('express');
const app= express();
const fetch= require('node-fetch');
require('dotenv').config();

app.use(express.static('docs'));
app.use(express.json({limit: '1mb'}));

const port= process.env.PORT || 3000;


app.listen(port, ()=>{
    console.log(`Server is running on port ${port}.`);
});

app.get('/nearby/:bb', async(request, response) =>{
    console.log("request.params");
    const bb= request.params.bb.split(',');
    console.log(bb);
    const north= bb[0];
    const south= bb[1];
    const east= bb[2];
    const west= bb[3];
    console.log(north, south, east, west);
    const geonamesUsername= process.env.GEONAMES_USERNAME;
    const geonames_url=`http://api.geonames.org/citiesJSON?north=${north}&south=${south}&west=${west}&east=${east}&maxRows=9&username=${geonamesUsername}`;
    // const geonames_url=`http://api.geonames.org/citiesJSON?north=45&south=44&west=44&east=45&maxRows=9&username=githubmapmap`;
    console.log(geonames_url);
    const fetch_response= await fetch(geonames_url);
    const json= await fetch_response.json();
    response.json(json);
})

app.get('/users/:city', async(request, response) =>{
    const city= request.params.city;
    console.log("in the get request on server");
    const users_url= `https://api.github.com/search/users?q=location%3A${city}`;
    const fetch_response = await fetch(users_url);
    // , {
    //   headers: new Headers({
    //       Authorization: `token ${process.env.GITHUB_TOKEN}`,
    //       Accept: `application/vnd.github.v3+json`
    //   })
  // }
    // console.log(fetch_Response);
    const json = await fetch_response.json();
    response.json(json);
  });

