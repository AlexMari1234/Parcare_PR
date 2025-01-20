import paho.mqtt.client as mqtt
import json
from flask import Flask, render_template, jsonify, make_response

# Configurație Flask
app = Flask(__name__)

# Configurație MQTT
broker = "localhost"  # Adresa IP a brokerului MQTT (rulat local)
port = 1883
topic = "test/esp32/data"

# Stare curentă a datelor
current_state = {"free_spots": None, "occupancy_times": [0, 0, 0], "led_states": [0, 0, 0]}

# Callback pentru conectare la broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Conectat la broker!")
        client.subscribe(topic)
    else:
        print(f"Eroare la conectare. Cod: {rc}")

# Callback pentru primirea mesajelor
def on_message(client, userdata, msg):
    global current_state
    try:
        payload = msg.payload.decode()
        print(f"[{msg.topic}] {payload}")
        # Parsează JSON-ul primit
        data = json.loads(payload.split(" ", 1)[1])  # Ignoră ID-ul și parsează JSON-ul
        current_state = data
    except Exception as e:
        print(f"Eroare la procesarea mesajului: {e}")

# Configurare client MQTT
mqtt_client = mqtt.Client("PythonClient")
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect(broker, port, 60)

# Rulează clientul MQTT într-un fir separat
mqtt_client.loop_start()

# Route pentru frontend
@app.route('/')
def index():
    return render_template('index.html')

# Route pentru date
@app.route('/data')
def get_data():
    global current_state
    if current_state:
        return jsonify(data=current_state)
    return make_response("", 204)

if __name__ == '__main__':
    # Load SSL context
    context = ('cert.pem', 'key.pem')  # Certificatul și cheia privată
    app.run(ssl_context=context, host='0.0.0.0', port=443)  # HTTPS pe portul 443
