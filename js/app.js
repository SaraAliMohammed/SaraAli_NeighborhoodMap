var myPlaces = [
    {
        title: 'Discovery Docks Apartments',
        location: { lat: 51.501409, lng: -0.018823 },
        type: 'Living Quarters'
    },
    {
        title: 'Nandos Restaurant',
        location: { lat: 51.5023146, lng: -0.0187593 },
        type: 'Restaurant'
    },
    {
        title: 'One Canada Square',
        location: { lat: 51.5049494, lng: -0.0194997 },
        type: 'Shopping'
    },
    {
        title: 'The O2',
        location: { lat: 51.503039, lng: 0.003154 },
        type: 'Entertainment'
    },
    {
        title: 'Tesco Express',
        location: { lat: 51.500575, lng: -0.017354 },
        type: 'Shopping'
    },
    {
        title: 'Firezza Pizza',
        location: { lat: 51.496268, lng: -0.015511 },
        type: 'Restaurant'
    },
    {
        title: 'The Breakfast Club',
        location: { lat: 51.506066, lng: -0.017345 },
        type: 'Restaurant'
    },
    {
        title: 'Shake Shack',
        location: { lat: 51.504905, lng: -0.018967 },
        type: 'Restaurant'
    },
    {
        title: 'Asda Superstore',
        location: { lat: 51.494206, lng: -0.012714 },
        type: 'Shopping'
    },
    {
        title: 'Pizza Express',
        location: { lat: 51.505233, lng: -0.021716 },
        type: 'Restaurant'
    }
];

// Create a styles array to use with the map.
var styles = [
  {
      featureType: 'water',
      stylers: [
        { color: '#19a0d8' }
      ]
  }, {
      featureType: 'administrative',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: '#ffffff' },
        { weight: 6 }
      ]
  }, {
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [
        { color: '#e85113' }
      ]
  }, {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -40 }
      ]
  }, {
      featureType: 'transit.station',
      stylers: [
        { weight: 9 },
        { hue: '#e85113' }
      ]
  }, {
      featureType: 'road.highway',
      elementType: 'labels.icon',
      stylers: [
        { visibility: 'off' }
      ]
  }, {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        { lightness: 100 }
      ]
  }, {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        { lightness: -100 }
      ]
  }, {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        { visibility: 'on' },
        { color: '#f0e4d3' }
      ]
  }, {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -25 }
      ]
  }
];

//Handle authentication error of google map api
window.gm_authFailure = function () {
    $("#map").html("<p>Google maps failed to load!</p><p>Check Api Key</p>");
    alert('Google maps failed to load!');
};

var map;

