// ===============================
// GET USER GPS LOCATION
// ===============================
function getUserLocation(callback) {
    if (!navigator.geolocation) {
        callback(null); // Geolocation not supported
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            callback({
                lat: latitude,
                lon: longitude
            });
        },
        function () {
            callback(null); // User denied or error
        }
    );
}

// ===============================
// OPEN NEAREST POLICE / HOSPITAL IN GOOGLE MAPS
// ===============================
function openNearest(type) {
    // Type can be 'police' or 'hospital'
    window.open(
        `https://www.google.com/maps/search/nearest+${type}`,
        "_blank"
    );
}