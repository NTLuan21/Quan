const long = 106.660172;
const lat = 10.762622;

mapboxgl.accessToken =
  "pk.eyJ1IjoiaHV5azIxIiwiYSI6ImNsbnpzcWhycTEwbnYybWxsOTAydnc2YmYifQ.55__cADsvmLEm7G1pib5nA";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [long, lat],
  zoom: 15,
});

map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
  })
);

let currentMarker; // This will keep track of the current marker on the map

// Add a click event to the map to perform reverse geocoding
map.on("click", function (e) {
  // Remove the previous marker if it exists
  if (currentMarker) {
    currentMarker.remove();
  }

  // Construct the URL for reverse geocoding using the clicked coordinates
  var url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?access_token=${mapboxgl.accessToken}`;

  // Create a marker at the clicked location
  currentMarker = new mapboxgl.Marker().setLngLat(e.lngLat).addTo(map);

  // Fetch the result
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data && data.features && data.features.length > 0) {
        var popup = new mapboxgl.Popup({ offset: 25 }).setText(
          "Address: " + data.features[0].place_name
        );
        currentMarker.setPopup(popup).togglePopup(); // Set popup to marker and show it
      } else {
        throw new Error("No address found for this location");
      }
    })
    .catch((error) => {
      console.error("Error fetching address: ", error);
      currentMarker.remove(); // Remove the marker if geocoding fails.
    });
});
// Assuming the rest of your code before this...

// 1. Add Fullscreen control
map.addControl(new mapboxgl.FullscreenControl());

// 2. Add Zoom controls (Zoom in / Zoom out)
map.addControl(new mapboxgl.NavigationControl());

// 3. Add User Location control (this will show the user's location and allow for tracking)
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true, // Set to true to keep tracking user's location
    showUserLocation: true, // Set to true to show user's location
  })
);

async function grabAdData() {
  try {
    const response = await fetch("/AdData.json");
    const data = await response.json();

    for (const feature of data.features) {
      // Continue if the feature is not properly defined
      if (!feature.properties) continue;
      
      const el = document.createElement("div");
      switch (feature.properties.status) {
        case "ĐÃ QUY HOẠCH": {
          el.className = "marker";
          break;
        }

        case "CHƯA QUY HOẠCH": {
          el.className = "yellow";
          break;
        }

        case "ĐÃ CẤP PHÉP": {
          el.className = "green";
          break;
        }

        case "BỊ BÁO CÁO": {
          el.className = "red";
          break;
        }

        default: {
          el.className = "marker";
        }
      }

      // Create the HTML content for the popup using the properties from the feature
      const popupContent = `
      <div>
      <h3>Address: ${feature.properties.address}</h3>
      <p>Quantity: ${feature.properties.quantity}</p>
      <p>Area: ${feature.properties.area}</p>
      <p>Land Type: ${feature.properties.landType}</p>
      <p>Ad Format: ${feature.properties.adFormat}</p>
      <p>Status: ${feature.properties.status}</p>
      <p>Board Type: ${feature.properties.boardType}</p>
      <p>Size: ${feature.properties.size}</p>
    </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

      // Tạo marker mới.
      const marker = new mapboxgl.Marker(el)
        .setLngLat(feature.geometry.coordinates)
        .setPopup(popup)
        .addTo(map);

      // Add 'mouseenter' event listener to show the popup.
      el.addEventListener("mouseenter", () => {
        marker.getPopup().addTo(map);
      });

      // Add 'mouseleave' event listener to remove the popup.
      el.addEventListener("mouseleave", () => {
        marker.getPopup().remove();
      });
      // Add a click event listener for each marker
      // When a marker is clicked, update and show the sidebar
      marker.getElement().addEventListener("click", function (event) {
        // Prevents the map click event (and thus the reverse geocoding) from firing
        event.stopPropagation();

        // Pass the properties of this specific feature to the sidebar
        showSidebar(feature.properties);
      });
    }
  } catch (error) {
    console.error(`Error fetching advertisement data: ${error.message}`);
  }
}

grabAdData();

