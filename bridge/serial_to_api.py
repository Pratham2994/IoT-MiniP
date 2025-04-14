import serial
import requests

arduino = serial.serial_for_url('rfc2217://localhost:4000', baudrate=9600)

while True:
    line = arduino.readline().decode().strip()
    if line in ["entry", "exit"]:
        print(f"Detected: {line}")
        try:
            requests.get(f"http://localhost:8000/update?event={line}")
        except:
            print("❌ Failed to reach FastAPI")
