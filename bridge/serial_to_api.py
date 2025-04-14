import serial
import requests
import time
from concurrent.futures import ThreadPoolExecutor
import queue

# Create a queue for processing events
event_queue = queue.Queue()

def process_events():
    """Process events from the queue in a separate thread"""
    while True:
        try:
            event = event_queue.get()
            if event in ["entry", "exit"]:
                try:
                    # Use a session for connection pooling
                    with requests.Session() as session:
                        session.get(f"http://localhost:8000/update?event={event}", timeout=0.5)
                except requests.exceptions.RequestException:
                    print("❌ Failed to reach FastAPI")
        except Exception as e:
            print(f"Error processing event: {e}")

def read_serial():
    """Read from serial port in a separate thread"""
    arduino = serial.serial_for_url('rfc2217://localhost:4000', baudrate=9600, timeout=0.1)
    
    # Set a small timeout for reading
    arduino.timeout = 0.1
    
    while True:
        try:
            # Read a line with timeout
            line = arduino.readline().decode().strip()
            if line in ["entry", "exit"]:
                print(f"Detected: {line}")
                # Put the event in the queue
                event_queue.put(line)
        except serial.SerialException as e:
            print(f"Serial error: {e}")
            time.sleep(0.1)  # Small delay before retrying
        except Exception as e:
            print(f"Error reading serial: {e}")

def main():
    # Create a thread pool with 2 workers
    with ThreadPoolExecutor(max_workers=2) as executor:
        # Start the serial reader thread
        executor.submit(read_serial)
        # Start the event processor thread
        executor.submit(process_events)
        
        # Keep the main thread alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Shutting down...")

if __name__ == "__main__":
    main()
