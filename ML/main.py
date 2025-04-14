from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from counter import RoomCounter
import asyncio
import json

app = FastAPI()
counter = RoomCounter()

# Store active WebSocket connections
active_connections = set()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced broadcast function to send different message types
async def broadcast_message(message: dict):
    # Use a list comprehension to handle potential connection issues during iteration
    disconnected_websockets = []
    for connection in active_connections:
        try:
            await connection.send_text(json.dumps(message))
        except Exception as e:
            print(f"Error sending message to {connection}: {e}")
            disconnected_websockets.append(connection)
    # Remove connections that failed
    for ws in disconnected_websockets:
        active_connections.remove(ws)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    print(f"WebSocket connected: {websocket.client}")
    try:
        # Send initial count message
        initial_message = {"type": "count", "count": counter.get_count()}
        await websocket.send_text(json.dumps(initial_message))
        
        # Keep connection alive - listen for messages (though client doesn't send any)
        while True:
            # We don't expect messages here, but this keeps the connection open
            # and allows detecting disconnects properly.
            data = await websocket.receive_text() 
            print(f"Received unexpected message: {data} from {websocket.client}")
            # You could add logic here if the client ever needs to send data

    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {websocket.client}")
    except Exception as e:
        print(f"WebSocket error for {websocket.client}: {e}")
    finally:
        # Ensure removal on any exit
        active_connections.discard(websocket)
        print(f"WebSocket connection closed for {websocket.client}. Remaining: {len(active_connections)}")

@app.get("/update")
async def update(event: str):
    current_count = counter.get_count()
    message_to_broadcast = None

    if event == "entry":
        counter.increment()
        message_to_broadcast = {"type": "count", "count": counter.get_count()}
    elif event == "exit":
        if current_count > 0:
            counter.decrement()
            message_to_broadcast = {"type": "count", "count": counter.get_count()}
        else:
            # Count is already zero, send a warning instead of changing count
            print("Exit detected when count is zero.")
            message_to_broadcast = {"type": "warning", "message": "Exit detected, but room is already empty."}
    
    # Broadcast the appropriate message if one was generatedi
    if message_to_broadcast:
        await broadcast_message(message_to_broadcast)
        
    return {"status": "ok", "count": counter.get_count()}

@app.get("/count")
async def get_count():
    return {"count": counter.get_count()}

@app.get("/analytics")
async def get_analytics():
    return counter.get_analytics()
