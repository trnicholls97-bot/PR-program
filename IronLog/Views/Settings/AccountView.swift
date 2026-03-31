import SwiftUI

struct AccountView: View {
    @Environment(AppState.self) private var appState
    @State private var isSigningIn = false
    @State private var showSignOutAlert = false

    var body: some View {
        VStack {
            if appState.isSignedIn {
                signedInView
            } else {
                signedOutView
            }
        }
        .navigationTitle("Account")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Signed out view

    private var signedOutView: some View {
        VStack(spacing: 32) {
            Spacer()

            // Logo
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(appState.accentColor.opacity(0.15))
                        .frame(width: 100, height: 100)
                    Image(systemName: "dumbbell.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(appState.accentColor)
                }
                Text("IronLog")
                    .font(.largeTitle.bold())
                Text("Track your gains")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            // Sign in button
            VStack(spacing: 16) {
                Button {
                    signInWithGoogle()
                } label: {
                    HStack(spacing: 12) {
                        if isSigningIn {
                            ProgressView()
                                .tint(.primary)
                        } else {
                            Image(systemName: "globe")
                                .font(.title3)
                        }
                        Text(isSigningIn ? "Signing in..." : "Sign in with Google")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color(.secondarySystemBackground))
                    .foregroundStyle(.primary)
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .strokeBorder(Color(.separator), lineWidth: 0.5)
                    )
                }
                .disabled(isSigningIn)

                VStack(spacing: 6) {
                    Text("Your data is saved locally without an account.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Text("Sign in to enable cloud backup and sync across devices.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Text("Note: Cloud sync requires Firebase setup — see README")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 32)
            }

            Spacer()
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Signed in view

    private var signedInView: some View {
        List {
            Section {
                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(appState.accentColor.opacity(0.2))
                            .frame(width: 56, height: 56)
                        Text(initials)
                            .font(.title2.bold())
                            .foregroundStyle(appState.accentColor)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        if let name = appState.currentUser?.displayName, !name.isEmpty {
                            Text(name)
                                .font(.headline)
                        }
                        if let email = appState.currentUser?.email {
                            Text(email)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.vertical, 8)
            }

            Section("Sync Status") {
                HStack {
                    Image(systemName: "icloud.slash")
                        .foregroundStyle(.orange)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Cloud Sync Pending")
                            .font(.subheadline)
                        Text("Firebase setup required for sync to activate")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Section {
                Button(role: .destructive) {
                    showSignOutAlert = true
                } label: {
                    HStack {
                        Spacer()
                        Text("Sign Out")
                            .font(.headline)
                        Spacer()
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .alert("Sign Out?", isPresented: $showSignOutAlert) {
            Button("Sign Out", role: .destructive) {
                appState.firebaseService.signOut()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Your data will remain saved locally on this device.")
        }
    }

    // MARK: - Helpers

    private var initials: String {
        let name = appState.currentUser?.displayName ?? appState.currentUser?.email ?? "?"
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return String((parts[0].first ?? "?")).uppercased() + String((parts[1].first ?? "?")).uppercased()
        }
        return String(name.prefix(1)).uppercased()
    }

    private func signInWithGoogle() {
        isSigningIn = true
        Task {
            await appState.firebaseService.signInWithGoogle()
            await MainActor.run {
                isSigningIn = false
            }
        }
    }
}
