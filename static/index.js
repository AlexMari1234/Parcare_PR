let lastLedStates = [0, 0, 0]; // The last state of the LEDs (occupied/free)
let lastOccupancyTimes = [0, 0, 0]; // The last occupancy times
let finalOccupancyTimes = [0, 0, 0]; // Final occupancy times for notifications

document.addEventListener("DOMContentLoaded", () => {
    setInterval(fetchData, 500); // Fetch data every 500 milliseconds
});

function fetchData() {
    fetch('/data')
        .then(response => {
            if (response.status === 204) {
                console.log("No changes detected.");
                return null;
            }
            return response.json();
        })
        .then(json => {
            if (json && json.data) {
                updateParkingLots(json.data);
            }
        })
        .catch(err => console.error("Error fetching data:", err));
}

function updateParkingLots(data) {
    const lots = ["P1", "P2", "P3"];
    const notifications = document.getElementById('notifications');

    lots.forEach((lot, index) => {
        const element = document.getElementById(lot);
        const timeElement = document.getElementById(`${lot}-time`);
        const isOccupied = data.led_states[index] === 1;

        // Update the visual state of the parking spots
        element.className = isOccupied ? "lot occupied" : "lot free";
        element.textContent = `${lot} - ${isOccupied ? "Occupied" : "Free"}`;
        timeElement.textContent = isOccupied ? `Occupied for ${data.occupancy_times[index]} seconds` : "";

        // Handle notifications and final occupancy time
        if (isOccupied && lastLedStates[index] === 0) {
            // The spot has become occupied
            addNotification(`${lot} is now occupied.`);
        } else if (!isOccupied && lastLedStates[index] === 1) {
            // The spot has become free
            finalOccupancyTimes[index] = lastOccupancyTimes[index]; // Store the last value
            addNotification(`${lot} was occupied for ${finalOccupancyTimes[index]} seconds.`);
        }

        // Update the occupancy time for continuous display
        if (isOccupied) {
            lastOccupancyTimes[index] = data.occupancy_times[index];
        }

        // Update the current state
        lastLedStates[index] = isOccupied ? 1 : 0;
    });

    // Limit notifications to the last 5
    while (notifications.children.length > 5) {
        notifications.removeChild(notifications.firstChild);
    }
}

function addNotification(message) {
    const notifications = document.getElementById('notifications');
    const notif = document.createElement("div");
    notif.className = "notification";
    notif.textContent = message;
    notifications.appendChild(notif);
}
