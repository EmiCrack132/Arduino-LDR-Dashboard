// ============================================================
//  Divisor de voltaje - LDR + 100kΩ en A0
//  Vref = 5V interno del Arduino
//  Salida: Voltaje (V) y porcentaje por Serial
// ============================================================

const int PIN_LDR     = A0;       // <-- renombrado, evita conflicto
const float VREF      = 5.0;
const float R_FIJA    = 100000.0;
const int   MUESTRAS  = 10;
const int   DELAY_MS  = 500;

void setup() {
  Serial.begin(9600);
  analogReference(DEFAULT);
  
  Serial.println("========================================");
  Serial.println(" LDR - Divisor de Voltaje");
  Serial.println(" Circuito: 5V -- LDR -- A0 -- 100k -- GND");
  Serial.println("========================================");
  Serial.println("Voltaje (V) | Porcentaje (%) | Estado");
  Serial.println("----------------------------------------");
}

void loop() {
  long sumaADC = 0;
  for (int i = 0; i < MUESTRAS; i++) {
    sumaADC += analogRead(PIN_LDR);  // <-- actualizado
    delay(5);
  }
  int valorADC = sumaADC / MUESTRAS;

  float voltaje    = (valorADC / 1023.0) * VREF;
  float porcentaje = (voltaje / VREF) * 100.0;

  float R_LDR = 0.0;
  if (voltaje > 0.01) {
    R_LDR = R_FIJA * (VREF - voltaje) / voltaje;
  }

  String estado;
  if (porcentaje > 80.0)       estado = "Muy brillante";
  else if (porcentaje > 60.0)  estado = "Iluminado";
  else if (porcentaje > 40.0)  estado = "Penumbra";
  else if (porcentaje > 20.0)  estado = "Oscuro";
  else                          estado = "Muy oscuro";

  Serial.print(voltaje, 3);
  Serial.print(" V     | ");
  Serial.print(porcentaje, 1);
  Serial.print(" %          | ");
  Serial.print(estado);
  Serial.print("  (ADC: ");
  Serial.print(valorADC);
  Serial.print(", LDR ≈ ");
  if (R_LDR > 1000.0) {
    Serial.print(R_LDR / 1000.0, 1);
    Serial.println(" kΩ)");
  } else {
    Serial.print(R_LDR, 0);
    Serial.println(" Ω)");
  }

  delay(DELAY_MS);
}
