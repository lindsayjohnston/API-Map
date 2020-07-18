const cityBB = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
}
let chosenCity;
let chosenState;
let citiesArray = [];
let usingDummyData = false;

let verifiedCities = [];
let geoCodeTally = 0;
let citiesLatLng = [];
let gitHubNumbersArray = [];

//FOR GOOGLE MAPS API
let map;
let service;
let infoWindow;

//LISTEN FOR CLICK TO RUN PROGRAM
// document.getElementById('get-map').addEventListener('click', getChosenLatLng);
document.getElementById('city-input').addEventListener('keydown', guessCity);

//TEMP CLICKS FOR TESTING
document.getElementById('get-map').addEventListener('click', testNearbyCities);

//ADD SCRIPT ONLOAD


//AUTOCOMPLETE CITY
function guessCity() {
    let cityInput = document.getElementById('city-input');
    let options = {
        types: ['(cities)'],
        componentRestrictions: { country: 'us' }
    };
    let autocomplete = new google.maps.places.Autocomplete(cityInput, options);
}

//CHANGE HTML
function clearText(area) {
    area.textContent = '';
}

function addError(element, message) {
    element.style.padding= '5px';
    element.style.backgroundColor= 'rgb(236, 94, 94)';
    element.style.width='600px';
    element.innerHTML += `${message}`;
}

function clearError(element){
    element.style.backgroundColor= 'white';
}

function addSpinner(element, message) {
    element.style.backgroundColor= 'white';
    element.style.width='600px';
    element.style.padding="5px";
    element.innerHTML += `${message} <i id="spinner" class="fa fa-spinner fa-pulse" aria-hidden="true"></i>`
}

function addCheck(element) {
    document.getElementById('spinner').remove();
    element.innerHTML += '<i class="far fa-check-circle"></i><br>';
}

//RELOAD ALL INFO WHEN BUTTON CLICKED
function reloadData() {
    citiesArray = [];
    usingDummyData = false;
    verifiedCities = [];
    geoCodeTally = 0;
    citiesLatLng = [];
    gitHubNumbersArray = [];
    chosenCity = '';
    document.getElementById('map').innerHTML = '';
    document.getElementById('message').innerHTML = '';
    document.getElementById('marker-explanation').textContent='';
    document.getElementById('map-div').style.display= 'none';
}

function getChosenLatLng() {
    reloadData();
    let input = document.getElementById('city-input').value;
    if (input === '') {
        addError(document.getElementById('message'), 'Please enter a valid city!');
    } else {
        //START FETCHING NEARBY CITIES SPINNER
        addSpinner(document.getElementById('message'), "Fetching coordinates of chosen city with Google Geocoder API.");
        clearError(document.getElementById('message'));
        let inputArray = input.split(', ');
        chosenCity = inputArray[0];
        chosenState = inputArray[1];
        let geocoderRequest = {
            address: input
        }

        const geocoder1 = new google.maps.Geocoder();
        geocoder1.geocode(geocoderRequest, function (array, status) {
            citiesArray.push(chosenCity + " " + chosenState);
            verifiedCities.push(chosenCity + " " + chosenState);
            pushLatLng(array);
        })
        checkChosenLatLng();
    }
}

function checkChosenLatLng() {
    //ONCE GEOCODER GETS LATLNG FOR CHOSEN CITY, VERIFIEDCITIES.LENGTH WILL = 1
    if (citiesLatLng.length === 0) {
        setTimeout(checkChosenLatLng, 200);
    } else {
        addCheck(document.getElementById('message'));
        getCityBBCoordinates();
    }
}

function getCityBBCoordinates() {
    let latitude = citiesLatLng[0]['lat'];
    let longitude = citiesLatLng[0]['lng'];
    cityBB['south'] = latitude - 2.5;
    cityBB['north'] = latitude + 2.5;
    cityBB['east'] = longitude + 4;
    cityBB['west'] = longitude - 4;

    // getNearbyCities(cityBB);
    testNearbyCities(cityBB);
}

//TEST GETNEARBYCITIES

async function testNearbyCities(){
    console.log("in testNearbyCities");
    try{
        // const citiesURL= `/nearby/cityBBwithCommas`
        let bbCommas= `45,44,45,44`;
        const citiesURL= `/nearby/${bbCommas}`;
        const response= await fetch(citiesURL);
        // const json= await response.json();
        console.log(response);
    } catch (error){
        console.log(error);
    }
}


function getNearbyCities(bb) {
    addSpinner(document.getElementById('message'), "Fetching nearby cities with GeoNames API.");
    
    checkNearbyCities();
}
//////TEST SERVER 
let city= "seattle";

///GET NUMBER OF GITHUB USERS
async function test() {
    try {
        const api_url = `/users/${city}`;
        const response = await fetch(api_url);
        const json = await response.json();
        console.log(json.total_count);

    } catch (error) {
        console.log(error);
    }
};

test();





function checkNearbyCities() {
    //citiesArray.length should match number of rows requested from GeoNames API + 1 for chosen City
    if (citiesArray.length !== 10 && !usingDummyData) {
        setTimeout(checkNearbyCities, 200);
    } else {
        addCheck(document.getElementById('message'));
        verifyCities();
    }
}