// Function to show sidebar with property information
function showSidebar(properties) {
  // Update the content of the sidebar
  $("#infoContent").html(`
    <h4>Address: ${properties.address}</h4>
    <p>Quantity: ${properties.quantity}</p>
    <p>Area: ${properties.area}</p>
    <p>Land Type: ${properties.landType}</p>
    <p>Ad Format: ${properties.adFormat}</p>
    <p>Status: ${properties.status}</p>
    <p>Board Type: ${properties.boardType}</p>
    <p>Size: ${properties.size}</p>
  `);

  // Show the sidebar by adding the 'visible' class
  $("#sidebar").addClass("visible");
}
// Function to hide the sidebar
function hideSidebar() {
  $("#sidebar").removeClass("visible");
}
// On map click, show sidebar with the location information
map.on("click", function (e) {
  // Perform a reverse geocode on the clicked location
  var lngLat = e.lngLat;
  var url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`;

  $.get(url, function (data) {
    if (data.features.length > 0) {
      var placeName = data.features[0].place_name;
      showSidebar(`<strong>Location:</strong> ${placeName}`);
    } else {
      showSidebar("No location information found.");
    }
  });
});

// Prevent clicks inside the sidebar from propagating to the map, which would hide the sidebar
$("#sidebar").click(function (event) {
  event.stopPropagation();
});

// Clicking on the map canvas (outside the sidebar) hides the sidebar
$(map.getCanvas()).click(function (e) {
  if (!$(e.target).closest("#sidebar").length) {
    hideSidebar();
  }
}); // Event handler for the close button
$("#closeSidebar").click(function () {
  hideSidebar();
});
$(document).ready(function () {
  // On map click, center the map on the clicked location and show sidebar with information
  map.on("click", function (e) {
    var lngLat = e.lngLat;

    // Center the map on the clicked location
    map.flyTo({ center: lngLat });

    // Perform a reverse geocode on the clicked location
    var url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`;

    $.get(url, function (data) {
      if (data.features.length > 0) {
        var placeName = data.features[0].place_name;
        showSidebar(`<strong>Location:</strong> ${placeName}`);
      } else {
        showSidebar("No location information found.");
      }
    });
  });
});
// Your existing map setup code

// ...

// Function to open the report modal
function openReportModal() {
  var overlay = document.getElementById("pageOverlay");
  var reportModalElement = document.getElementById("reportModal");
  var reportModal = new bootstrap.Modal(reportModalElement, {
    backdrop: "static", // Keep static backdrop to prevent closing when clicking outside
  });
  reportModal.show();
  overlay.style.display = "block"; // Show the overlay
}

function closeOverlay() {
  var overlay = document.getElementById("pageOverlay");
  overlay.style.display = "none"; // Hide the overlay
}

// Event listener for the 'Report Issue' button
document
  .getElementById("reportButton")
  .addEventListener("click", openReportModal);

// Event listener for closing the modal
document
  .getElementById("reportModal")
  .addEventListener("hide.bs.modal", closeOverlay);

// Event listener for the form submission
document
  .getElementById("reportForm")
  .addEventListener("submit", function (event) {
    closeOverlay(); // Hide the overlay
    // Perform the submission logic or AJAX request here
    // For example:
    // $.post('/submit-report', $(this).serialize(), function(response) {
    //   // Handle response
    //   $('#reportModal').modal('hide'); // Hide the modal if the submission is successful
    // });
  });

// Event listener for the 'Report Issue' button
document
  .getElementById("reportButton")
  .addEventListener("click", openReportModal);

document.addEventListener("DOMContentLoaded", function () {
  var overlay = document.getElementById("pageOverlay");
  var toggleButton = document.getElementById("toggleSidebarButton");
  var sidebar = document.getElementById("nav-sidebar");

  toggleButton.addEventListener("click", function () {
    // Hide the toggle button
    // Show the sidebar
  });

  // If you want to be able to close the sidebar, you'd add an event listener
  // to a close button inside the sidebar. For example:
  var closeButton = document.getElementById("closeSideBar");
  closeButton.addEventListener("click", function () {});
});
document
  .getElementById("toggleSidebarButton")
  .addEventListener("click", function () {
    var sidebar = document.getElementById("nav-sidebar");
  });

