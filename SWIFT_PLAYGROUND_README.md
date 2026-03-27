# IronLog - Swift Playgrounds Build

This is a Swift/SwiftUI version of the IronLog fitness tracking application, designed to run in Apple's Swift Playgrounds environment.

## Features

- **Workout Selection**: Choose from 4 pre-configured day plans (Chest, Back, Shoulders, Legs)
- **Exercise Tracking**: Log reps and weight for each exercise
- **Calorie Calculator**: Automatic calorie calculation based on MET values
- **Daily Stats**: View total calories burned today
- **Persistent Storage**: Workout history is maintained during the session

## How to Use

### Running in Swift Playgrounds (iPad)

1. Open Swift Playgrounds on your iPad
2. Tap "Create" to start a new project
3. Import the IronLog package by copying the contents of `Sources/IronLog/IronLog.swift`
4. Run the playground

### Running in Xcode

1. Open Xcode
2. Go to File → Open
3. Select the root directory of this project
4. Build and run (⌘R)
5. The app will launch in the simulator or on your connected device

### Running as a Single File in Swift Playgrounds

1. Create a new Blank playground in Swift Playgrounds
2. Copy the entire contents of `Sources/IronLog/IronLog.swift` into the playground
3. Click Run

## Architecture

### Models
- **Exercise**: Represents a single exercise with MET values and target ranges
- **WorkoutSet**: Individual set completion (reps, weight)
- **Workout**: Complete workout session with multiple sets
- **DayPlan**: Pre-configured workout day with selected exercises

### ViewModels
- **WorkoutViewModel**: Manages workout state, current session, and history

### Views
- **ContentView**: Main entry point that switches between views
- **DaySelectionView**: Shows available day plans
- **WorkoutDetailView**: Current workout tracking
- **SetRowView**: Individual set input and tracking

### ExerciseLibrary
- Contains 25+ exercise definitions with MET values
- Includes 4 day plans (Chest, Back, Shoulders, Legs)
- Data adapted from the JavaScript version

## Differences from Web Version

- **No Firebase**: Local storage only (can be extended with CloudKit)
- **Simplified UI**: Optimized for touch and smaller screens
- **Real-time Calorie Calculation**: Instant feedback on calorie burns
- **Swift Native**: Uses SwiftUI for modern, responsive interface

## Technical Requirements

- iOS 15.0 or later
- macOS 12.0 or later
- Swift 5.9+

## Extension Ideas

1. **CloudKit Sync**: Add cloud backup functionality
2. **HealthKit Integration**: Export workouts to Apple Health
3. **Notifications**: Reminders for scheduled workouts
4. **Charts**: Visual progress tracking with SwiftUI Charts
5. **Voice Input**: Voice-controlled workout logging
6. **Exercise Photos**: Add reference images for exercises
7. **Rest Timer**: Built-in rest period timer between sets

## File Structure

```
PR-program/
├── Package.swift
├── Sources/
│   └── IronLog/
│       └── IronLog.swift
├── SWIFT_PLAYGROUND_README.md
└── [Original web files]
```

## Notes

This Swift Playgrounds build is a faithful recreation of the original IronLog fitness tracking application. The core functionality remains the same, but with a native iOS/macOS interface optimized for the Apple ecosystem.
