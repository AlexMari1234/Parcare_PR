let lastLedStates = [0, 0, 0]; // Ultima stare a LED-urilor (ocupat/liber)
let lastOccupancyTimes = [0, 0, 0]; // Ultimele timpuri de ocupare
let finalOccupancyTimes = [0, 0, 0]; // Timpurile finale pentru notificari
let wasFull = false; // Indicator daca parcarea a fost complet ocupata

// Vectori pentru timpul total liber si ocupat pentru fiecare loc
let totalFreeTime = [0, 0, 0];
let totalOccupiedTime = [0, 0, 0];

document.addEventListener("DOMContentLoaded", () => {
    setInterval(updateEverything, 1000); // Actualizare sincronizata la fiecare secunda
});

// Functia principala care gestioneaza toate actualizarile
function updateEverything() {
    fetchData(); // Solicita date de la server
    updateTimes(); // Actualizeaza timpul liber/ocupat
}

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
    const statusMessage = document.getElementById('status-message'); // Mesajul general despre parcari

    let freeSpots = 0; // Numarul de locuri libere

    lots.forEach((lot, index) => {
        const element = document.getElementById(lot);
        const timeElement = document.getElementById(`${lot}-time`);
        const isOccupied = data.led_states[index] === 1;

        // Actualizeaza starea vizuala a locurilor
        element.className = isOccupied ? "lot occupied" : "lot free";
        element.textContent = `${lot} - ${isOccupied ? "Ocupat" : "Liber"}`;
        timeElement.textContent = isOccupied ? `Ocupat de ${data.occupancy_times[index]} secunde` : "";

        // Calculeaza locurile libere
        if (!isOccupied) {
            freeSpots++;
        }

        // Gestionarea notificarilor si timpului final de ocupare
        if (isOccupied && lastLedStates[index] === 0) {
            addNotification(`${lot} a devenit ocupat.`);
        } else if (!isOccupied && lastLedStates[index] === 1) {
            // Adaugam 2 secunde la timpul final pentru notificare
            finalOccupancyTimes[index] = lastOccupancyTimes[index] + 2; // Offset pentru delay
            addNotification(`${lot} a fost ocupat timp de ${finalOccupancyTimes[index]} secunde.`);
        }

        // Actualizeaza timpul ocupat pentru afisare continua
        if (isOccupied) {
            lastOccupancyTimes[index] = data.occupancy_times[index];
        }

        // Actualizeaza starea curenta
        lastLedStates[index] = isOccupied ? 1 : 0;
    });

    // Afiseaza notificarea "Parcarea este plina" cand toate locurile sunt ocupate
    if (freeSpots === 0) {
        if (!wasFull) {
            addNotification("Parcarea este plina!");
            statusMessage.textContent = "Parcarea este plina!";
            statusMessage.style.color = "red";
            wasFull = true; // Marcam ca parcarea este plina
        }
    } else {
        // Actualizeaza corect numarul de locuri libere
        statusMessage.textContent = `Sunt ${freeSpots} locuri libere.`;
        statusMessage.style.color = "green";
        wasFull = false; // Resetam daca parcarea nu mai este plina
    }

    // Limitam notificarile la ultimele 5
    while (notifications.children.length > 5) {
        notifications.removeChild(notifications.firstChild);
    }

    // Actualizare grafice
    updateBarChart();
    updateLineChart();
}

function updateTimes() {
    // Actualizeaza timpul liber si ocupat pe baza starii curente
    lastLedStates.forEach((state, index) => {
        if (state === 0) {
            totalFreeTime[index] += 1; // Creste timpul liber
        } else {
            totalOccupiedTime[index] += 1; // Creste timpul ocupat
        }
    });
}

function addNotification(message) {
    const notifications = document.getElementById('notifications');
    const notif = document.createElement("div");
    notif.className = "notification";
    notif.textContent = message;
    notifications.appendChild(notif);
}

// Initializare grafice
const barChartCtx = document.getElementById('barChart').getContext('2d');
const barChart = new Chart(barChartCtx, {
    type: 'bar',
    data: {
        labels: ["P1", "P2", "P3"],
        datasets: [
            {
                label: "Timp Liber (secunde)",
                backgroundColor: "green",
                data: totalFreeTime
            },
            {
                label: "Timp Ocupat (secunde)",
                backgroundColor: "red",
                data: totalOccupiedTime
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

const lineChartCtx = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(lineChartCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: "Stare P1",
                borderColor: "red",
                data: []
            },
            {
                label: "Stare P2",
                borderColor: "blue",
                data: []
            },
            {
                label: "Stare P3",
                borderColor: "green",
                data: []
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

function updateBarChart() {
    barChart.data.datasets[0].data = totalFreeTime;
    barChart.data.datasets[1].data = totalOccupiedTime;
    barChart.update();
}

function updateLineChart() {
    const currentTime = new Date().toLocaleTimeString();
    lineChart.data.labels.push(currentTime);

    lastLedStates.forEach((state, index) => {
        lineChart.data.datasets[index].data.push(state);
    });

    if (lineChart.data.labels.length > 10) {
        lineChart.data.labels.shift();
        lineChart.data.datasets.forEach(dataset => dataset.data.shift());
    }

    lineChart.update();
}
