# Sistem de Parcare Rezidentiala Inteligenta IoT - Marinescu Alexandru Gabriel 343C1

## Rezumat
Acest proiect implementeaza un sistem de parcare inteligent destinat unei parcari rezidentiale mici, utilizand tehnologie IoT si conectivitate cloud. Solutia integreaza hardware-ul local bazat pe ESP32 si Arduino, senzori ultrasonici, un sistem de autentificare RFID, un backend Python, si un frontend interactiv pentru vizualizarea si gestionarea parcarii.

Ideea proiectului este urmatoarea: Un "sofer" vrea sa vina sa isi parcheze masina si isi scaneaza cartela RFID atunci cand intra in parcare. Daca este scanat un ID respectiv, bariera se ridica la 90 de grade timp de 5 secunde, dupa care revine in pozitia initiala. In parcare sunt 3 locuri de parcare si pe un ecran LCD se afiseaza numarul total de locuri libere din parcare. Pentru a detecta daca un loc este ocupat sau liber se folosesc senzori de proximitate care detecteaza daca un obiect este la maxim 8 cm, atunci acel loc este ocupat. De asemenea, acest lucru este dat si prin leduri care se aprind daca un loc este ocupat. Cand masina vrea sa iasa din parcare apasa un buton care ridica bariera similar ca la intrare 5 secunde la 90 de grade, dupa care revine in pozitia initiala. Arhitectura hardware este conceputa pe ARDUINO UNO, care comunica cu ESP32 prin interfata seriala, prin UART, dupa acesta prin wifi transmite datele la backend prin mqtt broker intr-un json cu numarul de locuri libere, cat timp au fost ocupate si starea lor. La frontend se transmit aceste date pentru a putea fi procesate si la notificari si la grafic.

## Caracteristici
- **Autentificare RFID**: Permite accesul utilizatorilor autorizati prin scanarea unui card RFID.
- **Monitorizare locuri de parcare**: Urmareste ocuparea locurilor in timp real si afiseaza informatii pe LCD.
- **Rezervari online**: Interfata web permite utilizatorilor sa rezerve locuri de parcare.
- **Control si notificari**: Gestioneaza bariera de acces si trimite notificari despre statusul locurilor.
- **Vizualizare date**: Graficul afiseaza timpul total liber si ocupat al fiecarui loc.
- **Securitate**: Comunicarea este protejata prin protocoale TLS/SSL.

---

## Introducere

### Scopul proiectului
Proiectul isi propune sa rezolve problema gestionarii eficiente a accesului si a locurilor de parcare intr-un spatiu rezidential mic. Utilizand tehnologia IoT, sistemul ofera:
- Acces sigur prin RFID.
- Monitorizare si vizualizare in timp real.
- Rezervari online pentru locuri.

### Obiective
- Dezvoltarea unui sistem hardware bazat pe senzori si actuatori.
- Implementarea unui backend securizat si a unui dashboard web.
- Vizualizarea datelor si generarea de notificari.

---

## Arhitectura

### Componente hardware

1. **ESP32**: Microcontroller principal pentru conectivitate Wi-Fi și comunicare MQTT.
   - **Detalii adiționale**: Implementarea conexiunii MQTT utilizează brokerul public Adafruit IO. Conexiunea se face pe un topic specific folosind un nume de utilizator și o cheie de autentificare unică (API Key). Aceasta permite publicarea și abonarea la mesaje în timp real fără rate limit (spre deosebire de brokerul test.mosquitto.org, care avea limitări stricte). Inițial, sistemul a fost configurat să funcționeze cu un broker local (192.168.0.21), dar după o serie de probleme tehnice și sesiuni extinse de debugging, implementarea a fost migrată pe Adafruit IO pentru o soluție mai stabilă.
2. **Arduino Uno**: Gestionarea senzorilor ultrasonici și a actuatorilor.
3. **Senzori Ultrasonici HC-SR04**: Detectează ocuparea locurilor de parcare.
   - **Senzor 1**:
     - Trig -> Pin digital 7
     - Echo -> Pin digital 8
   - **Senzor 2**:
     - Trig -> Pin analogic A0
     - Echo -> Pin analogic A1
   - **Senzor 3**:
     - Trig -> Pin analogic A2
     - Echo -> Pin analogic A3
   - Toți senzorii:
     - VCC -> 5V
     - GND -> GND
