# Telemetry Dashboard — Spring Boot Backend

Backend for the Windows desktop telemetry assessment. It exposes `GET /api/dashboard`, generates simulated telemetry once per second, and returns up to 100 history samples for velocity, pressure, and temperature.

## Stack
- Java 17
- Spring Boot 3.5
- Spring Web / REST
- Spring Data JPA
- H2 file database by default; optional MySQL profile

> Assessment stack note: the brief says **Angular + Electron + TypeScript are mandatory**. React can be used only if the assessor approves a deviation. This ZIP contains the Java backend only; it does not replace the required Angular/Electron desktop UI.

## 1. Prerequisites
Install JDK 17 or newer and Maven 3.9+. Check:
```bash
java -version
mvn -version
```

## 2. Run quickly with H2 (recommended for the assessment)
From this folder:
```bash
mvn spring-boot:run
```
The API starts at `http://localhost:8080/api/dashboard`. H2 uses a local file at `./data/telemetrydb`, so data persists between restarts. The first sample is inserted at startup, then a new sample is generated every second.

Test with browser or curl:
```bash
curl http://localhost:8080/api/dashboard
```

H2 console (optional): `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/telemetrydb`
- User Name: `sa`
- Password: leave blank

## 3. Configure MySQL instead
### Step A — Install/start MySQL
Install MySQL Server 8.x and start the MySQL service. Create a database and table using MySQL Workbench or CLI:
```bash
mysql -u root -p < database/schema-mysql.sql
```
If using a non-root account, grant it permissions on `telemetry_db`.

### Step B — Set credentials
**Windows PowerShell:**
```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/telemetry_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password"
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=mysql"
```
Alternatively, set `DB_USERNAME` and `DB_PASSWORD` in your IDE run configuration and add program argument `--spring.profiles.active=mysql`.

**macOS/Linux:**
```bash
export DB_URL='jdbc:mysql://localhost:3306/telemetry_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
export DB_USERNAME='root'
export DB_PASSWORD='your_mysql_password'
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=mysql
```
Never commit real database passwords. The MySQL profile uses `spring.jpa.hibernate.ddl-auto=update`; the supplied SQL schema is also available if you prefer creating the table manually.

## 4. API response
`GET http://localhost:8080/api/dashboard`

Example shape:
```json
{
  "timestamp": "2026-10-21T15:10:05Z",
  "velocity": {
    "value": 185.4,
    "unit": "cm/s",
    "history": [{"time":"15:10:01","value":180.2}]
  },
  "pressure": {
    "value": 1012.0,
    "unit": "mbar",
    "history": [{"time":"15:10:01","value":1008.0}]
  },
  "temperature": {
    "value": 36.8,
    "unit": "°C",
    "history": [{"time":"15:10:01","value":36.2}]
  }
}
```
The sample values above are illustrative; actual values change every second. History is chronological and limited to the latest 100 samples. `timestamp` is an ISO-8601 UTC timestamp.

## 5. Simulation and design
- Starting values: velocity 185.4 cm/s, pressure 1012 mbar, temperature 36.8 °C.
- Every second, each value is randomly moved up or down by up to approximately 10% of its current magnitude.
- Every fifth cycle, values instead move 35% of the remaining distance toward their starting values.
- The API reads stored samples and returns the latest 100. A bounded database retention pass keeps only the latest 100 samples.
- Units are returned in canonical backend units. Convert units in the Angular UI without another API request, as required.
- `@CrossOrigin(origins = "*")` allows a local Angular/Electron dev server to call the API. Tighten this for production.
- No real embedded controller is connected; this is a simulation for the assignment.

## 6. Connect from Angular
Call `GET http://localhost:8080/api/dashboard` using Angular `HttpClient`, then poll every 1 second (for example with RxJS `timer(0, 1000)` and `switchMap`). Do unit conversion client-side and do not request again when the user changes a unit.

## 7. Troubleshooting
- **Port 8080 already used:** change `server.port` in `application.properties`.
- **Cannot connect to MySQL:** verify MySQL is running, credentials are correct, and port 3306 is open.
- **Access denied:** grant the configured MySQL user privileges to `telemetry_db`.
- **Java version issue:** use JDK 17+ and ensure `JAVA_HOME` points to it.
