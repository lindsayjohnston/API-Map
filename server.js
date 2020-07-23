const express= require('express');
const app= express();
const fetch= require('node-fetch');
require('dotenv').config();
const { Headers }= require('node-fetch');
const stringops=require('stringops');

app.use(express.static('docs'));
app.use(express.json({limit: '1mb'}));

const port= process.env.PORT || 3000;



app.listen(port, ()=>{
    console.log(`Server is running on port ${port}.`);
});

app.get('/clean/:cities', async(request, response) =>{
  const cities= request.params.cities.split(';');
  const newCities=[];
  cities.forEach( city =>{
    city=city.noAccents;
    newCities.push(city);
  })

  response.json(newCities);
})

app.get('/nearby/:bb', async(request, response) =>{
    const bb= request.params.bb.split(',');
    const north= bb[0];
    const south= bb[1];
    const west= bb[2];
    const east= bb[3];
    
    const geonames_url=`http://api.geonames.org/citiesJSON?north=${north}&south=${south}&west=${west}&east=${east}&maxRows=9&username=${process.env.GEONAMES_USERNAME}`;
    //SEATTLE EXAMPLE:
    // http://api.geonames.org/citiesJSON?north=50.1&south=45.1&west=-126&east=-118&maxRows=9&username=githubmapmap
    
    const fetch_response= await fetch(geonames_url);
    const json= await fetch_response.json();
    response.json(json);
})

app.get('/users/:city', async(request, response) =>{
    let city= request.params.city;
    city= city.noAccents;
    const users_url= `https://api.github.com/search/users?q=location%3A"${city}"`;
    // console.log(users_url);
    //Seattle,WA example
    // https://api.github.com/search/users?q=location%3ASeattle+location%3AWA
    const fetch_response = await fetch(users_url, 
    {
      headers: new Headers({
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          // Accept: `application/vnd.github.v3+json`
      })
    });
    // console.log(fetch_Response);
    const json = await fetch_response.json();
    response.json(json);
  });