function verifyCities() {
    addSpinner(document.getElementById('message'), "Verifying cities with Google Geocoder API.");
    citiesArray.forEach(city => {
        let geocoderRequest = {
            address: city
        }
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode(geocoderRequest, function (array, status) {
            if (status === "OVER_QUERY_LIMIT") {
                console.log("Over query limit: " + city);
                addError(document.getElementById('message'), "Something went wrong. Please try again!")
            } else {
                geoCodeTally++;
                if (array) {
                    //CHECK IF IT'S A CITY
                    let placeTypes = array[0].types;
                    let isCity = false;
                    placeTypes.forEach(function (place) {
                        if (place === 'locality') {
                            isCity = true;
                        }
                    })
                    if (isCity) {
                        //GET CITY/STATE NAME
                        let state;
                        let city;
                        let addressComponents = array[0]['address_components'];
                        addressComponents.forEach(component => {
                            component.types.forEach(type => {
                                if (type === 'locality') {
                                    city = component['long_name'];
                                }
                                if (type === 'administrative_area_level_1') {
                                    state = component['short_name'];
                                }
                            })
                        })
                        verifiedCities.push(`${city} ${state}`);
                        pushLatLng(array);
                    }
                }
            }
        });
    });
    checkLatLng()
}

function pushLatLng(array) {
    let latitude = (array[0].geometry.location.lat());
    let longitude = (array[0].geometry.location.lng());
    let cityLatLng = { lat: latitude, lng: longitude };
    citiesLatLng.push(cityLatLng);
}

//MAKE SURE APP HAS HAD TIME TO GET RESPONSES FROM LAT/LNG API
function checkLatLng() {
    if (geoCodeTally !== (citiesArray.length)) {
        setTimeout(checkLatLng, 200);
    } else {
        deleteCityDuplicates();
    }
}

//ACCOUNT FOR DISCREPANCIES BETWEEN DIFFERENT APIS IN REGARDS TO CITY NAMING
function deleteCityDuplicates() {
    verifiedCities.forEach((city, index) => {
        for (let i = index + 1; i < verifiedCities.length; i++) {
            if (verifiedCities[i] === city) {
                verifiedCities.splice(i, 1);
                citiesLatLng.splice(i, 1);
            }
        }
    })
    getGitHubUsers();
}

function getGitHubUsers() {
    addCheck(document.getElementById('message'));
    addSpinner(document.getElementById('message'), "Fetching numbers of GitHub Users with GitHub API.");
    const github = new GitHub;
    verifiedCities.forEach((city, index) => {
        let cityNameForURL;
        //Change City Name to URL format
        let cityNameArray = city.split(" ");
        cityNameArray.forEach(function (word, index) {
            if (index === 0) {
                cityNameForURL = word;
            } else {
                cityNameForURL += "+" + word;
            }
        })

        github.getUsersInLocation(cityNameForURL)
            .then(data => {
                gitHubNumbersArray.push([city, citiesLatLng[index], data.location.total_count]);
            })

    })
    checkGitHub();
};

//GET NUMBER OF GITHUB USERS FOR EACH VERIFIED CITY
function checkGitHub() {
    if (gitHubNumbersArray.length !== verifiedCities.length) {
        setTimeout(checkGitHub, 200);
    } else {
        addCheck(document.getElementById('message'));
        getTop5(gitHubNumbersArray);
    }
}

//FIND TOP 5 CITIES BY HIGHEST NUMBER OF GITHUB USERS
function getTop5(array) {
    ///array is [[city, {lat: lng: }, #], ....]
    let top5 = [];
    //make sure chosen city is displayed
    let chosenIndex;
    array.forEach((cityArray, index) => {
        if (cityArray[0] === chosenCity + " " + chosenState) {
            top5.push(cityArray);
            chosenIndex = index;
        }
    })

    for (let i = 0; i < array.length; i++) {
        //AVOID COUNTING CHOSEN CITY AGAIN
        if (i !== chosenIndex) {
            let tally = 0;
            for (let k = i + 1; k < array.length; k++) {
                if (array[i][2] < array[k][2]) {
                    tally++;
                }
            }
            if (tally <= (4 - top5.length)) {
                top5.push(array[i]);
            }
        }
    }
    getMap(top5);
}

//GENERATE GOOGLE MAP
function getMap(cityArray) {
    document.getElementById('map-div').style.display= 'flex';

    map = new google.maps.Map(
        document.getElementById('map'),
        { center: cityArray[0][1], zoom: 6.5 }
    );

    for (let i = 0; i < cityArray.length; i++) {
        createMarker(cityArray[i][1], cityArray[i][0], cityArray[i][2])
    } 
    document.getElementById('marker-explanation').textContent= 'Click a marker to see the number of GitHub users.';
}

//GENERATE CLICKABLE MARKERS FOR MAP
function createMarker(latLng, cityName, numberOfUsers) {
    //FORMAT CITY AS "CITY, STATE"

    let cityArray = cityName.split(" ");
    let formattedCity = cityArray[0];
    for (let i = 1; i < cityArray.length; i++) {
        if (i === cityArray.length - 1) {
            formattedCity += `, ${cityArray[i]}`;
        } else {
            formattedCity += ` ${cityArray[i]}`;
        }
    }

    let marker = new google.maps.Marker({
        map: map,
        position: latLng,
        animation: google.maps.Animation.DROP,
        title: `${numberOfUsers} GitHub Users in ${formattedCity}`
    });

    marker.addListener('click', function () {
        infoWindow = new google.maps.InfoWindow({
            content: marker.title
        })
        infoWindow.open(map, marker);
    });

    
}

