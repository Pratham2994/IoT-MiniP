import time
from collections import deque
from datetime import datetime, timedelta

class RoomCounter:
    def __init__(self):
        self.count = 0
        # Store last 24 hours of data in 5-minute intervals
        self.history = deque(maxlen=288)  # 24 hours * 12 intervals per hour
        self.entry_exit_history = []
        self.last_update = time.time()
        self.max_count = 0
        self.total_entries = 0
        self.total_exits = 0

    def increment(self):
        self.count += 1
        self.total_entries += 1
        self._update_history()
        self.entry_exit_history.append({
            'timestamp': datetime.now().isoformat(),
            'type': 'entry',
            'count': self.count
        })

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

    def _update_history(self):
        current_time = time.time()
        if current_time - self.last_update >= 20:  # 20 seconds
            self.history.append({
                'timestamp': datetime.now().isoformat(),
                'count': self.count
            })
            self.last_update = current_time
            self.max_count = max(self.max_count, self.count)

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