4. **RFID MFRC-522**: Permite autentificarea utilizatorilor prin UID-ul cardurilor RFID.
   - SDA (SS) -> Pin digital 10
   - SCK -> Pin digital 13
   - MOSI -> Pin digital 11
   - MISO -> Pin digital 12
   - RST -> Pin digital 9
   - VCC -> 3.3V
   - GND -> GND
5. **Servo Motor SG90**: Controlează bariera de acces.
   - Control -> Pin digital 3 (PWM)
   - VCC -> 5V
   - GND -> GND
6. **LCD I2C (20x4)**:
   - SDA -> Pin analogic A4
   - SCL -> Pin analogic A5
   - VCC -> 5V
   - GND -> GND
7. **LED-uri**:
   - LED 1: Anod -> Pin digital 4, Catod -> GND prin rezistor de 220Ω
   - LED 2: Anod -> Pin digital 5, Catod -> GND prin rezistor de 220Ω
   - LED 3: Anod -> Pin digital 6, Catod -> GND prin rezistor de 220Ω
8. **Buton manual**:
   - Un pin al butonului -> GND
   - Celălalt pin al butonului -> Pin digital 2 (cu un rezistor pull-up de 10kΩ la 5V).

### Diagrama conexiunilor hardware
Adaugarea acestei diagrame poate ajuta la o mai buna vizualizare a conexiunilor fizice. Vom include o diagrama ilustrativa care arata cum sunt conectate modulele la Arduino si ESP32:

- **ESP32**:
  - Alimentare: 3.3V/GND.
  - Conexiune UART cu Arduino:
    - RX (ESP32) -> TX (Arduino).
    - TX (ESP32) -> RX (Arduino).
  - Comunicare MQTT prin Wi-Fi pentru conectarea la backend utilizand brokerul Adafruit IO.

- **Arduino Uno**:
  - Alimentare: 5V/GND.
  - Conexiuni cu senzori, LED-uri si alte componente:
    - Senzori ultrasonici HC-SR04 (detalii de conectare in sectiunea hardware).
    - Controlul LED-urilor si afisajului LCD prin pini digitali.

- **Senzori ultrasonici**: Detecteaza distanta si ofera date de ocupare pentru fiecare loc de parcare.
  - Trig si Echo conectate la pinii specifici de pe Arduino (detalii in sectiunea hardware).

- **RFID MFRC-522**: Gestionarea accesului prin UID-ul cardurilor RFID.
  - Pinii pentru conexiuni SPI (SCK, MOSI, MISO, SDA, RST) legati la Arduino.

### Topologia retelei
Sistemul urmeaza o arhitectura de tip stea:

- **ESP32**:
  - Actioneaza ca nod central responsabil pentru procesarea datelor de la Arduino si trimiterea lor catre backend.

- **Backend Python**:
  - Gazduit local sau in cloud.
  - Rol principal in procesarea datelor si expunerea acestora printr-un API pentru frontend.

- **Frontend web**:
  - Permite utilizatorilor sa vizualizeze starea locurilor de parcare in timp real.

### Protocoale de comunicare
1. **MQTT**:
   - Utilizat pentru comunicare eficienta intre ESP32 si backend.
   - Mesajele sunt publicate si abonate pe un topic dedicat.
   - Brokerul MQTT utilizat este **Adafruit IO**, care permite conectarea pe un topic specific cu ajutorul unui nume de utilizator si a unei chei unice de autentificare (API Key). Acest broker ofera stabilitate si permite publicarea de mesaje in timp real fara rate limit, spre deosebire de test.mosquitto.org care avea limitari stricte. Initial, sistemul a functionat pe un broker local (192.168.0.21), dar din cauza unor probleme tehnice si debug complex, s-a optat pentru migrarea la Adafruit IO.

2. **HTTPS**:
   - Asigura securitatea datelor transmise intre frontend si backend.

3. **UART**:
   - Protocol serial utilizat intre ESP32 si Arduino pentru schimb de date hardware in timp real.

### Detalii despre comunicarea seriala (UART)
ESP32 si Arduino comunica prin pinii RX si TX:

- **Conexiuni fizice**:
  - RX (ESP32) -> TX (Arduino).
  - TX (ESP32) -> RX (Arduino).

- **Setari**:
  - Baud Rate: 9600 bps.
  - Configuratie: 8N1 (8 biti de date, fara bit de paritate, 1 bit de stop).

