#define ENTRY_PIN 2
#define EXIT_PIN 3

int lastEntryState = HIGH;
int lastExitState = HIGH;

void setup() {
  Serial.begin(9600);
  pinMode(ENTRY_PIN, INPUT_PULLUP);
  pinMode(EXIT_PIN, INPUT_PULLUP);
}

void loop() {
  int entryState = digitalRead(ENTRY_PIN);
  int exitState = digitalRead(EXIT_PIN);

  if (entryState == LOW && lastEntryState == HIGH) {
    Serial.println("entry");
    delay(200); // debounce
  }

  if (exitState == LOW && lastExitState == HIGH) {
    Serial.println("exit");
    delay(200); // debounce
  }

  lastEntryState = entryState;
  lastExitState = exitState;
}
