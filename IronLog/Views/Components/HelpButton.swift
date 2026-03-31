import SwiftUI
import SafariServices

// MARK: - SafariView wrapper

struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        let config = SFSafariViewController.Configuration()
        config.entersReaderIfAvailable = false
        config.barCollapsingEnabled = true
        let vc = SFSafariViewController(url: url, configuration: config)
        return vc
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

// MARK: - Help button

struct HelpButton: View {
    let exerciseName: String
    let dataService: DataService

    @State private var showSafari = false
    @State private var showNoVideo = false
    @State private var videoURL: URL? = nil

    var body: some View {
        Button {
            handleTap()
        } label: {
            ZStack {
                Circle()
                    .fill(Color(.tertiarySystemBackground))
                    .frame(width: 28, height: 28)
                Text("?")
                    .font(.subheadline.bold())
                    .foregroundStyle(.secondary)
            }
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showSafari) {
            if let url = videoURL {
                SafariView(url: url)
                    .ignoresSafeArea()
            }
        }
        .alert("No Help Video", isPresented: $showNoVideo) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("No help video is available for \"\(exerciseName)\" yet.")
        }
    }

    private func handleTap() {
        if let video = dataService.helpVideo(for: exerciseName),
           let url = URL(string: "https://www.youtube.com/watch?v=\(video.youtubeId)") {
            videoURL = url
            showSafari = true
        } else {
            showNoVideo = true
        }
    }
}
