import SwiftUI

struct HistoryView: View {
    @Environment(AppState.self) private var appState

    @State private var displayedMonth: Date = {
        let cal = Calendar.current
        let comps = cal.dateComponents([.year, .month], from: Date())
        return cal.date(from: comps) ?? Date()
    }()
    @State private var selectedDate: Date? = nil
    @State private var workoutToDelete: CompletedWorkout? = nil
    @State private var showDeleteAlert = false

    private var calendar: Calendar { Calendar.current }

    var body: some View {
        NavigationStack {
            List {
                // Calendar section
                Section {
                    calendarView
                }

                // Workout list
                let filtered = filteredWorkouts
                if filtered.isEmpty {
                    emptyStateRow
                } else {
                    ForEach(filtered) { workout in
                        workoutRow(workout)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    workoutToDelete = workout
                                    showDeleteAlert = true
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("History")
            .alert("Delete Workout?", isPresented: $showDeleteAlert, presenting: workoutToDelete) { workout in
                Button("Delete", role: .destructive) {
                    deleteWorkout(workout)
                }
                Button("Cancel", role: .cancel) {}
            } message: { workout in
                Text("Delete the \(workout.dayLabel) workout on \(workout.startTime.formatted(date: .abbreviated, time: .omitted))?")
            }
        }
    }

    // MARK: - Calendar view

    private var calendarView: some View {
        VStack(spacing: 12) {
            // Month navigation header
            HStack {
                Button {
                    navigateMonth(by: -1)
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.headline)
                        .foregroundStyle(appState.accentColor)
                }
                .buttonStyle(.plain)

                Spacer()

                Text(displayedMonth.formatted(.dateTime.month(.wide).year()))
                    .font(.headline)

                Spacer()

                Button {
                    navigateMonth(by: 1)
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.headline)
                        .foregroundStyle(appState.accentColor)
                }
                .buttonStyle(.plain)
            }

            // Day-of-week headers
            let daySymbols = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
            HStack {
                ForEach(daySymbols, id: \.self) { sym in
                    Text(sym)
                        .font(.caption2.bold())
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            // Day grid
            let days = calendarDays
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 6) {
                ForEach(days.indices, id: \.self) { idx in
                    let day = days[idx]
                    if let date = day {
                        dayCell(date: date)
                    } else {
                        Color.clear
                            .frame(height: 36)
                    }
                }
            }
        }
        .padding(.vertical, 8)
    }

    @ViewBuilder
    private func dayCell(date: Date) -> some View {
        let isToday = calendar.isDateInToday(date)
        let isSelected = selectedDate.map { calendar.isDate($0, inSameDayAs: date) } ?? false
        let hasWorkout = workoutDates.contains { calendar.isDate($0, inSameDayAs: date) }
        let dayNum = calendar.component(.day, from: date)

        Button {
            if isSelected {
                selectedDate = nil
            } else {
                selectedDate = date
            }
        } label: {
            ZStack {
                Circle()
                    .fill(isSelected ? appState.accentColor : (isToday ? appState.accentColor.opacity(0.15) : Color.clear))
                    .frame(width: 34, height: 34)

                VStack(spacing: 2) {
                    Text("\(dayNum)")
                        .font(.subheadline)
                        .foregroundStyle(isSelected ? .white : (isToday ? appState.accentColor : .primary))

                    if hasWorkout {
                        Circle()
                            .fill(isSelected ? Color.white.opacity(0.8) : appState.accentColor)
                            .frame(width: 5, height: 5)
                    } else {
                        Color.clear.frame(width: 5, height: 5)
                    }
                }
            }
            .frame(height: 36)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Workout row

    @ViewBuilder
    private func workoutRow(_ workout: CompletedWorkout) -> some View {
        DisclosureGroup {
            ForEach(workout.exercises) { exercise in
                HStack {
                    Text(exercise.name)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                    Spacer()
                    let workingSets = exercise.sets.filter { !$0.warmup }.count
                    Text("\(exercise.sets.count) set\(exercise.sets.count == 1 ? "" : "s")\(workingSets < exercise.sets.count ? " (\(workingSets) working)" : "")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 2)
            }
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(workout.dayLabel)
                        .font(.headline)
                    Spacer()
                    Text(formatDuration(workout.duration))
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(appState.accentColor)
                }
                HStack(spacing: 12) {
                    Label(workout.startTime.formatted(date: .abbreviated, time: .shortened), systemImage: "calendar")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Label("\(Int(workout.calories)) kcal", systemImage: "flame.fill")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
            }
            .padding(.vertical, 4)
        }
    }

    // MARK: - Empty state row

    private var emptyStateRow: some View {
        HStack {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "calendar.badge.minus")
                    .font(.title2)
                    .foregroundStyle(.secondary)
                Text(selectedDate == nil ? "No workouts recorded yet" : "No workouts on this date")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding()
            Spacer()
        }
    }

    // MARK: - Helpers

    private var filteredWorkouts: [CompletedWorkout] {
        let sorted = appState.workoutHistory.sorted { $0.startTime > $1.startTime }
        guard let date = selectedDate else { return sorted }
        return sorted.filter { calendar.isDate($0.startTime, inSameDayAs: date) }
    }

    private var workoutDates: [Date] {
        appState.workoutHistory.map { $0.startTime }
    }

    private var calendarDays: [Date?] {
        let components = calendar.dateComponents([.year, .month], from: displayedMonth)
        guard let firstOfMonth = calendar.date(from: components) else { return [] }
        let range = calendar.range(of: .day, in: .month, for: firstOfMonth) ?? 1..<2
        let weekdayOffset = calendar.component(.weekday, from: firstOfMonth) - 1

        var days: [Date?] = Array(repeating: nil, count: weekdayOffset)
        for day in range {
            var comps = components
            comps.day = day
            days.append(calendar.date(from: comps))
        }
        // Pad to complete last row
        while days.count % 7 != 0 { days.append(nil) }
        return days
    }

    private func navigateMonth(by value: Int) {
        if let newDate = calendar.date(byAdding: .month, value: value, to: displayedMonth) {
            displayedMonth = newDate
            selectedDate = nil
        }
    }

    private func deleteWorkout(_ workout: CompletedWorkout) {
        appState.workoutHistory.removeAll { $0.id == workout.id }
        appState.save()
    }

    private func formatDuration(_ interval: TimeInterval) -> String {
        let totalSeconds = Int(interval)
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }
}
