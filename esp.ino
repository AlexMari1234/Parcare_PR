#include <WiFi.h>
#include <PubSubClient.h>

// Configurație WiFi
const char* ssid = "RAMCONSULTING";         // Numele rețelei WiFi
const char* password = "paradmin";          // Parola rețelei WiFi

// Configurație broker MQTT (Adafruit IO)
const char* mqttServer = "io.adafruit.com"; // Adresa brokerului Adafruit IO
const int mqttPort = 1883;                  // Portul pentru conexiuni non-secure
const char* mqttUsername = "AlexMari";      // Username Adafruit IO
const char* mqttPassword = "your-key";
const char* mqttTopic = "AlexMari/feeds/test-esp32-data";       // Topic-ul feed-ului

// Obiecte WiFi și MQTT
WiFiClient espClient;
PubSubClient client(espClient);

// Pini pentru UART
#define RXD2 16 // RX pin al ESP32 (legat la TX de pe Arduino)
#define TXD2 17 // TX pin al ESP32 (legat la RX de pe Arduino)

// ID-ul mesajului
int messageID = 0;

void setup() {
  Serial.begin(115200); // Serial pentru debug
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2); // Serial pentru comunicare cu Arduino

  // Conectare la WiFi
  Serial.println("Conectare la WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Se încearcă conectarea la WiFi...");
  }
  Serial.println("Conectat la WiFi!");
  Serial.print("Adresa IP: ");
  Serial.println(WiFi.localIP());

  // Configurare client MQTT
  client.setServer(mqttServer, mqttPort);
  connectToMQTTBroker();
}

void loop() {
  if (!client.connected()) {
    connectToMQTTBroker();
  }
  client.loop();

  // Citește mesaje de la Arduino și publică pe MQTT
  if (Serial2.available() > 0) {
    String message = Serial2.readStringUntil('\n');
    message.trim(); // Elimină spațiile sau caracterele extra
    if (message.length() > 0) {
      // Adaugă ID-ul mesajului
      messageID++;
      String fullMessage = "ID:" + String(messageID) + " " + message;

      Serial.println("Mesaj primit de la Arduino: " + message);
      Serial.println("Mesaj complet trimis prin MQTT: " + fullMessage);

      if (client.publish(mqttTopic, fullMessage.c_str())) {
        Serial.println("Mesaj trimis cu succes prin MQTT!");
      } else {
        Serial.println("Eroare la trimiterea mesajului prin MQTT.");
      }
    }
  }
}

void connectToMQTTBroker() {
  while (!client.connected()) {
    Serial.println("Se conectează la brokerul MQTT Adafruit IO...");
    String clientId = "ESP32Client-" + String(WiFi.macAddress());
    if (client.connect(clientId.c_str(), mqttUsername, mqttPassword)) {
      Serial.println("Conectat la brokerul MQTT Adafruit IO!");
      client.subscribe(mqttTopic); // Abonează-te la topic
    } else {
      Serial.print("Eroare de conectare, cod: ");
      Serial.println(client.state());
      delay(2000);
    }
  }
}
