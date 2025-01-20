import paho.mqtt.client as mqtt

# Configurație MQTT
broker = "localhost"  # Rulează Mosquitto pe PC-ul local
port = 1883
topic = "test/esp32/data"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Conectat la broker!")
        client.subscribe(topic)
    else:
        print(f"Eroare la conectare. Cod: {rc}")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"[{msg.topic}] {payload}")
    if payload.startswith("ID:"):
        # Extrage ID-ul și conținutul mesajului
        parts = payload.split(" ", 1)
        if len(parts) == 2:
            message_id, content = parts
            print(f"ID Mesaj: {message_id} | Conținut: {content}")
        else:
            print("Mesaj în format necunoscut.")

client = mqtt.Client("PythonClient", protocol=mqtt.MQTTv311)

client.on_connect = on_connect
client.on_message = on_message

# Conectare la broker
client.connect(broker, port, 60)

# Rulează bucla principală
print("Se așteaptă mesaje de la ESP32...")
client.loop_forever()
