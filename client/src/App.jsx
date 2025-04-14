import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Wifi, WifiOff, BarChart2, Users, Activity, Clock, TrendingUp } from 'lucide-react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  useMediaQuery
} from '@mui/material';
import AnalyticsDashboard from './components/AnalyticsDashboard';

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c4dff',
    },
    secondary: {
      main: '#ff4081',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h4: {
        fontWeight: 600,
    },
    body1: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '12px',
        },
      },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(30, 30, 30, 0.7)', 
                backdropFilter: 'blur(10px)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }
        }
    },
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.85rem',
            },
            arrow: {
                color: 'rgba(0, 0, 0, 0.85)',
            }
        }
    }
  },
});

// Component for individual stat cards with hover effect
const StatCard = ({ icon: Icon, title, value, color, unit = '' }) => (
    <Grid item xs={6} sm={6} md={3}> 
      <motion.div
        whileHover={{ scale: 1.03, y: -5 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{ height: '100%' }}
      >
        <Card sx={{ borderColor: `${color}40` }}>
          <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
            <Icon style={{ color: color, marginBottom: theme.spacing(1), width: 32, height: 32 }} />
            <Typography variant="body1" sx={{ mb: 0.5 }}>{title}</Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
                {value}
                {unit && <span style={{ fontSize: '0.8em', marginLeft: '2px' }}>{unit}</span>}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Grid>
);

function App() {
  const [count, setCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const initialConnectAttempted = useRef(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Ref to track connection state without causing dependency loops
  const isConnectedRef = useRef(isConnected);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/analytics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    // Prevent multiple concurrent connection attempts
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      console.log("WebSocket already open or connecting.");
      return;
    }

    // Clear any existing reconnect timeout before attempting connection
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    console.log("Attempting WebSocket connection...");
    // Use ref to check current state for loading indicator logic
    if (!initialConnectAttempted.current || !isConnectedRef.current) {
      setIsLoading(true);
    }
    initialConnectAttempted.current = true;

    ws.current = new WebSocket("ws://localhost:8000/ws");
    ws.current.unmounting = false;

    ws.current.onopen = () => {
      console.log("WebSocket Connected");
      if (!isConnectedRef.current) {
        toast.success("Connected to server", {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
            theme: "colored",
        });
      }
      setIsConnected(true); 
      setIsLoading(false); 
      fetchAnalytics(); 
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "count" && typeof data.count === 'number') {
          setCount(data.count); 
          fetchAnalytics();
        } else if (data.type === "warning" && typeof data.message === 'string') {
          toast.warn(data.message, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: true,
            theme: "colored",
          });
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setIsLoading(false);
    };

    ws.current.onclose = (event) => {
      console.log(`WebSocket Disconnected: Code=${event.code}, Reason=${event.reason}`);
      const wasConnected = isConnectedRef.current; 
      const isCleanClose = event.wasClean || ws.current?.unmounting; 

      setIsConnected(false); 
      setIsLoading(false); 

      if (wasConnected && !isCleanClose) {
        toast.warning("Disconnected. Attempting to reconnect...", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          theme: "colored",
        });
      }
      
      if (!isCleanClose) {
        console.log("Scheduling reconnect...");
        if (reconnectTimeout.current) {
             clearTimeout(reconnectTimeout.current);
        }
        reconnectTimeout.current = setTimeout(() => {
             if (ws.current && !ws.current.unmounting) {
                 connectWebSocket(); 
             } else {
                 console.log("Reconnect cancelled, component unmounted or WebSocket manually closed.");
             }
        }, 5000); 
      } else {
         if (reconnectTimeout.current) {
              clearTimeout(reconnectTimeout.current);
              reconnectTimeout.current = null;
         }
      }
    };
  }, [fetchAnalytics]);

  useEffect(() => {
    connectWebSocket(); 
    const analyticsInterval = setInterval(fetchAnalytics, 60000); 

    return () => {
      console.log("Cleaning up WebSocket connection.");
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        console.log(`Closing WebSocket (readyState: ${ws.current.readyState})`);
        ws.current.unmounting = true; 
        ws.current.close(1000, "Component unmounting"); 
      }
      ws.current = null; 
      clearInterval(analyticsInterval); 
    };
  }, [connectWebSocket, fetchAnalytics]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.primary.dark || '#2d1b69'} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: { xs: 1, sm: 2, md: 3 },
          overflow: 'auto',
          position: 'relative',
        }}
        width={'100%'}
      >
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              opacity: 0,
              zIndex: 0,
              width: i === 0 ? '400px' : '500px',
              height: i === 0 ? '400px' : '500px',
              borderRadius: '50%',
              background: i === 0 ? 'rgba(124, 77, 255, 0.05)' : 'rgba(255, 64, 129, 0.05)',
              filter: 'blur(100px)',
              top: i === 0 ? '10%' : '60%',
              left: i === 0 ? '20%' : '70%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              opacity: [0, 0.15, 0],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
          />
        ))}

        <ToastContainer limit={3} />
        
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 12, sm: 16 },
            right: { xs: 12, sm: 16 },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 10, 
          }}
        >
          {isLoading && !isConnected ? (
            <CircularProgress size={24} sx={{ color: '#bdbdbd' }} />
          ) : isConnected ? (
            <Wifi style={{ color: theme.palette.success.main, width: 24, height: 24 }} />
          ) : (
            <WifiOff style={{ color: theme.palette.error.main || '#f44336', width: 24, height: 24 }} />
          )}
        </Box>

        <Container maxWidth="xl" sx={{ mt: { xs: 6, sm: 8 }, zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h1"
              align="center"
              sx={{
                mb: { xs: 3, md: 5 },
                color: 'white',
                textShadow: '0 0 15px rgba(124, 77, 255, 0.6)',
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.5rem' },
              }}
            >
              Room Occupancy Dashboard
            </Typography>
            
            <Grid container spacing={isMobile ? 2 : 3} alignItems="stretch">
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={12} 
                  sx={{
                    p: { xs: 2, sm: 3, md: 4 }, 
                    background: 'rgba(30, 30, 30, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.primary.main}60`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: { xs: '180px', md: '200px' },
                  }}
                >
                  {isLoading && !isConnected ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress color="primary" />
                    </Box>
                  ) : (
                    <motion.div
                      key={count} 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{ textAlign: 'center' }} 
                    >
                      <Typography
                        variant="h2" 
                        sx={{
                          color: 'white',
                          mb: 1, 
                          fontSize: { xs: '4rem', sm: '5rem', md: '6rem' }, 
                          fontWeight: 700, 
                          lineHeight: 1.1, 
                        }}
                      >
                        {count}
                      </Typography>
                      <Typography
                        variant="h6" 
                        sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 400 }}
                      >
                        {count === 1 ? 'person inside' : 'people inside'}
                      </Typography>
                    </motion.div>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={8}>
                <Grid container spacing={isMobile ? 2 : 3} sx={{ height: '100%' }}>
                  {analytics ? (
                    <>
                      <StatCard 
                        icon={TrendingUp} 
                        title="Peak Today" 
                        value={analytics.max_count} 
                        color={theme.palette.primary.main}
                      />
                      <StatCard 
                        icon={Activity} 
                        title="Avg (24h)" 
                        value={analytics.average_count.toFixed(1)} 
                        color={theme.palette.secondary.main}
                      />
                      <StatCard 
                        icon={Users} 
                        title="Entries (24h)" 
                        value={analytics.total_entries} 
                        color={theme.palette.success.main}
                      />
                      <StatCard 
                        icon={Clock} 
                        title="Exits (24h)" 
                        value={analytics.total_exits} 
                        color={theme.palette.warning.main}
                      />
                    </>
                  ) : (
                     [...Array(4)].map((_, index) => (
                       <Grid item xs={6} sm={6} md={3} key={index}>
                         <Card sx={{ minHeight: '130px' }}>
                           <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                             <CircularProgress size={20} color="secondary" />
                           </CardContent>
                         </Card>
                       </Grid>
                     ))
                  )}
                </Grid>
              </Grid>

              <Grid item xs={12} width={'100%'}>
                {analytics ? (
                  <AnalyticsDashboard analytics={analytics} />
                 ) : (
                   <Paper sx={{ p: 3, background: 'rgba(30, 30, 30, 0.8)', backdropFilter: 'blur(10px)', border: `1px solid ${theme.palette.primary.main}60`, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                     <CircularProgress color="primary" />
                   </Paper>
                 )}
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
