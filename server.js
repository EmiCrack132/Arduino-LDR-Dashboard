const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ⚠️ Cambia "COM3" por tu puerto real (ver en Arduino IDE → Herramientas → Puerto)
const PORT_SERIAL = "COM3";
const BAUD_RATE = 9600;

// Historial en memoria (máximo 100 registros)
const historial = [];
const MAX_HISTORIAL = 100;

// Conectar al puerto Serial
const serial = new SerialPort({ path: PORT_SERIAL, baudRate: BAUD_RATE });
const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

serial.on("open", () => {
  console.log(`✅ Puerto Serial abierto: ${PORT_SERIAL}`);
});

serial.on("error", (err) => {
  console.error("❌ Error Serial:", err.message);
});

// Parsear cada línea que llega del Arduino
// Formato esperado: "2.847 V     | 56.9 %          | Iluminado  (ADC: 582, LDR ≈ 75.9 kΩ)"
parser.on("data", (linea) => {
  linea = linea.trim();
  console.log("Serial →", linea);

  // Extraer voltaje
  const matchV = linea.match(/([\d.]+)\s*V/);
  // Extraer porcentaje
  const matchP = linea.match(/([\d.]+)\s*%/);
  // Extraer estado (texto entre | y ()
  const matchE = linea.match(/\|\s*([A-Za-záéíóúÁÉÍÓÚ ]+)\s*\(/);
  // Extraer ADC
  const matchADC = linea.match(/ADC:\s*(\d+)/);
  // Extraer LDR en kΩ o Ω
  const matchLDR = linea.match(/LDR\s*[≈~]\s*([\d.]+)\s*(kΩ|Ω)/);

  if (!matchV || !matchP) return; // línea de encabezado, ignorar

  const dato = {
    timestamp: new Date().toLocaleTimeString("es-MX"),
    voltaje: parseFloat(matchV[1]),
    porcentaje: parseFloat(matchP[1]),
    estado: matchE ? matchE[1].trim() : "—",
    adc: matchADC ? parseInt(matchADC[1]) : null,
    ldr: matchLDR
      ? matchLDR[2] === "kΩ"
        ? parseFloat(matchLDR[1]) * 1000
        : parseFloat(matchLDR[1])
      : null,
  };

  // Guardar en historial
  historial.push(dato);
  if (historial.length > MAX_HISTORIAL) historial.shift();

  // Emitir a todos los clientes conectados
  io.emit("dato-ldr", dato);
});

// Cuando un cliente nuevo se conecta, enviarle el historial completo
io.on("connection", (socket) => {
  console.log("🌐 Cliente conectado:", socket.id);
  socket.emit("historial", historial);

  socket.on("disconnect", () => {
    console.log("🔌 Cliente desconectado:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("🚀 Servidor en http://localhost:3000");
});