document.addEventListener("DOMContentLoaded", function () {
  var sidebar = document.getElementById("nav-sidebar");
  var toggleSidebarButton = document.getElementById("toggleSidebarButton");
  var closeSideBarButton = document.getElementById("closeSideBar");
  var pageOverlay = document.getElementById("pageOverlay");
  var navSidebar = document.getElementById("nav-sidebar");

  // Function to open the sidebar
  function openSidebar() {
    navSidebar.style.transform = "translateX(0%)";
    navSidebar.style.transition = "transform 0.5s";
    pageOverlay.style.display = "block";
  }

  // Function to close the sidebar
  function closeSidebar() {
    navSidebar.style.transform = "translateX(-100%)";
    navSidebar.style.transition = "transform 0.5s";
    pageOverlay.style.display = "none";
  }

  // Event listener to toggle the sidebar
  toggleSidebarButton.addEventListener("click", openSidebar);

  // Event listener for closing sidebar using the close button
  closeSideBarButton.addEventListener("click", closeSidebar);

  // Event listener to close the sidebar when clicking on the overlay
  pageOverlay.addEventListener("click", function () {
    closeSidebar();
  });
});

document.addEventListener("fullscreenchange", () => {
  var overlay = document.getElementById("pageOverlay");
  var fsElement = document.fullscreenElement;

  if (fsElement) {
    // Append the overlay to the fullscreen element, which is the Mapbox container
    fsElement.appendChild(overlay);
    overlay.style.zIndex = "500"; // Ensure it's on top
    overlay.classList.add("active"); // Use 'active' class to control visibility with opacity
  } else {
    // If exiting fullscreen, hide the overlay and move it back to its original place
    document.body.appendChild(overlay); // Or to wherever it originally is
    overlay.classList.remove("active");
  }
});
document.getElementById("phuong1q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.702778, 10.782222], //10.782222, 106.702778
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong2q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.691389, 10.763333], //10.763333, 106.691389
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong3q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.692222, 10.775], //10.775, 106.692222
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
var buttonElement = document.getElementById("phuong4");
document.getElementById("phuong4q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.686667, 10.758333], //10.758333, 106.686667
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
var buttonElement = document.getElementById("phuong5");
document.getElementById("phuong5q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.696944, 10.789167], //10.789167, 106.696944
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
var buttonElement = document.getElementById("phuong6");
document.getElementById("phuong6q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.695556, 10.766389], //10.766389, 106.695556
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
var buttonElement = document.getElementById("phuong7");
document.getElementById("phuong7q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.700556, 10.768889], //10.768889, 106.700556
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
var buttonElement = document.getElementById("phuong8");
document.getElementById("phuong8q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.685278, 10.763333], //10.763333, 106.685278
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
var buttonElement = document.getElementById("phuong9");
document.getElementById("phuong9q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.688889, 10.768611], //10.768611, 106.688889
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
var buttonElement = document.getElementById("phuong10");
document.getElementById("phuong10q1").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.688611, 10.793333], //10.793333, 106.688611
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong1q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.691389, 10.754444], //10.754444, 106.691389
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong2q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.693056, 10.7575], //10.7575, 106.693056
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong3q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.696667, 10.756389], //10.756389, 106.696667
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong4q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.701389, 10.757222], //10.757222, 106.701389
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong6q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.697778, 10.761667], //10.761667, 106.697778
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong8q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.700833, 10.761111], //10.761111, 106.700833
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong9q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.700556, 10.764444], //10.764444, 106.700556
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong10q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.703611, 10.761667], //10.761667, 106.703611
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong13q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.708333, 10.763333], //10.763333, 106.708333
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong14q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.706944, 10.759167], //10.759167, 106.706944
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong15q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.705833, 10.756111], //10.756111, 106.705833
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong16q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.710833, 10.756389], //10.756389, 106.710833
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
document.getElementById("phuong18q4").addEventListener("click", () => {
  // Fly to a random location
  map.flyTo({
    center: [106.715, 10.758333], //10.758333, 106.715
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
});
