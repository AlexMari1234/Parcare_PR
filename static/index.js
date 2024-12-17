let lastFreeSpots = -1;
let lastOccupancyTimes = [0, 0, 0];

document.addEventListener("DOMContentLoaded", () => {
    fetchData(); 
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
                const freeSpots = json.data.free_spots;
                const occupancyTimes = json.data.occupancy_times;

                
                if (freeSpots !== lastFreeSpots || JSON.stringify(occupancyTimes) !== JSON.stringify(lastOccupancyTimes)) {
                    lastFreeSpots = freeSpots;
                    lastOccupancyTimes = occupancyTimes;
                    updateParkingLots(freeSpots, occupancyTimes);
                }
            }
        })
        .catch(err => console.error("Error fetching data:", err));
}

function updateParkingLots(freeSpots, occupancyTimes) {
    const lots = ["P1", "P2", "P3"];
    const notifications = document.getElementById('notifications');
    let currentSpots = freeSpots;

    lots.forEach((lot, index) => {
        const element = document.getElementById(lot);
        const timeElement = document.getElementById(`${lot}-time`);

        if (currentSpots > 0) {
            if (!element.classList.contains("free")) {
                element.className = "lot free";
                element.textContent = `${lot} - Liber`;

                timeElement.textContent = ""; // Ștergem timpul când e liber

                const notif = document.createElement("div");
                notif.className = "notification";
                notif.textContent = `${lot} este acum liber.`;
                notifications.appendChild(notif);
            }
            currentSpots--;
        } else {
            if (!element.classList.contains("occupied")) {
                element.className = "lot occupied";
                element.textContent = `${lot} - Ocupat`;

                timeElement.textContent = `Ocupat de ${occupancyTimes[index]} secunde`;

                const notif = document.createElement("div");
                notif.className = "notification";
                notif.textContent = `${lot} a fost ocupat (${occupancyTimes[index]} sec).`;
                notifications.appendChild(notif);
            }
        }
    });

    
    while (notifications.children.length > 5) {
        notifications.removeChild(notifications.firstChild);
    }
}


setInterval(fetchData, 2000);
