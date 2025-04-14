import time
import os
import json
from collections import deque
from datetime import datetime, timedelta

class RoomCounter:
    def __init__(self):
        self.data_dir = "data"
        self.data_file = os.path.join(self.data_dir, "counter_data.json")
        self._ensure_data_dir()
        self._load_data()

    def _ensure_data_dir(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def _load_data(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    self.count = data.get('count', 0)
                    self.history = deque(data.get('history', []), maxlen=288)
                    self.entry_exit_history = data.get('entry_exit_history', [])
                    self.last_update = data.get('last_update', time.time())
                    self.max_count = data.get('max_count', 0)
                    self.total_entries = data.get('total_entries', 0)
                    self.total_exits = data.get('total_exits', 0)
            except Exception as e:
                print(f"Error loading data: {e}")
                self._initialize_defaults()
        else:
            self._initialize_defaults()

    def _initialize_defaults(self):
        self.count = 0
        self.history = deque(maxlen=288)
        self.entry_exit_history = []
        self.last_update = time.time()
        self.max_count = 0
        self.total_entries = 0
        self.total_exits = 0
        self._save_data()

    def _save_data(self):
        data = {
            'count': self.count,
            'history': list(self.history),
            'entry_exit_history': self.entry_exit_history,
            'last_update': self.last_update,
            'max_count': self.max_count,
            'total_entries': self.total_entries,
            'total_exits': self.total_exits
        }
        try:
            with open(self.data_file, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            print(f"Error saving data: {e}")

    def increment(self):
        self.count += 1
        self.total_entries += 1
        self._update_history()
        self.entry_exit_history.append({
            'timestamp': datetime.now().isoformat(),
            'type': 'entry',
            'count': self.count
        })
        self._save_data()

    def decrement(self):
        if self.count > 0:
            self.count -= 1
            self.total_exits += 1
            self._update_history()
            self.entry_exit_history.append({
                'timestamp': datetime.now().isoformat(),
                'type': 'exit',
                'count': self.count
            })
            self._save_data()

    def _update_history(self):
        current_time = time.time()
        if current_time - self.last_update >= 20:  # 20 seconds
            self.history.append({
                'timestamp': datetime.now().isoformat(),
                'count': self.count
            })
            self.last_update = current_time
            self.max_count = max(self.max_count, self.count)
            self._save_data()

    def get_count(self):
        return self.count

    def get_analytics(self):
        # Calculate average count for the last 24 hours
        if self.history:
            avg_count = sum(entry['count'] for entry in self.history) / len(self.history)
        else:
            avg_count = 0

        # Get hourly distribution
        hourly_distribution = {}
        for entry in self.history:
            hour = datetime.fromisoformat(entry['timestamp']).hour
            if hour not in hourly_distribution:
                hourly_distribution[hour] = []
            hourly_distribution[hour].append(entry['count'])

        # Calculate average for each hour
        hourly_averages = {
            hour: sum(counts) / len(counts) if counts else 0
            for hour, counts in hourly_distribution.items()
        }

        return {
            'current_count': self.count,
            'max_count': self.max_count,
            'average_count': avg_count,
            'total_entries': self.total_entries,
            'total_exits': self.total_exits,
            'hourly_averages': hourly_averages,
            'history': list(self.history),
            'entry_exit_history': self.entry_exit_history[-100:]  # Last 100 events
        }
