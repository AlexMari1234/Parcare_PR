import os
import json
from flask import Flask, render_template, request, jsonify, make_response

# Initialize Flask app
app = Flask(__name__)

# Global variable for storing data
current_state = {"free_spots": None, "occupancy_times": [0, 0, 0], "led_states": [0, 0, 0]}

# Route for the frontend
@app.route('/')
def index():
    return render_template('index.html')

# Route for receiving data from the local script
@app.route('/update-data', methods=['POST'])
def update_data():
    global current_state
    try:
        data = request.get_json()
        if data:
            current_state = data
            return jsonify({"message": "Data updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route for sending data to the frontend
@app.route('/data')
def get_data():
    global current_state
    return jsonify(data=current_state)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
