let lastLedStates = [0, 0, 0]; // Ultima stare a LED-urilor (ocupat/liber)
let lastOccupancyTimes = [0, 0, 0]; // Ultimele timpuri de ocupare
let finalOccupancyTimes = [0, 0, 0]; // Timpurile finale pentru notificări

document.addEventListener("DOMContentLoaded", () => {
    setInterval(fetchData, 2000); // Solicită date la fiecare 2 secunde
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

        // Actualizează starea vizuală a locurilor
        element.className = isOccupied ? "lot occupied" : "lot free";
        element.textContent = `${lot} - ${isOccupied ? "Ocupat" : "Liber"}`;
        timeElement.textContent = isOccupied ? `Ocupat de ${data.occupancy_times[index]} secunde` : "";

        // Gestionarea notificărilor și timpului final de ocupare
        if (isOccupied && lastLedStates[index] === 0) {
            // Locul a devenit ocupat
            addNotification(`${lot} a devenit ocupat.`);
        } else if (!isOccupied && lastLedStates[index] === 1) {
            // Locul a devenit liber
            finalOccupancyTimes[index] = lastOccupancyTimes[index]; // Reține ultima valoare
            addNotification(`${lot} a fost ocupat timp de ${finalOccupancyTimes[index]} secunde.`);
        }

        // Actualizează timpul ocupat pentru afișare continuă
        if (isOccupied) {
            lastOccupancyTimes[index] = data.occupancy_times[index];
        }

        // Actualizează starea curentă
        lastLedStates[index] = isOccupied ? 1 : 0;
    });

    // Limităm notificările la ultimele 5
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
