import SwiftUI
import UniformTypeIdentifiers

// MARK: - Export share sheet helper

private struct ExportShareSheet: View {
    let exportURL: URL?

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "square.and.arrow.up.circle.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(.green)
                Text("IronLog Data Export")
                    .font(.title2.bold())
                if let url = exportURL {
                    ShareLink(
                        item: url,
                        subject: Text("IronLog Export"),
                        message: Text("My IronLog workout data")
                    ) {
                        Label("Share / Save File", systemImage: "square.and.arrow.up")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.accentColor)
                            .foregroundStyle(.white)
                            .cornerRadius(12)
                    }
                    .padding(.horizontal, 32)
                } else {
                    Text("No data to export.")
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .navigationTitle("Export")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - SettingsView

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @State private var showExportSheet = false
    @State private var showImportPicker = false
    @State private var showClearAlert = false
    @State private var exportData: Data? = nil

    var body: some View {
        NavigationStack {
            List {
                // SECTION 1: Profile & TDEE
                Section("Profile & TDEE") {
                    NavigationLink("Edit Profile") {
                        ProfileEditView()
                    }
                    LabeledContent("Estimated TDEE") {
                        Text("\(Int(appState.tdee)) kcal/day")
                            .foregroundStyle(appState.accentColor)
                    }
                }

                // SECTION 2: Workout Plans
                Section("Workout Plans") {
                    NavigationLink("Manage Plans") {
                        WorkoutPlansView()
                    }
                }

                // SECTION 3: Theme
                Section("Theme") {
                    ThemeSectionView()
                }

                // SECTION 4: Custom Exercises
                Section("Custom Exercises") {
                    NavigationLink("Manage Custom Exercises") {
                        CustomExercisesView()
                    }
                }

                // SECTION 5: Data
                Section("Data") {
                    Button {
                        exportData = buildExportJSON()
                        showExportSheet = true
                    } label: {
                        Label("Export Data", systemImage: "square.and.arrow.up")
                    }

                    Button {
                        showImportPicker = true
                    } label: {
                        Label("Import Data", systemImage: "square.and.arrow.down")
                    }

                    Button(role: .destructive) {
                        showClearAlert = true
                    } label: {
                        Label("Clear All Data", systemImage: "trash")
                            .foregroundStyle(.red)
                    }
                }

                // SECTION 6: Account
                Section("Account") {
                    NavigationLink("Account & Sync") {
                        AccountView()
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Settings")
            .sheet(isPresented: $showExportSheet) {
                ExportShareSheet(exportURL: exportData.flatMap { data in
                    String(data: data, encoding: .utf8).map { writeExportFile(string: $0) }
                })
                .presentationDetents([.medium])
            }
            .fileImporter(
                isPresented: $showImportPicker,
                allowedContentTypes: [UTType.json]
            ) { result in
                if case .success(let url) = result {
                    importData(from: url)
                }
            }
            .alert("Clear All Data?", isPresented: $showClearAlert) {
                Button("Clear All", role: .destructive) {
                    clearAllData()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently delete all your workout history, personal records, and custom data. This cannot be undone.")
            }
        }
    }

    // MARK: - Export / Import / Clear

    private func buildExportJSON() -> Data? {
        struct ExportPayload: Codable {
            var workoutHistory: [CompletedWorkout]
            var personalRecords: [String: PersonalRecord]
            var cardioPRs: [String: CardioPR]
            var customExercises: [Exercise]
            var customDays: [CustomDayDefinition]
            var dayPlans: [String: [String]]
            var profile: UserProfile
        }
        let payload = ExportPayload(
            workoutHistory: appState.workoutHistory,
            personalRecords: appState.personalRecords,
            cardioPRs: appState.cardioPRs,
            customExercises: appState.customExercises,
            customDays: appState.customDays,
            dayPlans: appState.dayPlans,
            profile: appState.profile
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try? encoder.encode(payload)
    }

    private func writeExportFile(string: String) -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("IronLog-Export-\(Date().formatted(.dateTime.year().month().day())).json")
        try? string.write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    private func importData(from url: URL) {
        guard url.startAccessingSecurityScopedResource() else { return }
        defer { url.stopAccessingSecurityScopedResource() }

        struct ExportPayload: Codable {
            var workoutHistory: [CompletedWorkout]
            var personalRecords: [String: PersonalRecord]
            var cardioPRs: [String: CardioPR]
            var customExercises: [Exercise]
            var customDays: [CustomDayDefinition]
            var dayPlans: [String: [String]]
            var profile: UserProfile
        }

        guard let data = try? Data(contentsOf: url) else { return }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard let payload = try? decoder.decode(ExportPayload.self, from: data) else { return }

        appState.workoutHistory = payload.workoutHistory
        appState.personalRecords = payload.personalRecords
        appState.cardioPRs = payload.cardioPRs
        appState.customExercises = payload.customExercises
        appState.customDays = payload.customDays
        appState.dayPlans = payload.dayPlans
        appState.profile = payload.profile
        appState.save()
    }

    private func clearAllData() {
        appState.workoutHistory = []
        appState.personalRecords = [:]
        appState.cardioPRs = [:]
        appState.customExercises = []
        appState.customDays = []
        appState.dayPlans = DataService.defaultDayPlans
        appState.profile = UserProfile()
        appState.exerciseOverrides = [:]
        appState.exerciseNameOverrides = [:]
        appState.save()
    }
}

// MARK: - Profile Edit View

struct ProfileEditView: View {
    var body: some View {
        ProfileEditForm()
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct ProfileEditForm: View {
    @Environment(AppState.self) private var appState

    @State private var age: String = ""
    @State private var weightLbs: String = ""
    @State private var heightFt: String = ""
    @State private var heightIn: String = ""
    @State private var bodyFatPct: String = ""
    @State private var neckIn: String = ""
    @State private var waistIn: String = ""
    @State private var hipIn: String = ""

    var body: some View {
        Form {
            Section("Basic Info") {
                HStack {
                    Text("Age")
                    Spacer()
                    TextField("years", text: $age)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                }
                Picker("Sex", selection: Binding(
                    get: { appState.profile.sex },
                    set: { appState.profile.sex = $0; appState.save() }
                )) {
                    ForEach(Sex.allCases, id: \.self) { sex in
                        Text(sex.displayName).tag(sex)
                    }
                }
                HStack {
                    Text("Weight")
                    Spacer()
                    TextField("lbs", text: $weightLbs)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                    Text("lbs")
                        .foregroundStyle(.secondary)
                }
                HStack {
                    Text("Height")
                    Spacer()
                    TextField("ft", text: $heightFt)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 40)
                    Text("ft")
                        .foregroundStyle(.secondary)
                    TextField("in", text: $heightIn)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 40)
                    Text("in")
                        .foregroundStyle(.secondary)
                }
            }

            Section("TDEE Formula") {
                Picker("Formula", selection: Binding(
                    get: { appState.profile.formula },
                    set: { appState.profile.formula = $0; appState.save() }
                )) {
                    ForEach(TDEEFormula.allCases, id: \.self) { formula in
                        Text(formula.displayName).tag(formula)
                    }
                }

                if appState.profile.formula.requiresBodyFat {
                    HStack {
                        Text("Body Fat %")
                        Spacer()
                        TextField("%", text: $bodyFatPct)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                        Text("%")
                            .foregroundStyle(.secondary)
                    }
                }

                if appState.profile.formula.requiresNavy {
                    HStack {
                        Text("Neck")
                        Spacer()
                        TextField("in", text: $neckIn)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                        Text("in")
                            .foregroundStyle(.secondary)
                    }
                    HStack {
                        Text("Waist")
                        Spacer()
                        TextField("in", text: $waistIn)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                        Text("in")
                            .foregroundStyle(.secondary)
                    }
                    if appState.profile.sex == .female {
                        HStack {
                            Text("Hip")
                            Spacer()
                            TextField("in", text: $hipIn)
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 80)
                            Text("in")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            Section("Estimated TDEE") {
                LabeledContent("Daily Calories") {
                    Text("\(Int(appState.tdee)) kcal/day")
                        .foregroundStyle(appState.accentColor)
                        .bold()
                }
            }
        }
        .onAppear { syncFromState() }
        .onChange(of: age) { _, v in if let i = Int(v) { appState.profile.age = i; appState.save() } }
        .onChange(of: weightLbs) { _, v in if let d = Double(v) { appState.profile.weightLbs = d; appState.save() } }
        .onChange(of: heightFt) { _, v in if let i = Int(v) { appState.profile.heightFt = i; appState.save() } }
        .onChange(of: heightIn) { _, v in if let i = Int(v) { appState.profile.heightIn = i; appState.save() } }
        .onChange(of: bodyFatPct) { _, v in if let d = Double(v) { appState.profile.bodyFatPct = d; appState.save() } }
        .onChange(of: neckIn) { _, v in if let d = Double(v) { appState.profile.neckIn = d; appState.save() } }
        .onChange(of: waistIn) { _, v in if let d = Double(v) { appState.profile.waistIn = d; appState.save() } }
        .onChange(of: hipIn) { _, v in if let d = Double(v) { appState.profile.hipIn = d; appState.save() } }
    }

    private func syncFromState() {
        let p = appState.profile
        age = p.age > 0 ? "\(p.age)" : ""
        weightLbs = p.weightLbs > 0 ? formatDecimal(p.weightLbs) : ""
        heightFt = "\(p.heightFt)"
        heightIn = "\(p.heightIn)"
        bodyFatPct = p.bodyFatPct > 0 ? formatDecimal(p.bodyFatPct) : ""
        neckIn = p.neckIn > 0 ? formatDecimal(p.neckIn) : ""
        waistIn = p.waistIn > 0 ? formatDecimal(p.waistIn) : ""
        hipIn = p.hipIn > 0 ? formatDecimal(p.hipIn) : ""
    }

    private func formatDecimal(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Workout Plans View

struct WorkoutPlansView: View {
    @Environment(AppState.self) private var appState
    @State private var showCreateCustomDay = false
    @State private var newDayName = ""
    @State private var newDayIcon = "⚡"

    var body: some View {
        List {
            // Built-in days
            Section("Built-in Days") {
                ForEach(DataService.dayDefinitions) { day in
                    NavigationLink(day.label) {
                        DayPlanEditView(dayId: day.id, dayLabel: day.label)
                    }
                }
            }

            // Custom days
            if !appState.customDays.isEmpty {
                Section("Custom Days") {
                    ForEach(appState.customDays) { custom in
                        NavigationLink(custom.name) {
                            DayPlanEditView(dayId: custom.id.uuidString, dayLabel: custom.name)
                        }
                    }
                    .onDelete { indexSet in
                        for idx in indexSet {
                            let day = appState.customDays[idx]
                            appState.dayPlans.removeValue(forKey: day.id.uuidString)
                        }
                        appState.customDays.remove(atOffsets: indexSet)
                        appState.save()
                    }
                }
            }

            Section {
                Button {
                    showCreateCustomDay = true
                } label: {
                    Label("Create Custom Day", systemImage: "plus.circle.fill")
                }
            }
        }
        .navigationTitle("Workout Plans")
        .alert("Create Custom Day", isPresented: $showCreateCustomDay) {
            TextField("Day name", text: $newDayName)
            TextField("Icon (emoji)", text: $newDayIcon)
            Button("Create") {
                if !newDayName.isEmpty {
                    let custom = CustomDayDefinition(name: newDayName, icon: newDayIcon.isEmpty ? "⚡" : newDayIcon)
                    appState.customDays.append(custom)
                    appState.dayPlans[custom.id.uuidString] = []
                    appState.save()
                    newDayName = ""
                    newDayIcon = "⚡"
                }
            }
            Button("Cancel", role: .cancel) {}
        }
    }
}

// MARK: - Day Plan Edit View

struct DayPlanEditView: View {
    @Environment(AppState.self) private var appState
    let dayId: String
    let dayLabel: String

    @State private var showExercisePicker = false

    private var exercises: [String] {
        appState.dayPlans[dayId] ?? []
    }

    var body: some View {
        List {
            ForEach(exercises, id: \.self) { name in
                Text(appState.displayName(for: name))
            }
            .onDelete { indexSet in
                var current = exercises
                current.remove(atOffsets: indexSet)
                appState.dayPlans[dayId] = current
                appState.save()
            }
            .onMove { from, to in
                var current = exercises
                current.move(fromOffsets: from, toOffset: to)
                appState.dayPlans[dayId] = current
                appState.save()
            }

            Button {
                showExercisePicker = true
            } label: {
                Label("Add Exercise", systemImage: "plus.circle")
                    .foregroundStyle(appState.accentColor)
            }
        }
        .navigationTitle(dayLabel)
        .toolbar { EditButton() }
        .sheet(isPresented: $showExercisePicker) {
            PlanExercisePickerView(dayId: dayId)
        }
    }
}

// MARK: - Plan Exercise Picker

struct PlanExercisePickerView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    let dayId: String

    @State private var searchText = ""
    @State private var selectedMuscle: String? = nil

    private let muscleFilters = ["All", "Chest", "Back", "Shoulders", "Quads",
                                  "Hamstrings", "Glutes", "Calves", "Biceps",
                                  "Triceps", "Core", "Cardio"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(muscleFilters, id: \.self) { muscle in
                            let isSelected = (muscle == "All" && selectedMuscle == nil) || selectedMuscle == muscle
                            Button {
                                selectedMuscle = muscle == "All" ? nil : muscle
                            } label: {
                                Text(muscle)
                                    .font(.subheadline)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Capsule().fill(isSelected ? appState.accentColor : Color(.secondarySystemBackground)))
                                    .foregroundStyle(isSelected ? .white : .primary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }
                Divider()
                List(filtered) { exercise in
                    Button {
                        addToPlan(exercise.name)
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(exercise.name)
                                Text(exercise.muscle)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if (appState.dayPlans[dayId] ?? []).contains(exercise.name) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(appState.accentColor)
                            } else {
                                Image(systemName: "plus.circle")
                                    .foregroundStyle(appState.accentColor)
                            }
                        }
                    }
                }
                .listStyle(.plain)
            }
            .searchable(text: $searchText, prompt: "Search exercises")
            .navigationTitle("Add to Plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private var filtered: [Exercise] {
        appState.allExercises.filter { ex in
            let matchesMuscle = selectedMuscle == nil || ex.muscle == selectedMuscle
            let matchesSearch = searchText.isEmpty || ex.name.localizedCaseInsensitiveContains(searchText)
            return matchesMuscle && matchesSearch
        }
    }

    private func addToPlan(_ name: String) {
        var current = appState.dayPlans[dayId] ?? []
        if !current.contains(name) {
            current.append(name)
            appState.dayPlans[dayId] = current
            appState.save()
        }
    }
}

// MARK: - Theme Section View

struct ThemeSectionView: View {
    @Environment(AppState.self) private var appState

    private let presetColors: [(name: String, hex: String)] = [
        ("Orange", "#ff6b35"),
        ("Cyan", "#00c3ff"),
        ("Lime", "#a8ff3e"),
        ("Purple", "#bf5af2"),
        ("Pink", "#ff375f")
    ]

    @State private var showCustomHex = false
    @State private var customHexInput = ""

    var body: some View {
        Picker("Theme", selection: Binding(
            get: { appState.themeMode },
            set: { appState.themeMode = $0; appState.save() }
        )) {
            ForEach(ThemeMode.allCases, id: \.self) { mode in
                Text(mode.displayName).tag(mode)
            }
        }
        .pickerStyle(.segmented)
        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))

        // Color presets
        HStack(spacing: 10) {
            ForEach(presetColors, id: \.hex) { color in
                Button {
                    appState.accentHex = color.hex
                    appState.save()
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color(hex: color.hex) ?? .orange)
                            .frame(width: 36, height: 36)
                        if appState.accentHex == color.hex {
                            Image(systemName: "checkmark")
                                .font(.caption.bold())
                                .foregroundStyle(.white)
                        }
                    }
                }
                .buttonStyle(.plain)
            }

            Spacer()

            Button {
                customHexInput = appState.accentHex
                showCustomHex.toggle()
            } label: {
                Text("Custom")
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(Color(.secondarySystemBackground)))
            }
            .buttonStyle(.plain)
        }

        if showCustomHex {
            HStack {
                Text("Hex")
                TextField("#ff6b35", text: $customHexInput)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .onChange(of: customHexInput) { _, v in
                        if Color(hex: v) != nil {
                            appState.accentHex = v
                            appState.save()
                        }
                    }
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(hex: customHexInput) ?? .gray)
                    .frame(width: 28, height: 28)
            }
        }
    }
}

// MARK: - Custom Exercises View

struct CustomExercisesView: View {
    @Environment(AppState.self) private var appState
    @State private var showAddForm = false

    var body: some View {
        List {
            ForEach(appState.customExercises) { exercise in
                VStack(alignment: .leading, spacing: 4) {
                    Text(exercise.name)
                        .font(.headline)
                    HStack(spacing: 8) {
                        Text(exercise.muscle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("•")
                            .foregroundStyle(.tertiary)
                        Text("\(exercise.targetSets) × \(exercise.targetReps)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
            }
            .onDelete { indexSet in
                appState.customExercises.remove(atOffsets: indexSet)
                appState.save()
            }

            Button {
                showAddForm = true
            } label: {
                Label("Add Custom Exercise", systemImage: "plus.circle.fill")
                    .foregroundStyle(appState.accentColor)
            }
        }
        .navigationTitle("Custom Exercises")
        .toolbar { EditButton() }
        .sheet(isPresented: $showAddForm) {
            AddCustomExerciseView()
        }
    }
}

// MARK: - Add Custom Exercise View

struct AddCustomExerciseView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var muscle = "Chest"
    @State private var targetSets = "3"
    @State private var targetReps = "10"
    @State private var targetWeight = ""
    @State private var isCardio = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Exercise Info") {
                    TextField("Exercise Name", text: $name)
                    Picker("Muscle Group", selection: $muscle) {
                        ForEach(DataService.muscleOrder, id: \.self) { m in
                            Text(m).tag(m)
                        }
                    }
                    Toggle("Is Cardio", isOn: $isCardio)
                }

                Section("Targets") {
                    HStack {
                        Text("Target Sets")
                        Spacer()
                        TextField("3", text: $targetSets)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 60)
                    }
                    HStack {
                        Text("Target Reps")
                        Spacer()
                        TextField("10", text: $targetReps)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 60)
                    }
                    HStack {
                        Text("Target Weight (lbs)")
                        Spacer()
                        TextField("0", text: $targetWeight)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                    }
                }
            }
            .navigationTitle("New Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func save() {
        let exercise = Exercise(
            name: name.trimmingCharacters(in: .whitespaces),
            muscle: muscle,
            met: 4.5,
            targetSets: targetSets,
            targetReps: targetReps,
            targetWeight: Double(targetWeight) ?? 0,
            isCardio: isCardio
        )
        appState.customExercises.append(exercise)
        appState.save()
        dismiss()
    }
}
