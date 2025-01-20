import serial
import requests
import time
import json

# Configurare port serial
SERIAL_PORT = 'COM4'  # Modifică dacă folosești alt port
BAUD_RATE = 9600

# URL-ul aplicației Flask de pe Heroku
HEROKU_URL = 'https://alexmari-parcare-3c400345e310.herokuapp.com/update-data'

# Inițializare conexiune serială
try:
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"Connected to {SERIAL_PORT} at {BAUD_RATE} baud rate.")
except Exception as e:
    print(f"Error opening serial port: {e}")
    exit()

# Bucla principală pentru citirea datelor și trimiterea lor la server
while True:
    try:
        if arduino.in_waiting > 0:
            # Citește linia de la Arduino
            data = arduino.readline().decode('utf-8').strip()
            print(f"Received from Arduino: {data}")

            # Trimite datele către server doar dacă sunt valide
            try:
                parsed_data = json.loads(data)  # Parsează JSON-ul
                response = requests.post(HEROKU_URL, json=parsed_data, timeout=5)
                print(f"Sent to server: {parsed_data}, Response: {response.status_code}")
            except json.JSONDecodeError:
                print(f"Invalid JSON received: {data}")
            except requests.RequestException as e:
                print(f"Error sending data to server: {e}")

        # Așteaptă o secundă înainte de următoarea lectură
        time.sleep(1)

    except KeyboardInterrupt:
        print("Interrupted by user. Exiting...")
        arduino.close()
        break
