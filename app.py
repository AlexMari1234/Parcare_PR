import atexit
import serial
from flask import Flask, render_template, jsonify, make_response

# Initialize Flask app
app = Flask(__name__)

# Serial communication
arduino = serial.Serial(port='COM4', baudrate=9600, timeout=1)

# Close serial port when exiting
def close_serial():
    if arduino.is_open:
        arduino.close()

atexit.register(close_serial)

# Previous state to detect changes
previous_state = {"free_spots": None, "occupancy_times": [0, 0, 0]}

# Route for frontend
@app.route('/')
def index():
    return render_template('index.html')

# Route to fetch parking data
@app.route('/data')
def get_data():
    global previous_state
    try:
        if arduino.in_waiting > 0:
            data = arduino.readline().decode('utf-8').strip()
            if data:
                current_state = eval(data)

                
                if previous_state["free_spots"] is None:
                    previous_state = current_state
                    return jsonify(data=current_state)

               
                if (current_state["free_spots"] != previous_state["free_spots"] or
                   current_state["occupancy_times"] != previous_state["occupancy_times"]):
                    previous_state = current_state
                    return jsonify(data=current_state)

    except Exception as e:
        return jsonify(error=str(e))

   
    return make_response("", 204)

if __name__ == '__main__':
    app.run()
