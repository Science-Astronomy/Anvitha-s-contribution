# FlightTracker - Carbon Impact Monitor 🌍✈️

A web application that helps track flight carbon emissions and visualize environmental impact. This project demonstrates how travel choices affect the environment and encourages awareness about carbon footprints.

## Features

- **Track Flights**: Add flight details including origin, destination, date, airline, and cabin class
- **Carbon Calculator**: Automatically calculates CO2 emissions based on distance and flight parameters
- **Environmental Impact**: Shows equivalent trees needed to offset emissions
- **Monthly Charts**: Visualizes carbon emissions over time
- **Airport Database**: Supports 28,000+ airports worldwide (IATA/ICAO codes)
- **User Accounts**: Save your flights with Google sign-in (Firebase Authentication)
- **Share Impact**: Share your carbon impact summary on social media

## How It Works

The app calculates carbon emissions using:
- **Distance**: Calculated between airports using the Haversine formula
- **Base emission factor**: 0.18 kg CO2 per kilometer
- **Cabin multipliers**: Business (2x), First Class (3x)
- **Aircraft type**: Wide-body planes emit 5% more

## Firebase Setup (Optional - for saving flights)

### Prerequisites
- Node.js installed on your computer
- A Google account
- A Firebase project (free tier works!)

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase in your project folder
```bash
firebase init
```
Select:
- Hosting (using spacebar to select)
- Use an existing project or create a new one
- Public directory: `.` (current directory)
- Single-page app: Yes
- Don't overwrite index.html

### Step 4: Deploy to Firebase Hosting
```bash
firebase deploy
```

Your app will be live at: `https://your-project.web.app`

## Running Locally

### Option 1: Direct File Opening
Simply open `index.html` in your browser. Note: Google sign-in won't work with file:// URLs.

### Option 2: Local Server (for full functionality)

**Using Node.js (recommended):**
```bash
# Using npx (no installation needed)
npx http-server -p 8000

# Or install globally first
npm install -g http-server
http-server -p 8000

# Or use live-server for auto-reload
npx live-server --port=8000
```

**Using Python:**
```bash
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

### Option 3: VS Code Live Server
If using VS Code, install the "Live Server" extension and right-click on `index.html` → "Open with Live Server"

## Project Structure

```
flight-tracker/
├── index.html          # Main application file
├── firebase.json       # Firebase hosting configuration
├── .firebaserc        # Firebase project settings
└── README.md          # This file
```

## Technologies Used

- **HTML5/CSS3**: Modern web structure and styling
- **JavaScript**: Application logic and calculations
- **Chart.js**: Data visualization library
- **Firebase**: Authentication and database (Firestore)
- **Google Fonts**: Typography (Inter font)
- **Airport Database**: Open-source airport data from GitHub

## Environmental Impact Calculations

- **Trees**: 1 tree absorbs ~22 kg CO2 per year
- **Car equivalent**: Average car emits 0.12 kg CO2/km
- **Home energy**: Average home uses 300 kg CO2/month

## Educational Value

This project teaches:
- Environmental awareness and carbon footprint concepts
- Real-world application of mathematics (distance calculations)
- Data visualization and interpretation
- Web development fundamentals
- Database integration and user authentication
- The importance of sustainable travel choices

## Future Improvements

Ideas to expand the project:
- Add carbon offset purchase options
- Include train/car travel comparisons
- Add travel recommendations for lower emissions
- Create classroom/group competitions for lowest emissions
- Export data to spreadsheets for analysis
- Add more detailed aircraft types and emission factors

## Fun Games

The app includes links to two educational games:
- **Zoomy**: An interactive game about speed and motion
- **Choices Choices**: A decision-making game about environmental choices

## Resources

- [ICAO Carbon Emissions Calculator](https://www.icao.int/environmental-protection/CarbonOffset/Pages/default.aspx)
- [EPA Greenhouse Gas Equivalencies](https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator)
- [Firebase Documentation](https://firebase.google.com/docs)

## License

This is a school project created for educational purposes.

---

*Remember: Every flight counts! Consider the environment when planning your travels.* 🌱