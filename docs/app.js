const cityBB = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
}
let chosenCity;
let chosenState;
let geonamesFail= 0;
let citiesArray = [];
let errorMessage = false;
let usingDummyData = false;
let verifyingCities = false;
let fetchingCities = false;
let gettingGitHubUsers = false;
let gettingTop5 = false;

let verifiedCities = [];
let geoCodeTally = 0;
let citiesLatLng = [];
let gitHubNumbersArray = [];

//FOR GOOGLE MAPS API
let map;
let service;
let infoWindow;

//LISTEN FOR CLICK TO RUN PROGRAM
document.getElementById('get-map').addEventListener('click', getChosenLatLng);
document.getElementById('city-input').addEventListener('keydown', guessCity);

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
    element.style.padding = '5px';
    element.style.backgroundColor = 'rgb(236, 94, 94)';
    element.style.width = '600px';
    element.innerHTML += `${message}`;
    errorMessage = true;
}

function clearError(element) {
    element.style.backgroundColor = 'white';
}

function addSpinner(element, message) {
    element.style.backgroundColor = 'white';
    element.style.width = '600px';
    element.style.padding = "5px";
    element.innerHTML += `${message} <i id="spinner" class="fa fa-spinner fa-pulse" aria-hidden="true"></i>`;
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
    verifyingCities = false;
    fetchingCities = false;
    gettingGitHubUsers = false;
    gettingTop5 = false;
    document.getElementById('map').innerHTML = '';
    document.getElementById('message').innerHTML = '';
    document.getElementById('marker-explanation').textContent = '';
    document.getElementById('map-div').style.display = 'none';
}

function disableGetMap() {
    const getMapButton = document.getElementById('get-map');
    getMapButton.disabled = true;
    getMapButton.style.width = '600px';
    getMapButton.textContent = "Upgrade to Premium to make more than one request per minute!";
    setTimeout(() => {
        getMapButton.disabled = false;
        getMapButton.style.width = '200px';
        getMapButton.textContent = "Get Map of GitHub Users";
    }, 60000);
}

