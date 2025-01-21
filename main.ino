#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Servo
Servo myservo;
int servoPin = 3;

// RFID
#define SS_PIN 10
#define RST_PIN 9
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Ultrasonic Sensors
#define TRIG_PIN_1 7
#define ECHO_PIN_1 8
#define TRIG_PIN_2 A0
#define ECHO_PIN_2 A1
#define TRIG_PIN_3 A2
#define ECHO_PIN_3 A3

// LEDs
#define LED_PIN_1 4
#define LED_PIN_2 5
#define LED_PIN_3 6

// Button
#define BUTTON_PIN 2

// LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Timing for occupancy
unsigned long occupiedStart[3] = {0, 0, 0}; // Time when spots became occupied
bool wasOccupied[3] = {false, false, false};

// Servo timing
#define TURN_TIME 175
#define HOLD_TIME 5000

unsigned long lastActionTime = 0;
bool isRaised = false;  // To check if the servo is in the raised position

// Global free spots
int freeSpots = 3; // Number of free parking spots

void setup() {
  Serial.begin(9600); // Serial pentru ESP32
  SPI.begin();
  mfrc522.PCD_Init();

  // Initialize servo
  myservo.attach(servoPin);
  myservo.write(90);

  // Initialize ultrasonic sensors
  pinMode(TRIG_PIN_1, OUTPUT);
  pinMode(ECHO_PIN_1, INPUT);
  pinMode(TRIG_PIN_2, OUTPUT);
  pinMode(ECHO_PIN_2, INPUT);
  pinMode(TRIG_PIN_3, OUTPUT);
  pinMode(ECHO_PIN_3, INPUT);

  // Initialize LEDs
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(LED_PIN_3, OUTPUT);

  // Initialize button
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Parking System");
}

void loop() {
  // Check RFID card detection
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    handleCardDetection();
  }

  // Check button press
  if (digitalRead(BUTTON_PIN) == LOW) {
    handleButtonPress();
  }

  // Measure distances for parking spots
  float distances[3];
  distances[0] = measureDistance(TRIG_PIN_1, ECHO_PIN_1);
  distances[1] = measureDistance(TRIG_PIN_2, ECHO_PIN_2);
  distances[2] = measureDistance(TRIG_PIN_3, ECHO_PIN_3);

  // Calculate number of free spots
  freeSpots = 3;
  unsigned long currentTime = millis();

  for (int i = 0; i < 3; i++) {
    if (distances[i] < 8.0) {  // Spot is occupied
      freeSpots--;

      if (!wasOccupied[i]) {  // Spot just became occupied
        occupiedStart[i] = currentTime;
        wasOccupied[i] = true;
      }
    } else {  // Spot is free
      wasOccupied[i] = false;
    }
  }

  // Control LEDs based on occupancy
  controlLEDs(distances);

  // Send JSON data via serial
  sendJSONData(freeSpots, currentTime);

  // Update LCD
  lcd.setCursor(0, 1);
  lcd.print("Free spots: ");
  lcd.print(freeSpots);
  lcd.print("   ");

  // Check servo hold time
  if (isRaised && (millis() - lastActionTime >= HOLD_TIME)) {
    lowerServo();
  }

  delay(2000);  // Update every 2 seconds
}

void handleCardDetection() {
  // Verifică dacă parcarea este plină
  if (freeSpots == 0) {
    Serial.println("{\"card\": \"Denied\", \"action\": \"Parking full\"}");
    lcd.setCursor(0, 1);
    lcd.print("Parking Full!   ");
    delay(2000); // Afișează mesajul pentru 2 secunde
    return; // Nu permite accesul
  }

  // Procesare RFID
  String content = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " "));
    content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  content.toUpperCase();

  if (content.substring(1) == "13 5C 0C 14") { // Card autorizat
    Serial.println("{\"card\": \"Authorized\", \"action\": \"Access granted\"}");
    lcd.setCursor(0, 1);
    lcd.print("Authorized Access");
    raiseServo();
  } else { // Card neautorizat
    Serial.println("{\"card\": \"Unauthorized\", \"action\": \"Access denied\"}");
    lcd.setCursor(0, 1);
    lcd.print("Access Denied    ");
  }
}

void handleButtonPress() {
  Serial.println("{\"event\": \"Button pressed\", \"action\": \"Raising barrier\"}");
  lcd.setCursor(0, 1);
  lcd.print("Manual Access    ");
  raiseServo();
}

void raiseServo() {
  myservo.write(0);
  delay(TURN_TIME);
  myservo.write(90);
  lastActionTime = millis();
  isRaised = true;
}

void lowerServo() {
  myservo.write(180);
  delay(TURN_TIME);
  myservo.write(90);
  isRaised = false;
}

float measureDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return (duration / 2.0) * 0.0343;
}

void controlLEDs(float distances[3]) {
  digitalWrite(LED_PIN_1, distances[0] < 8.0 ? HIGH : LOW);
  digitalWrite(LED_PIN_2, distances[1] < 8.0 ? HIGH : LOW);
  digitalWrite(LED_PIN_3, distances[2] < 8.0 ? HIGH : LOW);
}

void sendJSONData(int freeSpots, unsigned long currentTime) {
  Serial.print("{\"free_spots\": ");
  Serial.print(freeSpots);
  Serial.print(", \"occupancy_times\": [");

  for (int i = 0; i < 3; i++) {
    unsigned long occupiedTime = wasOccupied[i] ? (currentTime - occupiedStart[i]) / 1000 : 0;
    Serial.print(occupiedTime);
    if (i < 2) Serial.print(", ");
  }

  Serial.print("], \"led_states\": [");
  Serial.print(digitalRead(LED_PIN_1) ? 1 : 0);
  Serial.print(", ");
  Serial.print(digitalRead(LED_PIN_2) ? 1 : 0);
  Serial.print(", ");
  Serial.print(digitalRead(LED_PIN_3) ? 1 : 0);
  Serial.println("]}");
}
