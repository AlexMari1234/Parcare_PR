import paho.mqtt.client as mqtt
import json
from flask import Flask, render_template, jsonify, make_response

# Configuratie Flask
app = Flask(__name__)

# Configuratie MQTT (Adafruit IO)
broker = "io.adafruit.com"  # Adresa brokerului Adafruit IO
port = 1883  # Portul pentru conexiuni non-secure
mqtt_username = "AlexMari"  # Username Adafruit IO
mqtt_password = "your-key"
topic = f"{mqtt_username}/feeds/test-esp32-data"  # Feed-ul Adafruit IO

# Stare curenta a datelor
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
        
        # Verificare pentru mesaje de tip "parcare plina"
        if "Parking full" in payload:
            print("Notificare: Parcarea este plina.")
            return
        
        # Parseeaza JSON-ul primit
        data = json.loads(payload.split(" ", 1)[1])  # Ignora ID-ul si parseeaza JSON-ul
        current_state = data
    except json.JSONDecodeError:
        print("Eroare: JSON invalid.")
    except Exception as e:
        print(f"Eroare la procesarea mesajului: {e}")

# Configurare client MQTT
mqtt_client = mqtt.Client("PythonClient")
mqtt_client.username_pw_set(mqtt_username, mqtt_password)  # Setare utilizator si parola
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect(broker, port, 60)

# Ruleaza clientul MQTT intr-un fir separat
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
    # Pornire server Flask pe HTTPS
    context = ('cert.pem', 'key.pem')  # Certificatul si cheia privata
    app.run(ssl_context=context, host='0.0.0.0', port=443)  # HTTPS pe portul 443