function getChosenLatLng() {

    let input = document.getElementById('city-input').value;
    if (input === '') {
        addError(document.getElementById('message'), 'Please enter a valid city!');
    } else {
        reloadData();
        disableGetMap();
        if (errorMessage) {
            clearError(document.getElementById('message'));
        }
        //START FETCHING NEARBY CITIES SPINNER
        addSpinner(document.getElementById('message'), "Fetching coordinates of chosen city with Google Geocoder API.");
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

    testNearbyCities(cityBB);
}

async function testNearbyCities(bb) {
    if (!fetchingCities) {
        addSpinner(document.getElementById('message'), "Fetching nearby cities with GeoNames API.");
        fetchingCities = true;
    }

    try {
        let bbCommas = `${bb.north},${bb.south},${bb.west},${bb.east}`;
        const citiesURL = `/nearby/${bbCommas}`;
        const response = await fetch(citiesURL);
        const json = await response.json();
        if (json.status !== undefined) {
            // alert('There was a problem with the GeoNames server and we will use dummy data surrounding Yakima, WA to run the App. Sorry about that!');
            // citiesArray = ["Yakima WA", "Kennewick WA", "Tacoma WA", 'Seattle WA', 'Richland WA', "Walla Walla WA", 'Yakima WA'];
            // usingDummyData = true;
            // document.getElementById('city-input').value = "Yakima, WA, USA"
            // geoCodeTally = 0;
            // chosenCity = 'Yakima';
            // chosenState = 'WA';
            // citiesLatLng = [];
            // verifiedCities = [];
            console.log("Geonames fail");
            geonamesFail ++;
            
            if(geonamesFail > 8){
                addError(document.getElementById('message'), `We couldn't find enough data near this city. Please try again.`);
                reloadData();
            }
            setTimeout(function () { testNearbyCities(bb, true); }, 200);
        } else {
            json.geonames.forEach(cityInfo => {
                //populate citiesarray with wikipedia search name from Geonames wiki
                //EX: en.wikipedia.org/wiki/Tacoma%2C_Washington
                //EX: en.wikipedia.org/wiki/Seattle
                let cityName;
                let cityStateWiki = cityInfo.wikipedia;
                if (cityStateWiki !== "") {
                    let wikiArray = cityStateWiki.split('/');
                    let cityURLFormat = wikiArray[2];
                    let cityNameArray1 = cityURLFormat.split("%2C_"); //get rid of %2C
                    let cityNameArray2 = []; //get rid of _
                    cityNameArray1.forEach(word => {
                        let wordArray = word.split('_');
                        wordArray.forEach(smallWord => {
                            cityNameArray2.push(smallWord);
                        })
                    })
                    cityName = cityNameArray2.join(" ");

                } else {
                    cityName = cityInfo.name;
                }
                citiesArray.push(cityName);
                checkNearbyCities();
            });
        }
    } catch (error) {
        console.log(error);
    }

}


function checkNearbyCities() {
    //citiesArray.length should match number of rows requested from GeoNames API + 1 for chosen City
    if (citiesArray.length !== 10 && !usingDummyData) {
        setTimeout(checkNearbyCities, 200);
    } else if (verifyingCities) {
        console.log("in checkingNearbyCities")
    } else {
        verifyCities();
    }
}

function verifyCities() {
    if (!verifyingCities) {
        addCheck(document.getElementById('message'));
        addSpinner(document.getElementById('message'), "Verifying cities with Google Geocoder API.");
        verifyingCities = true;
    }

    citiesArray.forEach(city => {
        let geocoderRequest = {
            address: city
        }
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode(geocoderRequest, function (array, status) {
            if (status === "OVER_QUERY_LIMIT" & geoCodeTally < citiesArray.length) {
                console.log("Geocoder Over query limit: " + city);
                setTimeout(function () { verifyCities(); }, 500);
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
                checkLatLng();
            }
        });
    });

}

function pushLatLng(array) {
    let latitude = (array[0].geometry.location.lat());
    let longitude = (array[0].geometry.location.lng());
    let cityLatLng = { lat: latitude, lng: longitude };
    citiesLatLng.push(cityLatLng);
}

//MAKE SURE APP HAS HAD TIME TO GET RESPONSES FROM LAT/LNG API
function checkLatLng() {
    if (geoCodeTally < citiesArray.length) {
        setTimeout(checkLatLng, 200);
    } else if (gettingGitHubUsers) {
        console.log('in CheckLatLng');
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
    if (!gettingGitHubUsers) {
        addCheck(document.getElementById('message'));
        addSpinner(document.getElementById('message'), "Fetching numbers of GitHub Users with GitHub API.");
        gettingGitHubUsers = true;
    }

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
        });

        test(city, citiesLatLng[index], cityNameForURL);

    })
    checkGitHub();
};

async function test(city, latLngIndex, cityNameForURL) {
    try {
        const api_url = `/users/${cityNameForURL}`;
        const response = await fetch(api_url);
        const json = await response.json();
        console.log(json.total_count);

        if (json.total_count === undefined) {
            setTimeout(function () { test(city, latLngIndex, cityNameForURL); }, 35000);
        } else {
            gitHubNumbersArray.push([city, latLngIndex, json.total_count]);
        }
    } catch (error) {
        console.log(error);
    }
};

//GET NUMBER OF GITHUB USERS FOR EACH VERIFIED CITY
function checkGitHub() {
    if (gitHubNumbersArray.length !== verifiedCities.length) {
        setTimeout(checkGitHub, 200);
    } else if (gettingTop5){
        console.log("in checkGitHub");
    } else {
        getTop5(gitHubNumbersArray);
    }
}

//FIND TOP 5 CITIES BY HIGHEST NUMBER OF GITHUB USERS
function getTop5(array) {
    if (!gettingTop5) {
        addCheck(document.getElementById('message'));
        gettingTop5 = true;
    }
    ///array is [[city, {lat: lng: }, #], ....]
    console.log("verified cities array before top 5: ");
    console.log(array);
    let top5 = [];
    //make sure chosen city is displayed
    let chosenIndex;
    array.forEach((cityArray, index) => {
        if (cityArray[index] === chosenCity + " " + chosenState) {
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
    console.log(top5);
    getMap(top5);
}

//GENERATE GOOGLE MAP
function getMap(cityArray) {
    document.getElementById('map-div').style.display = 'flex';

    map = new google.maps.Map(
        document.getElementById('map'),
        { center: cityArray[0][1], zoom: 4.5 }
    );

    for (let i = 0; i < cityArray.length; i++) {
        createMarker(cityArray[i][1], cityArray[i][0], cityArray[i][2])
    }
    document.getElementById('marker-explanation').textContent = 'Click a marker to see the number of GitHub users.';
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

