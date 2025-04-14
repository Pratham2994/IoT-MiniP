import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  Box,
  Paper,
  Typography,
  Grid,
  useTheme,
} from '@mui/material';

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    return (
      <Paper 
        elevation={4} 
        sx={{
          p: 1.5,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(5px)',
          border: `1px solid ${theme.palette.primary.main}80`,
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color || theme.palette.text.primary, fontWeight: 'bold' }}>
            {`${entry.name || 'Value'}: ${entry.value}`}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

const AnalyticsDashboard = ({ analytics }) => {
  const theme = useTheme();

  // Process hourly data for the bar chart
  const hourlyData = Object.entries(analytics.hourly_averages || {})
    .map(([hour, average]) => ({ 
      hour: parseInt(hour), // Ensure hour is numeric for sorting
      average: Math.round(average) 
    }))
    .sort((a, b) => a.hour - b.hour) // Sort by hour
    .map(item => ({ ...item, hour: `${item.hour.toString().padStart(2, '0')}:00` })); // Format hour string

  // Process history data for the line chart
  const historyData = (analytics.history || []).map(entry => ({
    ...entry,
    timestamp: format(parseISO(entry.timestamp), 'HH:mm'),
  }));

  // Calculate average for ReferenceLine
  const avgHistory = historyData.length > 0
    ? historyData.reduce((sum, entry) => sum + entry.count, 0) / historyData.length
    : 0;

  // Process entry/exit events for the event chart
  const eventData = (analytics.entry_exit_history || []).map(event => ({
    ...event,
    timestamp: format(parseISO(event.timestamp), 'HH:mm:ss'),
    value: event.type === 'entry' ? 1 : -1,
    fill: event.type === 'entry' ? theme.palette.success.main : theme.palette.error.main || theme.palette.warning.main
  }));

  // Define gradients for AreaChart
  const gradientId = "colorCount";
  const width = '453.5px';
  const height = '425px';

  return (
    <Grid container spacing={3} justifyContent="center">
      {/* Occupancy History Area Chart */}
      <Grid item>
        <Paper sx={{ p: { xs: 2, md: 3 }, width: width, height: height }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
            Occupancy History (Last 24h)
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[800]} />
                <XAxis
                  dataKey="timestamp"
                  stroke={theme.palette.grey[500]}
                  tick={{ fill: theme.palette.grey[500], fontSize: '0.8rem' }}
                  interval="preserveStartEnd" // Show start and end ticks
                />
                <YAxis
                  stroke={theme.palette.grey[500]}
                  tick={{ fill: theme.palette.grey[500], fontSize: '0.8rem' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                  activeDot={{ r: 6, strokeWidth: 2, fill: theme.palette.background.paper }}
                />
                <ReferenceLine 
                  y={avgHistory} 
                  label={{ value: `Avg: ${avgHistory.toFixed(1)}`, position: 'insideTopRight', fill: theme.palette.grey[400], fontSize: '0.8rem' }}
                  stroke={theme.palette.grey[600]} 
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Hourly Average Bar Chart */}
      <Grid item>
        <Paper sx={{ p: { xs: 2, md: 3 }, width: width, height: height }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
            Hourly Average Occupancy
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[800]} vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke={theme.palette.grey[500]}
                  tick={{ fill: theme.palette.grey[500], fontSize: '0.8rem' }}
                  interval={hourlyData.length > 12 ? 1 : 0} // Adjust interval based on data
                />
                <YAxis
                  stroke={theme.palette.grey[500]}
                  tick={{ fill: theme.palette.grey[500], fontSize: '0.8rem' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                <Bar
                  dataKey="average"
                  name="Average Occupancy"
                  fill={theme.palette.secondary.main}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50} // Control max bar width
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Entry/Exit Events Bar Chart */}
      <Grid item>
        <Paper sx={{ p: { xs: 2, md: 3 }, width: width, height: height }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
            Recent Entry (+) / Exit (-) Events
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              {/* Using BarChart for distinct events */}
              <BarChart data={eventData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[800]} vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke={theme.palette.grey[500]}
                  tick={{ fill: theme.palette.grey[500], fontSize: '0.8rem' }}
                />
                <YAxis 
                  domain={[-1.2, 1.2]} // Ensure 0 is centered
                  allowDataOverflow={true}
                  stroke={theme.palette.grey[500]}
                  tick={{ fill: theme.palette.grey[500], fontSize: '0.8rem' }}
                  ticks={[-1, 0, 1]} // Specific ticks
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                <ReferenceLine y={0} stroke={theme.palette.grey[600]} />
                <Bar dataKey="value" name="Event Type" radius={[2, 2, 0, 0]}>
                  {/* Render bar with specific color based on entry/exit */}
                  {eventData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AnalyticsDashboard;