- **Structura datelor transmise**:
  - Datele sunt transmise sub forma de JSON, care include urmatoarele campuri:
    - **free_spots**: Numarul de locuri libere disponibile.
    - **occupancy_times**: Vector cu timpul total ocupat pentru fiecare loc in secunde.
    - **led_states**: Vector care indica starea LED-urilor (0 pentru liber, 1 pentru ocupat).

Aceasta abordare asigura o actualizare eficienta si sincronizata a informatiilor intre componentele hardware si backend.

---

## Implementare

### Configurare hardware
1. **Montarea senzorilor ultrasonici**
   - Amplasati senzori HC-SR04 in pozitii strategice pe fiecare loc de parcare.
   - Calibrati senzorii pentru a detecta distante sub 8 cm ca "ocupat".

2. **Conectarea servo motorului**
   - Conectati servo-ul la pinul digital 3 al Arduino.
   - Configurati pozitiile 0° (coborat) si 90° (ridicat).

3. **Integrarea RFID**
   - Conectati cititorul RFID la pinii SPI (SS: 10, RST: 9).
   - Configurati UID-urile autorizate in cod.

4. **Configurare ESP32**
   - Conectati RX/TX la Arduino.
   - Configurati reteaua Wi-Fi si broker-ul MQTT.

5. **Configurare LCD**
   - Conectati SDA si SCL la pinii A4 si A5.
   - Configurati libraria LiquidCrystal_I2C pentru afisare text.

### Configurare software
1. **Arduino**:
   - Codul colecteaza datele de la senzori, controleaza LED-urile si bariera.
   - Trimite date in format JSON prin seriala catre ESP32.
2. **ESP32**:
   - Preia datele de la Arduino si le publica pe broker-ul MQTT.
3. **Backend Python**:
   - Flask gestioneaza endpoint-uri pentru frontend.
   - Stocheaza datele primite de la MQTT.
4. **Frontend JavaScript**:
   - Afiseaza datele in timp real folosind Chart.js pentru grafice.

---

## Vizualizare si procesare de date

### Interfata web
- **Sectiuni principale**:
  1. Status locuri: Liber/Ocupat.
  2. Notificari: Afiseaza ultimele 5 schimbari in timp real (daca se trece din liber in ocupat se scrie P1 a devenit ocupat; daca se trece din ocupat in liber se scrie P1 a fost ocupat timp de X secunde; daca parcarea devine plina, adica toate locurile sunt ocupate, atunci se scrie Parcarea este plina).
  3. Grafic: Timp liber vs. ocupat pentru fiecare loc.

### Detalii despre grafice
1. **Bar Chart**:
   - Etichete: P1, P2, P3 (locurile de parcare).
   - Doua seturi de date:
     - Timp liber (verde).
     - Timp ocupat (rosu).
     Acestea se actualizeaza real-time si numarul de secunde de pe axa OY creste fie la liber fie la ocupat in functie de starea ledului.

2. **Line Chart**:
   - Afiseaza starea fiecarui loc in timp real.
   - Axe:
     - X: Ora actuala.
     - Y: Stare (0 pentru liber, 1 pentru ocupat).

### Procesare date
1. **Backend**:
   - Parseaza JSON-ul primit prin MQTT.
   - Calculeaza timpul total liber si ocupat pentru fiecare loc.
2. **Frontend**:
   - Utilizeaza datele pentru a actualiza vizualizarile in timp real.
   - Limiteaza notificarile la ultimele 5 evenimente.

---

## Securitate

1. **SSL/TLS**:
   - Backend-ul utilizeaza certificat TLS pentru securizarea comunicatiei cu frontend-ul.
2. **Autorizare**:
   - UID-urile RFID sunt verificate local si prin backend.

---

## Testare

1. **Hardware**:
   - Testati functionarea senzorilor ultrasonici folosind valori de test.
   - Verificati comportamentul servo motorului pentru ridicare/coborare bariera.
2. **Software**:
   - Simulati fluxurile de date in backend pentru a valida procesarea.
   - Verificati frontend-ul pentru afisarea corecta a datelor.
3. **Parcare plina**:
   - Simulati ocuparea tuturor locurilor pentru a valida afisarea mesajului "Parcarea este plina" in dashboard.

---

## Concluzii
Proiectul Sistem de Parcare Rezidentiala Inteligenta demonstreaza cum tehnologiile IoT pot fi aplicate pentru a rezolva probleme de zi cu zi. Sistemul asigura gestionarea eficienta a locurilor de parcare, ofera o interfata prietenoasa pentru utilizatori si securitate sporita pentru datele transmise.

---

