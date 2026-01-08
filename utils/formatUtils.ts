import { SchoolTransport } from '@/types/transport';

// Helper function to convert USD to ZAR (Rands)
export const formatToRands = (usdAmount: number): string => {
  const exchangeRate = 18.5; // Approximate USD to ZAR exchange rate
  const zarAmount = usdAmount * exchangeRate;
  return `R${zarAmount.toFixed(0)}`;
};

// Calculate availability
export const calculateAvailability = (transport: SchoolTransport) => {
  const availableSeats = Math.max(0, transport.capacity - transport.current_riders);
  const isFull = availableSeats <= 0;
  return { availableSeats, isFull };
};

// Format driver name
export const formatDriverName = (transport: SchoolTransport): string => {
  return `${transport.driver.profiles.first_name} ${transport.driver.profiles.last_name}`;
};