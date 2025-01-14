import serial
import requests
import time
import json

# Serial port configuration
SERIAL_PORT = 'COM4'  # Modify if using a different port
BAUD_RATE = 9600

# URL of the Flask application on Heroku
HEROKU_URL = 'https://alexmari-parcare-3c400345e310.herokuapp.com/update-data'

# Initialize the serial connection
try:
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"Connected to {SERIAL_PORT} at {BAUD_RATE} baud rate.")
except Exception as e:
    print(f"Error opening serial port: {e}")
    exit()

# Main loop for reading data and sending it to the server
while True:
    try:
        if arduino.in_waiting > 0:
            # Read a line from Arduino
            data = arduino.readline().decode('utf-8').strip()
            print(f"Received from Arduino: {data}")

            # Send data to the server only if it's valid
            try:
                parsed_data = json.loads(data)  # Parse the JSON data
                response = requests.post(HEROKU_URL, json=parsed_data, timeout=5)
                print(f"Sent to server: {parsed_data}, Response: {response.status_code}")
            except json.JSONDecodeError:
                print(f"Invalid JSON received: {data}")
            except requests.RequestException as e:
                print(f"Error sending data to server: {e}")

        # Wait one second before the next read
        time.sleep(1)

    except KeyboardInterrupt:
        print("Interrupted by user. Exiting...")
        arduino.close()
        break