var neighborhoodMapModel = function () {
    var self = this;
    this.searchPlace = ko.observable("");
    this.placesMarkerList = [];

    this.populateInfoWindow = function (marker, infoWindow) {
        if (infoWindow.marker != marker) {
            infoWindow.marker = marker;
            infoWindow.setContent('');

            // Get Street View
            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            self.getStreetView = function (data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                      nearStreetViewLocation, marker.position);
                    infoWindow.setContent('<div id="infoWindowData"></div><div id="pano"></div>');
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                      document.getElementById('pano'), panoramaOptions);
                } else {
                    self.streetViewContent = '<div>' + marker.title + '</div>' +
                      '<div>No Street View Found</div>';
                }
            };
            // Use streetview service to get the closest streetview image within
            // 50 meters of the markers position
            streetViewService.getPanoramaByLocation(marker.position, radius, self.getStreetView);

            // Foursquare API Client
            clientID = "HDFWJMDVMRDGQPU5E2P2U0LJGKJAP1HNV4AU1PRWDROUKS52";
            clientSecret = "PHA4ZHYW2MKKHROGB0EOJGJOD3B2JSTNJOU4TVQWT3FCHAB5";
            var foursqureApiUrl = 'https://api.foursquare.com/v2/venues/search?ll=' +
                marker.position.lat() + ',' + marker.position.lng() + '&client_id=' + clientID +
                '&client_secret=' + clientSecret + '&query=' + marker.title +
                '&v=20170708' + '&m=foursquare';

            // Call Foursquare API
            $.getJSON(foursqureApiUrl).done(function (marker) {
                var response = marker.response.venues[0];
                self.street = response.location.formattedAddress[0];
                self.city = response.location.formattedAddress[1];
                self.zip = response.location.formattedAddress[3];
                self.country = response.location.formattedAddress[4];
                self.category = response.categories[0].shortName;

                self.htmlContentFoursquare =
                    '<h5>(' + self.category +
                    ')</h5>' + '<div>' +
                    '<h6> Address: </h6>' +
                    '<p>street : ' + self.street + '</p>' +
                    '<p>city : ' + self.city + '</p>' +
                    '<p>zip : ' + self.zip + '</p>' +
                    '<p>country : ' + self.country +
                    '</p>' + '</div>' + '</div>';

                $("#infoWindowData").append(self.htmlContent + self.htmlContentFoursquare);
            }).fail(function () {
                // alert error message 
                alert(
                    "There was an issue loading the Foursquare API. Please refresh your page to try again."
                );
            });

            this.htmlContent = '<div>' + '<h4>' + marker.title +
                '</h4>';

            // Open the infowindow on the correct marker.
            infoWindow.open(map, marker);
            infoWindow.addListener('closeclick', function () {
                infoWindow.marker = null;
            });
        }
    };

    this.populateAndBounceMarker = function () {
        self.populateInfoWindow(this, self.placeInfoWindow);
        this.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout((function () {
            this.setAnimation(null);
        }).bind(this), 1400);
    };

    this.makeMarkerIcon = function (markerColor) {
        var markerImage = new google.maps.MarkerImage(
          'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
          '|40|_|%E2%80%A2',
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34),
          new google.maps.Size(21, 34));
        return markerImage;
    };

    this.changeMarkerHighlightedIcon = function () {
        var highlightedIcon = self.makeMarkerIcon('ffff24');
        this.setIcon(highlightedIcon);
    };

    this.changeMarkerDefaultIcon = function () {
        var Default = self.makeMarkerIcon('f75850');
        this.setIcon(Default);
    };

    this.initMap = function () {
        var mapCanvas = document.getElementById('map');
        var mapOptions = {
            center: new google.maps.LatLng(51.4980479, -0.0105351),
            zoom: 15,
            styles: styles
        };
        // Constructor creates a new map - only center and zoom are required.
        map = new google.maps.Map(mapCanvas, mapOptions);

        this.placeInfoWindow = new google.maps.InfoWindow();
        this.bounds = new google.maps.LatLngBounds();

        var length = myPlaces.length;

        // Style the markers a bit. This will be my listing marker icon.
        var defaultIcon = self.makeMarkerIcon('f75850');

        //Creating list places with markers
        for (var i = 0 ; i < length ; i++) {
            this.position = myPlaces[i].location;
            this.title = myPlaces[i].title;

            //Create marker for the place
            this.marker = new google.maps.Marker({
                map: map,
                position: this.position,
                title: this.title,
                id: i,
                icon: defaultIcon,
                animation: google.maps.Animation.DROP
            });

            //Add click listener of marker to open info window
            this.marker.setMap(map);
            this.placesMarkerList.push(this.marker);
            this.marker.addListener('click', self.populateAndBounceMarker);
            this.bounds.extend(this.marker.position);
            this.marker.addListener('mouseover', self.changeMarkerHighlightedIcon);
            this.marker.addListener('mouseout', self.changeMarkerDefaultIcon);
        }

        map.fitBounds(this.bounds);
    };

    this.initMap();

    this.myPlacesFilter = ko.computed(function () {
        var places = [];
        self.placesMarkerList.forEach(function (Marker) {
            if (Marker.title.toLowerCase().includes(self.searchPlace().toLowerCase())) {
                places.push(Marker);
                Marker.setVisible(true);
            } else
                Marker.setVisible(false);
        });
        return places;
    });
};

function showNeighborhoodMap() {
    ko.applyBindings(new neighborhoodMapModel());
}