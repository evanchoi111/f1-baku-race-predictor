export type DriverPrediction = {
  driverId: string;
  driver: string;
  team: string;
  winScore: number;
};

export const bakuSnapshot = {
  race: "Azerbaijan Grand Prix",
  circuit: "Baku City Circuit",
  year: 2026,
  raceDate: "2026-09-26",
  generatedAt: "2026-09-18T13:52:04.469908+00:00",
  dataThrough: "2026-09-13",
  modelType: "XGBClassifier",
  xgboostVersion: "3.4.1",
  mode: "Pre-qualifying",
  entrySource: "Most recent completed race; confirm substitutions",
  scoreNote: "Normalized model score; not a calibrated win probability",
  modelPick: "Andrea Kimi Antonelli",
  evaluation: {
    testYear: 2025,
    testRaces: 24,
    winnerAccuracy: 0.3333333333333333,
    recentFormBaselineAccuracy: 0.2916666666666667,
  },
  predictions: [
    { driverId: "antonelli", driver: "Andrea Kimi Antonelli", team: "Mercedes", winScore: 0.5355712175369263 },
    { driverId: "max_verstappen", driver: "Max Verstappen", team: "Red Bull", winScore: 0.1323598027229309 },
    { driverId: "norris", driver: "Lando Norris", team: "McLaren", winScore: 0.10878519713878632 },
    { driverId: "russell", driver: "George Russell", team: "Mercedes", winScore: 0.07771466672420502 },
    { driverId: "leclerc", driver: "Charles Leclerc", team: "Ferrari", winScore: 0.05470044165849686 },
    { driverId: "hamilton", driver: "Lewis Hamilton", team: "Ferrari", winScore: 0.03349829465150833 },
    { driverId: "piastri", driver: "Oscar Piastri", team: "McLaren", winScore: 0.019857121631503105 },
    { driverId: "lawson", driver: "Liam Lawson", team: "Red Bull", winScore: 0.010742941871285439 },
    { driverId: "hulkenberg", driver: "Nico Hülkenberg", team: "Audi", winScore: 0.002902835374698043 },
    { driverId: "colapinto", driver: "Franco Colapinto", team: "Alpine F1 Team", winScore: 0.002902835374698043 },
    { driverId: "gasly", driver: "Pierre Gasly", team: "Alpine F1 Team", winScore: 0.002902835374698043 },
    { driverId: "ocon", driver: "Esteban Ocon", team: "Haas F1 Team", winScore: 0.0023556570522487164 },
    { driverId: "stroll", driver: "Lance Stroll", team: "Aston Martin", winScore: 0.0023556570522487164 },
    { driverId: "bottas", driver: "Valtteri Bottas", team: "Cadillac F1 Team", winScore: 0.0019135340116918087 },
    { driverId: "tsunoda", driver: "Yuki Tsunoda", team: "RB F1 Team", winScore: 0.0018413640791550279 },
    { driverId: "bortoleto", driver: "Gabriel Bortoleto", team: "Audi", winScore: 0.0015582650667056441 },
    { driverId: "bearman", driver: "Oliver Bearman", team: "Haas F1 Team", winScore: 0.0015582650667056441 },
    { driverId: "albon", driver: "Alexander Albon", team: "Williams", winScore: 0.0015157269081100821 },
    { driverId: "sainz", driver: "Carlos Sainz", team: "Williams", winScore: 0.001308242790400982 },
    { driverId: "alonso", driver: "Fernando Alonso", team: "Aston Martin", winScore: 0.0012278404319658875 },
    { driverId: "perez", driver: "Sergio Pérez", team: "Cadillac F1 Team", winScore: 0.0012278404319658875 },
    { driverId: "arvid_lindblad", driver: "Arvid Lindblad", team: "RB F1 Team", winScore: 0.0011993276420980692 },
  ] satisfies DriverPrediction[],
} as const;